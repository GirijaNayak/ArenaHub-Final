import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, signSessionToken, SessionPayload, AppRole } from "@/lib/auth";
import { z } from "zod";
import { registerSchema, loginSchema } from "@/lib/validations";

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new Error("An account with this email address already exists");
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() },
    });
    if (existingUsername) {
      throw new Error("This username is already taken");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role || "PLAYER",
        inGameId: data.inGameId || null,
        inGameName: data.inGameName || null,
      },
    });

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as AppRole,
    };

    const token = await signSessionToken(sessionPayload);

    // Initial notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to ArenaHub!",
        message: "Your battle-royale esports operations platform is ready. Discover tournaments, register squads, and track room credentials.",
        type: "SYSTEM",
        linkUrl: "/tournaments",
      },
    });

    return { user: sessionPayload, token };
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        orgMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const activeOrgId = user.orgMemberships[0]?.organizationId;

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as AppRole,
      activeOrgId,
    };

    const token = await signSessionToken(sessionPayload);
    return { user: sessionPayload, token };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        inGameId: true,
        inGameName: true,
        createdAt: true,
        orgMemberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, status: true, logoUrl: true },
            },
          },
        },
        teamsLed: {
          include: {
            players: true,
            _count: { select: { tournamentRegistrations: true } },
          },
        },
        teamPlayerProfiles: {
          include: {
            team: {
              include: {
                captain: { select: { id: true, username: true } },
              },
            },
          },
        },
        registrationsCreated: {
          include: {
            tournament: {
              select: {
                id: true,
                title: true,
                slug: true,
                game: true,
                status: true,
                tournamentStart: true,
                organization: { select: { name: true } },
              },
            },
            team: { select: { id: true, name: true, tag: true } },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    return user;
  }
}
