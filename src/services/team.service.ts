import { prisma } from "@/lib/db";
import { z } from "zod";
import { createTeamSchema, addTeamPlayerSchema } from "@/lib/validations";

export class TeamService {
  /**
   * Create a new competitive 4-player squad team
   */
  static async create(
    captainId: string,
    data: z.infer<typeof createTeamSchema>
  ) {
    // Check unique tag
    const existingTag = await prisma.team.findUnique({
      where: { tag: data.tag.toUpperCase() },
    });

    if (existingTag) {
      throw new Error(`Team tag [${data.tag.toUpperCase()}] is already in use by another team`);
    }

    const team = await prisma.team.create({
      data: {
        name: data.name,
        tag: data.tag.toUpperCase(),
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        captainId,
        players: {
          create: data.players.map((p) => ({
            playerName: p.playerName,
            inGameId: p.inGameId,
            role: p.role || "PLAYER",
          })),
        },
      },
      include: {
        captain: { select: { id: true, name: true, username: true } },
        players: true,
      },
    });

    // Update user role to TEAM_CAPTAIN if currently PLAYER
    await prisma.user.updateMany({
      where: { id: captainId, role: "PLAYER" },
      data: { role: "TEAM_CAPTAIN" },
    });

    return team;
  }

  /**
   * Add a player to the team roster (max 5 players: 4 squad + 1 sub)
   */
  static async addPlayer(
    captainId: string,
    teamId: string,
    data: z.infer<typeof addTeamPlayerSchema>
  ) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== captainId) {
      throw new Error("Only the team captain can manage the roster");
    }

    if (team.players.length >= 5) {
      throw new Error("Roster capacity reached (maximum 5 players: 4 squad members + 1 substitute)");
    }

    // Check duplicate inGameId on team
    const duplicate = team.players.find((p) => p.inGameId === data.inGameId);
    if (duplicate) {
      throw new Error(`Game ID ${data.inGameId} is already registered on this team`);
    }

    // Link userId if matching user exists
    const matchingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { inGameId: data.inGameId },
          { username: data.playerName.toLowerCase() },
        ],
      },
      select: { id: true },
    });

    const player = await prisma.teamPlayer.create({
      data: {
        teamId,
        playerName: data.playerName,
        inGameId: data.inGameId,
        role: data.role || "PLAYER",
        userId: matchingUser?.id || null,
      },
    });

    return player;
  }

  /**
   * Remove a player from the team roster
   */
  static async removePlayer(
    captainId: string,
    teamId: string,
    playerId: string
  ) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== captainId) {
      throw new Error("Only the team captain can modify the roster");
    }

    const player = team.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player not found on this team");

    if (player.role === "CAPTAIN") {
      throw new Error("Cannot remove the team captain. Transfer captain role first.");
    }

    await prisma.teamPlayer.delete({
      where: { id: playerId },
    });

    return { success: true };
  }

  /**
   * List competitive teams
   */
  static async list({
    search,
    limit = 20,
  }: {
    search?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
      ];
    }

    return prisma.team.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        captain: { select: { id: true, name: true, username: true } },
        players: true,
        _count: {
          select: { tournamentRegistrations: true, lobbyAssignments: true },
        },
      },
    });
  }

  /**
   * Get team profile by ID with roster and tournament registrations
   */
  static async getById(teamId: string) {
    return prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: { select: { id: true, name: true, username: true, email: true } },
        players: true,
        tournamentRegistrations: {
          include: {
            tournament: {
              select: {
                id: true,
                title: true,
                slug: true,
                game: true,
                status: true,
                tournamentStart: true,
              },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
        lobbyAssignments: {
          include: {
            lobby: {
              select: {
                id: true,
                title: true,
                mapName: true,
                scheduledTime: true,
                status: true,
                tournament: { select: { title: true, slug: true } },
              },
            },
          },
        },
        lobbyResults: {
          include: {
            lobby: {
              select: {
                id: true,
                title: true,
                tournament: { select: { title: true, slug: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });
  }
}
