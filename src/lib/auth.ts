import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const AUTH_COOKIE_NAME = "arenahub_session";
function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "arenahub-super-secret-development-key-32-chars-long!" || secret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION: AUTH_SECRET must be set to a secure key of at least 32 characters in production"
      );
    }
    return secret;
  }
  return secret || "arenahub-super-secret-development-key-32-chars-long!";
}

export type AppRole =
  | "PLAYER"
  | "TEAM_CAPTAIN"
  | "TOURNAMENT_ORGANIZER"
  | "REFEREE"
  | "SPECTATOR"
  | "PLATFORM_ADMIN";

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  name: string;
  role: AppRole;
  activeOrgId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return jwt.sign(payload, getJwtSecret(), { algorithm: "HS256", expiresIn: "7d" });
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Strict server-side authentication assertion
 */
export async function requireAuth(req?: NextRequest): Promise<SessionPayload> {
  const session = await getSessionUser(req);
  if (!session) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session;
}

/**
 * Platform Admin super-user check
 */
export async function requirePlatformAdmin(req?: NextRequest): Promise<SessionPayload> {
  const session = await requireAuth(req);
  if (session.role !== "PLATFORM_ADMIN") {
    throw new Error("Forbidden: Platform administrator credentials required");
  }
  return session;
}

export function requireRole(session: SessionPayload, allowedRoles: string[]): boolean {
  if (session.role === "PLATFORM_ADMIN") return true;
  return allowedRoles.includes(session.role as string);
}

/**
 * Multi-tenant organization membership check
 */
export async function requireOrgMembership(
  userId: string,
  organizationId: string
) {
  const membership = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden: You are not a member of this organization");
  }

  if (membership.organization.status === "SUSPENDED") {
    throw new Error("Forbidden: This organization is currently suspended");
  }

  return membership;
}

/**
 * Multi-tenant organization staff role assertion
 */
export async function requireOrgStaff(
  userId: string,
  userRole: AppRole,
  organizationId: string,
  allowedRoles: string[] = ["TOURNAMENT_ORGANIZER", "REFEREE"]
) {
  if (userRole === "PLATFORM_ADMIN") {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new Error("Organization not found");
    if (org.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }
    return { organization: org, role: "PLATFORM_ADMIN" };
  }

  const membership = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden: You are not authorized for this organization");
  }

  if (membership.organization.status === "SUSPENDED") {
    throw new Error("Forbidden: This organization is currently suspended");
  }

  const isOwner = membership.organization.ownerId === userId;
  if (!isOwner && !allowedRoles.includes(membership.role)) {
    throw new Error(`Forbidden: Required staff role in this organization: [${allowedRoles.join(", ")}]`);
  }

  return membership;
}

/**
 * Multi-tenant organization role assertion
 */
export async function requireOrgRole(
  userId: string,
  organizationId: string,
  allowedRoles: string[]
) {
  const membership = await requireOrgMembership(userId, organizationId);
  if (!allowedRoles.includes(membership.role)) {
    throw new Error(`Forbidden: Required organization role [${allowedRoles.join(", ")}]`);
  }
  return membership;
}

/**
 * Team Captain check
 */
export async function requireTeamCaptain(userId: string, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { captain: true },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  if (team.captainId !== userId) {
    throw new Error("Forbidden: Only the team captain can perform this operation");
  }

  return team;
}

/**
 * Critical Server-Side Room Credential Security Engine
 * Rules:
 * 1. Spectator can NEVER access credentials
 * 2. Unassigned teams cannot access credentials
 * 3. Assigned team players/captains can ONLY access credentials when now >= revealTime
 * 4. Tournament organizers and assigned referees can access credentials at any time
 */
export async function canAccessRoomCredentials(
  userId: string,
  userRole: AppRole,
  lobbyId: string
): Promise<{ canAccess: boolean; reason?: string; isOfficial?: boolean }> {
  if (userRole === "PLATFORM_ADMIN") {
    return { canAccess: true, isOfficial: true };
  }

  if (userRole === "SPECTATOR") {
    return { canAccess: false, reason: "Spectators are strictly prohibited from viewing private room credentials." };
  }

  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: {
      tournament: {
        include: {
          organization: {
            include: {
              members: { where: { userId } },
            },
          },
        },
      },
      teams: {
        include: {
          team: {
            include: {
              players: true,
            },
          },
        },
      },
    },
  });

  if (!lobby) {
    return { canAccess: false, reason: "Lobby not found" };
  }

  // 1. Check if user is Tournament Organizer or Referee of this organization
  const orgMember = lobby.tournament.organization.members[0];
  if (
    lobby.tournament.organizerId === userId ||
    (orgMember && (orgMember.role === "TOURNAMENT_ORGANIZER" || orgMember.role === "REFEREE"))
  ) {
    return { canAccess: true, isOfficial: true };
  }

  // 2. Check if user belongs to an assigned team in this lobby
  const isAssigned = lobby.teams.some(
    (lt) =>
      lt.team.captainId === userId ||
      lt.team.players.some((p) => p.userId === userId)
  );

  if (!isAssigned) {
    return { canAccess: false, reason: "Your team is not assigned to this battle-royale lobby." };
  }

  // 3. Time-restricted reveal validation
  const now = new Date();
  const revealTime = new Date(lobby.revealTime);

  if (now < revealTime) {
    const diffMinutes = Math.ceil((revealTime.getTime() - now.getTime()) / (1000 * 60));
    return {
      canAccess: false,
      reason: `Room credentials are locked. Scheduled reveal in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} (${revealTime.toLocaleTimeString()}).`,
    };
  }

  return { canAccess: true, isOfficial: false };
}
