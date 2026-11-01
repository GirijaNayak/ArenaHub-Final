import { prisma } from "@/lib/db";
import { z } from "zod";
import { createTournamentSchema, updateTournamentStatusSchema } from "@/lib/validations";
import { StandingsService } from "./standings.service";
import { DEFAULT_BGMI_SCORING } from "./scoring.service";

export class TournamentService {
  /**
   * Create a new Battle-Royale tournament scoped to an Organization
   */
  static async create(
    organizerId: string,
    data: z.infer<typeof createTournamentSchema>
  ) {
    // Verify membership in organization
    const membership = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId: organizerId,
        },
      },
      include: { organization: true },
    });

    if (!membership || membership.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: You must be an active member of this organization");
    }

    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const scoringConfigStr = data.scoringConfig || JSON.stringify(DEFAULT_BGMI_SCORING);

    const tournament = await prisma.tournament.create({
      data: {
        organizationId: data.organizationId,
        organizerId,
        title: data.title,
        slug,
        description: data.description,
        game: data.game || "BGMI",
        rules: data.rules,
        teamCapacity: data.teamCapacity,
        teamSize: data.teamSize || 4,
        scoringConfig: scoringConfigStr,
        registrationStart: new Date(data.registrationStart),
        registrationEnd: new Date(data.registrationEnd),
        tournamentStart: new Date(data.tournamentStart),
        tournamentEnd: data.tournamentEnd ? new Date(data.tournamentEnd) : null,
        prizePool: data.prizePool,
        bannerUrl: data.bannerUrl || null,
        status: "DRAFT",
      },
      include: {
        organization: true,
        organizer: { select: { id: true, name: true, username: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: organizerId,
        organizationId: data.organizationId,
        action: "TOURNAMENT_CREATED",
        entityType: "TOURNAMENT",
        entityId: tournament.id,
        metadata: JSON.stringify({ title: tournament.title, capacity: tournament.teamCapacity }),
      },
    });

    return tournament;
  }

  /**
   * List tournaments with multi-tenant filtering, search, and pagination
   */
  static async list({
    search,
    game,
    status,
    organizationId,
    page = 1,
    limit = 12,
  }: {
    search?: string;
    game?: string;
    status?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (game) where.game = game;
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;

    const [total, tournaments] = await Promise.all([
      prisma.tournament.count({ where }),
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { tournamentStart: "asc" }],
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
          organizer: { select: { username: true } },
          _count: {
            select: { registrations: true, lobbies: true },
          },
        },
      }),
    ]);

    return {
      tournaments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single tournament by slug with lobbies, registrations, and live standings
   */
  static async getBySlug(slug: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } },
        organizer: { select: { id: true, name: true, username: true } },
        registrations: {
          include: {
            team: {
              include: {
                players: true,
                captain: { select: { id: true, name: true, username: true } },
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
        lobbies: {
          include: {
            teams: {
              include: {
                team: { select: { id: true, name: true, tag: true } },
              },
              orderBy: { slotNumber: "asc" },
            },
            results: {
              include: {
                team: { select: { id: true, name: true, tag: true } },
              },
              orderBy: { placement: "asc" },
            },
            _count: { select: { disputes: true } },
          },
          orderBy: { lobbyNumber: "asc" },
        },
      },
    });

    if (!tournament) return null;

    // Compute live standings
    const standings = await StandingsService.getTournamentStandings(tournament.id);

    return {
      ...tournament,
      standings,
    };
  }

  /**
   * Register a 4-player squad for a tournament
   */
  static async registerSquad(
    userId: string,
    tournamentId: string,
    teamId: string
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: true,
      },
    });

    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "REGISTRATION_OPEN") {
      throw new Error(`Registration is not currently open (Status: ${tournament.status})`);
    }

    const now = new Date();
    if (now < new Date(tournament.registrationStart)) {
      throw new Error("Registration has not yet started");
    }
    if (now > new Date(tournament.registrationEnd)) {
      throw new Error("Registration deadline has passed");
    }

    if (tournament.registrations.length >= tournament.teamCapacity) {
      throw new Error(`Tournament capacity of ${tournament.teamCapacity} teams has been reached`);
    }

    // Verify user is team captain
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== userId) {
      throw new Error("Only the team captain can register the team for a tournament");
    }

    // Check squad roster size requirement (default 4)
    if (team.players.length < tournament.teamSize) {
      throw new Error(
        `Your roster has ${team.players.length} player(s). A full squad of at least ${tournament.teamSize} players is required to enter.`
      );
    }

    // Check duplicate registration
    const existing = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId,
        },
      },
    });

    if (existing) {
      throw new Error("Your team is already registered for this tournament");
    }

    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamId,
        registeredById: userId,
        status: "CONFIRMED",
      },
      include: {
        team: true,
      },
    });

    // Notify captain
    await prisma.notification.create({
      data: {
        userId,
        title: "Tournament Registration Confirmed",
        message: `Team [${team.tag}] ${team.name} successfully registered for ${tournament.title}.`,
        type: "REGISTRATION",
        linkUrl: `/tournaments/${tournament.slug}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: tournament.organizationId,
        action: "TEAM_REGISTERED",
        entityType: "TOURNAMENT",
        entityId: tournament.id,
        metadata: JSON.stringify({ teamId, teamTag: team.tag }),
      },
    });

    return registration;
  }

  /**
   * Transition tournament status with state machine validation
   */
  static async updateStatus(
    userId: string,
    tournamentId: string,
    newStatus: string
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: { include: { members: { where: { userId } } } },
      },
    });

    if (!tournament) throw new Error("Tournament not found");

    const isOrgMember =
      tournament.organizerId === userId ||
      tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isOrgMember) {
      throw new Error("Unauthorized: Only tournament organizers can modify lifecycle status");
    }

    const validTransitions: { [key: string]: string[] } = {
      DRAFT: ["REGISTRATION_OPEN", "CANCELLED"],
      REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "CANCELLED"],
      REGISTRATION_CLOSED: ["LIVE", "REGISTRATION_OPEN", "CANCELLED"],
      LIVE: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[tournament.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${tournament.status} to ${newStatus}`);
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: newStatus },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: tournament.organizationId,
        action: "TOURNAMENT_STATUS_CHANGED",
        entityType: "TOURNAMENT",
        entityId: tournament.id,
        metadata: JSON.stringify({ from: tournament.status, to: newStatus }),
      },
    });

    return updated;
  }
}
