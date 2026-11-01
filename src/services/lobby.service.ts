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
      include: { organization: { include: { members: { where: { userId: organizerId } } } } },
    });

    if (!tournament) throw new Error("Tournament not found");

    const isAuthorized =
      tournament.organizerId === organizerId ||
      tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isAuthorized) {
      throw new Error("Forbidden: Only organization organizers can create lobbies");
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
      include: { tournament: true },
    });

    if (!lobby) throw new Error("Lobby not found");

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
        tournament: true,
        teams: { include: { team: true } },
      },
    });

    if (!lobby) throw new Error("Lobby not found");

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
            message: `Credentials posted for ${lobby.title}. Will be unlocked at reveal time: ${new Date(updated.revealTime).toLocaleTimeString()}.`,
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
        action: "ROOM_CREDENTIALS_UPDATED",
        entityType: "LOBBY",
        entityId: lobby.id,
        metadata: JSON.stringify({
          status: updated.status,
          revealTime: updated.revealTime,
          hasRoomId: Boolean(updated.roomId),
        }),
      },
    });

    return updated;
  }

  /**
   * Retrieve lobby with strict server-side credential filtering
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
            scoringConfig: true,
            organizationId: true,
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
   * Submit match results for a team in the lobby
   */
  static async submitResult(
    userId: string,
    data: z.infer<typeof submitLobbyResultSchema>
  ) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: data.lobbyId },
      include: { tournament: true },
    });

    if (!lobby) throw new Error("Lobby not found");

    // Parse tournament scoring rules
    const scoringConfig = ScoringService.parseConfig(lobby.tournament.scoringConfig);
    const calculated = ScoringService.calculatePoints(data.placement, data.kills, scoringConfig);

    const result = await prisma.lobbyResult.upsert({
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
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: lobby.tournament.organizationId,
        action: "RESULT_SUBMITTED",
        entityType: "LOBBY_RESULT",
        entityId: result.id,
        metadata: JSON.stringify({
          placement: data.placement,
          kills: data.kills,
          totalPoints: calculated.totalPoints,
        }),
      },
    });

    return result;
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
        lobby: { include: { tournament: true } },
        team: true,
      },
    });

    if (!prev) throw new Error("Match result not found");

    const scoringConfig = ScoringService.parseConfig(prev.lobby.tournament.scoringConfig);
    const calculated = ScoringService.calculatePoints(data.placement, data.kills, scoringConfig);

    const updated = await prisma.lobbyResult.update({
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
    await prisma.notification.create({
      data: {
        userId: prev.team.captainId,
        title: "Match Result Verified",
        message: `Results for ${prev.lobby.title} verified: #${data.placement} with ${data.kills} kills (${calculated.totalPoints} pts).`,
        type: "RESULT",
        linkUrl: `/tournaments/${prev.lobby.tournament.slug}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: refereeId,
        organizationId: prev.lobby.tournament.organizationId,
        action: "RESULT_VERIFIED",
        entityType: "LOBBY_RESULT",
        entityId: resultId,
        metadata: JSON.stringify({
          previousPoints: prev.totalPoints,
          verifiedPoints: calculated.totalPoints,
          status: data.status,
        }),
      },
    });

    return updated;
  }
}
