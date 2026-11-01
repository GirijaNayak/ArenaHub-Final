import { prisma } from "@/lib/db";
import { canAccessRoomCredentials, AppRole } from "@/lib/auth";
import { ScoringService } from "./scoring.service";
import { z } from "zod";
import {
  createLobbySchema,
  updateLobbyCredentialsSchema,
  assignLobbyTeamSchema,
  submitLobbyResultSchema,
  verifyLobbyResultSchema,
} from "@/lib/validations";

export class LobbyService {
  /**
   * Create a new Battle-Royale lobby for a tournament
   */
  static async create(
    organizerId: string,
    data: z.infer<typeof createLobbySchema>
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: {
        organization: { include: { members: { where: { userId: organizerId } } } },
      },
    });

    if (!tournament) throw new Error("Tournament not found");

    if (tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const actorUser = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true },
    });
    const isPlatformAdmin = actorUser?.role === "PLATFORM_ADMIN";

    const isAuthorized =
      isPlatformAdmin ||
      tournament.organizerId === organizerId ||
      tournament.organization.ownerId === organizerId ||
      tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isAuthorized) {
      throw new Error("Forbidden: Only authorized organization organizers can create lobbies");
    }

    const scheduledTime = new Date(data.scheduledTime);
    const revealTime = new Date(data.revealTime);

    if (revealTime > scheduledTime) {
      throw new Error("Reveal time must be before or equal to match scheduled start time");
    }

    const lobby = await prisma.lobby.create({
      data: {
        tournamentId: data.tournamentId,
        lobbyNumber: data.lobbyNumber,
        title: data.title,
        mapName: data.mapName,
        scheduledTime,
        revealTime,
        roomId: data.roomId || null,
        roomPassword: data.roomPassword || null,
        status: data.roomId ? "ROOM_POSTED" : "SCHEDULED",
      },
      include: {
        teams: { include: { team: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: organizerId,
        organizationId: tournament.organizationId,
        action: "LOBBY_CREATED",
        entityType: "LOBBY",
        entityId: lobby.id,
        metadata: JSON.stringify({
          title: lobby.title,
          lobbyNumber: lobby.lobbyNumber,
          mapName: lobby.mapName,
        }),
      },
    });

    return lobby;
  }

  /**
   * Assign a registered team to a room slot (1-25)
   */
  static async assignTeam(
    organizerId: string,
    lobbyId: string,
    data: z.infer<typeof assignLobbyTeamSchema>
  ) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: {
        tournament: {
          include: {
            organization: { include: { members: { where: { userId: organizerId } } } },
          },
        },
      },
    });

    if (!lobby) throw new Error("Lobby not found");

    if (lobby.tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const actorUser = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true },
    });
    const isPlatformAdmin = actorUser?.role === "PLATFORM_ADMIN";

    const isAuthorized =
      isPlatformAdmin ||
      lobby.tournament.organizerId === organizerId ||
      lobby.tournament.organization.ownerId === organizerId ||
      lobby.tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isAuthorized) {
      throw new Error("Forbidden: Only tournament organizers of this organization can assign teams to slots");
    }

    // Verify team is registered for this tournament
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId: lobby.tournamentId,
          teamId: data.teamId,
        },
      },
      include: { team: true },
    });

    if (!registration || registration.status !== "CONFIRMED") {
      throw new Error("Team must have a confirmed registration in this tournament to be assigned");
    }

    // Check slot availability
    const existingSlot = await prisma.lobbyTeam.findUnique({
      where: {
        lobbyId_slotNumber: {
          lobbyId,
          slotNumber: data.slotNumber,
        },
      },
      include: { team: true },
    });

    if (existingSlot && existingSlot.teamId !== data.teamId) {
      throw new Error(`Slot #${data.slotNumber} is already occupied by [${existingSlot.team.tag}] ${existingSlot.team.name}`);
    }

    const assignment = await prisma.lobbyTeam.upsert({
      where: {
        lobbyId_teamId: {
          lobbyId,
          teamId: data.teamId,
        },
      },
      update: {
        slotNumber: data.slotNumber,
      },
      create: {
        lobbyId,
        teamId: data.teamId,
        slotNumber: data.slotNumber,
      },
      include: {
        team: true,
      },
    });

    // Notify captain
    await prisma.notification.create({
      data: {
        userId: registration.team.captainId,
        title: "Lobby Slot Assigned",
        message: `Your team ${registration.team.name} has been assigned to Slot #${data.slotNumber} for ${lobby.title}.`,
        type: "LOBBY",
        linkUrl: `/tournaments/${lobby.tournament.slug}`,
      },
    });

    return assignment;
  }

  /**
   * Update Room ID, Room Password, and reveal schedule
   */
  static async updateCredentials(
    actorId: string,
    lobbyId: string,
    data: z.infer<typeof updateLobbyCredentialsSchema>
  ) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: {
        tournament: {
          include: {
            organization: { include: { members: { where: { userId: actorId } } } },
          },
        },
        teams: { include: { team: true } },
      },
    });

    if (!lobby) throw new Error("Lobby not found");

    if (lobby.tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const actorUser = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });
    const isPlatformAdmin = actorUser?.role === "PLATFORM_ADMIN";

    const isAuthorized =
      isPlatformAdmin ||
      lobby.tournament.organizerId === actorId ||
      lobby.tournament.organization.ownerId === actorId ||
      lobby.tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isAuthorized) {
      throw new Error("Forbidden: Only organization organizers can update room credentials");
    }

    const updated = await prisma.lobby.update({
      where: { id: lobbyId },
      data: {
        ...(data.roomId !== undefined && { roomId: data.roomId || null }),
        ...(data.roomPassword !== undefined && { roomPassword: data.roomPassword || null }),
        ...(data.revealTime && { revealTime: new Date(data.revealTime) }),
        ...(data.status && { status: data.status }),
      },
    });

    // If room posted and has roomId, notify assigned team captains
    if (data.roomId && lobby.teams.length > 0) {
      for (const lt of lobby.teams) {
        await prisma.notification.create({
          data: {
            userId: lt.team.captainId,
            title: "Room Credentials Posted",
            message: `Room details for ${lobby.title} have been configured. Access will unlock at ${new Date(lobby.revealTime).toLocaleTimeString()}.`,
            type: "CREDENTIALS",
            linkUrl: `/tournaments/${lobby.tournament.slug}`,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        organizationId: lobby.tournament.organizationId,
        action: "LOBBY_CREDENTIALS_UPDATED",
        entityType: "LOBBY",
        entityId: lobby.id,
        metadata: JSON.stringify({
          status: updated.status,
          hasRoomId: !!updated.roomId,
          revealTime: updated.revealTime,
        }),
      },
    });

    return updated;
  }

  /**
   * Secure Lobby Fetcher with time-lock and role-aware credential filter
   */
  static async getLobbySecure(
    lobbyId: string,
    userId?: string,
    userRole?: AppRole
  ) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: {
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizerId: true,
            scoringConfig: true,
            organization: {
              select: {
                id: true,
                name: true,
                status: true,
                members: userId ? { where: { userId } } : false,
              },
            },
          },
        },
        teams: {
          include: {
            team: {
              include: {
                players: true,
                captain: { select: { id: true, name: true, username: true } },
              },
            },
          },
          orderBy: { slotNumber: "asc" },
        },
        results: {
          include: {
            team: { select: { id: true, name: true, tag: true, logoUrl: true } },
          },
          orderBy: { placement: "asc" },
        },
        disputes: {
          include: {
            team: { select: { name: true, tag: true } },
            raisedBy: { select: { username: true } },
            referee: { select: { username: true } },
          },
        },
      },
    });

    if (!lobby) return null;

    // Check credential authorization
    let canAccessCreds = false;
    let accessReason: string | undefined = undefined;

    if (userId && userRole) {
      const check = await canAccessRoomCredentials(userId, userRole, lobby.id);
      canAccessCreds = check.canAccess;
      accessReason = check.reason;
    } else {
      accessReason = "Authentication required to view room credentials.";
    }

    // If not authorized or reveal time not reached, scrub private credentials
    return {
      ...lobby,
      roomId: canAccessCreds ? lobby.roomId : null,
      roomPassword: canAccessCreds ? lobby.roomPassword : null,
      canAccessCredentials: canAccessCreds,
      credentialLockReason: accessReason,
    };
  }

  /**
   * Submit match results for a team in the lobby with IDOR, verified-lock, and transaction safeguards
   */
  static async submitResult(
    userId: string,
    data: z.infer<typeof submitLobbyResultSchema>
  ) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: data.lobbyId },
      include: {
        tournament: {
          include: {
            organization: {
              include: { members: { where: { userId } } },
            },
          },
        },
      },
    });

    if (!lobby) throw new Error("Lobby not found");

    if (lobby.tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    if (lobby.status === "CANCELLED") {
      throw new Error("Cannot submit results for a cancelled lobby");
    }

    // Verify caller authorization:
    // User MUST be:
    // 1. Team Captain of data.teamId, OR
    // 2. Roster member of data.teamId, OR
    // 3. Tournament Organizer / Referee of this organization, OR
    // 4. Platform Admin
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { players: true },
    });

    if (!team) throw new Error("Team not found");

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isPlatformAdmin = actor?.role === "PLATFORM_ADMIN";

    const isTeamMember =
      team.captainId === userId ||
      team.players.some((p) => p.userId === userId);

    const isOrgStaff =
      lobby.tournament.organizerId === userId ||
      lobby.tournament.organization.ownerId === userId ||
      lobby.tournament.organization.members.some((m) =>
        m.role === "TOURNAMENT_ORGANIZER" || m.role === "REFEREE"
      );

    if (!isPlatformAdmin && !isTeamMember && !isOrgStaff) {
      throw new Error("Forbidden: You are not authorized to submit match results for this squad");
    }

    // Check existing result lock: If status is already VERIFIED, only staff can overwrite
    const existing = await prisma.lobbyResult.findUnique({
      where: {
        lobbyId_teamId: {
          lobbyId: data.lobbyId,
          teamId: data.teamId,
        },
      },
    });

    if (existing && existing.status === "VERIFIED" && !isOrgStaff && !isPlatformAdmin) {
      throw new Error("Forbidden: This match result has been officially verified by referees. Submit a dispute to contest.");
    }

    // Parse tournament scoring rules
    const scoringConfig = ScoringService.parseConfig(lobby.tournament.scoringConfig);
    const calculated = ScoringService.calculatePoints(data.placement, data.kills, scoringConfig);

    // Atomic transaction for database consistency
    return prisma.$transaction(async (tx) => {
      const result = await tx.lobbyResult.upsert({
        where: {
          lobbyId_teamId: {
            lobbyId: data.lobbyId,
            teamId: data.teamId,
          },
        },
        update: {
          placement: data.placement,
          kills: data.kills,
          placementPoints: calculated.placementPoints,
          killPoints: calculated.killPoints,
          totalPoints: calculated.totalPoints,
          screenshotUrl: data.screenshotUrl || null,
          submittedById: userId,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        create: {
          lobbyId: data.lobbyId,
          teamId: data.teamId,
          placement: data.placement,
          kills: data.kills,
          placementPoints: calculated.placementPoints,
          killPoints: calculated.killPoints,
          totalPoints: calculated.totalPoints,
          screenshotUrl: data.screenshotUrl || null,
          submittedById: userId,
          status: "SUBMITTED",
        },
        include: {
          team: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          organizationId: lobby.tournament.organizationId,
          action: "RESULT_SUBMITTED",
          entityType: "LOBBY_RESULT",
          entityId: result.id,
          metadata: JSON.stringify({
            teamTag: team.tag,
            placement: data.placement,
            kills: data.kills,
            totalPoints: calculated.totalPoints,
          }),
        },
      });

      return result;
    });
  }

  /**
   * Referee/Organizer verifies or corrects match result
   */
  static async verifyResult(
    refereeId: string,
    resultId: string,
    data: z.infer<typeof verifyLobbyResultSchema>
  ) {
    const prev = await prisma.lobbyResult.findUnique({
      where: { id: resultId },
      include: {
        lobby: {
          include: {
            tournament: {
              include: {
                organization: {
                  include: { members: { where: { userId: refereeId } } },
                },
              },
            },
          },
        },
        team: true,
      },
    });

    if (!prev) throw new Error("Match result not found");

    if (prev.lobby.tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const actor = await prisma.user.findUnique({
      where: { id: refereeId },
      select: { role: true },
    });
    const isPlatformAdmin = actor?.role === "PLATFORM_ADMIN";

    const isStaff =
      isPlatformAdmin ||
      prev.lobby.tournament.organizerId === refereeId ||
      prev.lobby.tournament.organization.ownerId === refereeId ||
      prev.lobby.tournament.organization.members.some(
        (m) => m.role === "REFEREE" || m.role === "TOURNAMENT_ORGANIZER"
      );

    if (!isStaff) {
      throw new Error("Forbidden: Only official referees or organizers of this organization can verify match results");
    }

    const scoringConfig = ScoringService.parseConfig(prev.lobby.tournament.scoringConfig);
    const calculated = ScoringService.calculatePoints(data.placement, data.kills, scoringConfig);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lobbyResult.update({
        where: { id: resultId },
        data: {
          placement: data.placement,
          kills: data.kills,
          placementPoints: calculated.placementPoints,
          killPoints: calculated.killPoints,
          totalPoints: calculated.totalPoints,
          status: data.status,
          verifiedById: refereeId,
          verifiedAt: new Date(),
        },
      });

      // Notify captain
      await tx.notification.create({
        data: {
          userId: prev.team.captainId,
          title: "Match Result Verified",
          message: `Official referee verified Match Result for ${prev.lobby.title}. Squad finished #${data.placement} with ${data.kills} kills (${calculated.totalPoints} pts).`,
          type: "RESULT",
          linkUrl: `/tournaments/${prev.lobby.tournament.slug}`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: refereeId,
          organizationId: prev.lobby.tournament.organizationId,
          action: "RESULT_VERIFIED",
          entityType: "LOBBY_RESULT",
          entityId: resultId,
          metadata: JSON.stringify({
            placement: data.placement,
            kills: data.kills,
            totalPoints: calculated.totalPoints,
            status: data.status,
          }),
        },
      });

      return updated;
    });
  }
}
