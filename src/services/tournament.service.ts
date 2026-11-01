import { prisma } from "@/lib/db";
import { ScoringService, DEFAULT_BGMI_SCORING } from "./scoring.service";
import { StandingsService } from "./standings.service";
import { z } from "zod";
import { createTournamentSchema } from "@/lib/validations";

export class TournamentService {
  /**
   * Create a new Battle-Royale tournament scoped to an active organization
   */
  static async create(
    organizerId: string,
    data: z.infer<typeof createTournamentSchema>
  ) {
    // Verify organization and permissions
    const org = await prisma.organization.findUnique({
      where: { id: data.organizationId },
      include: {
        members: { where: { userId: organizerId } },
      },
    });

    if (!org) throw new Error("Organization not found");

    if (org.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const isOwner = org.ownerId === organizerId;
    const isOrgStaff = org.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    const actorUser = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true },
    });
    const isPlatformAdmin = actorUser?.role === "PLATFORM_ADMIN";

    if (!isOwner && !isOrgStaff && !isPlatformAdmin) {
      throw new Error("Forbidden: Only authorized tournament organizers of this organization can create tournaments");
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
   * List tournaments with tenant, status, and game filters
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
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (game && game !== "ALL") {
      where.game = game;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const skip = (page - 1) * limit;

    const [total, tournaments] = await Promise.all([
      prisma.tournament.count({ where }),
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
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
   * Security Hardening: Scrub private room credentials from all lobbies in the public view.
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

    // Security Invariant: Public tournament view MUST NEVER leak room credentials.
    // Credentials are exclusively served through getLobbySecure() after time-lock verification.
    const sanitizedLobbies = tournament.lobbies.map((lobby) => ({
      ...lobby,
      roomId: null,
      roomPassword: null,
    }));

    return {
      ...tournament,
      lobbies: sanitizedLobbies,
      standings,
    };
  }

  /**
   * Register a 4-player squad for a tournament with race-condition prevention
   */
  static async registerSquad(
    userId: string,
    tournamentId: string,
    teamId: string
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: true,
        registrations: true,
      },
    });

    if (!tournament) throw new Error("Tournament not found");

    if (tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended. Registrations are blocked.");
    }

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

    // Race-condition prevention: atomic capacity check & registration
    const registration = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.tournamentRegistration.count({
        where: { tournamentId },
      });

      if (currentCount >= tournament.teamCapacity) {
        throw new Error(`Tournament capacity of ${tournament.teamCapacity} teams has been reached`);
      }

      return tx.tournamentRegistration.create({
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
    });

    // Notify captain
    await prisma.notification.create({
      data: {
        userId,
        title: "Tournament Registration Confirmed",
        message: `Your squad ${team.name} has been confirmed for ${tournament.title}. Prepare for lobby slotting!`,
        type: "REGISTRATION",
        linkUrl: `/tournaments/${tournament.slug}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: tournament.organizationId,
        action: "SQUAD_REGISTERED",
        entityType: "TOURNAMENT",
        entityId: tournament.id,
        metadata: JSON.stringify({ teamName: team.name, teamTag: team.tag }),
      },
    });

    return registration;
  }

  /**
   * Transition tournament status with state machine and authorization validation
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

    if (tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isPlatformAdmin = actor?.role === "PLATFORM_ADMIN";

    const isOrgMember =
      isPlatformAdmin ||
      tournament.organizerId === userId ||
      tournament.organization.ownerId === userId ||
      tournament.organization.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isOrgMember) {
      throw new Error("Forbidden: Only tournament organizers of this organization can modify lifecycle status");
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
        action: "TOURNAMENT_STATUS_UPDATED",
        entityType: "TOURNAMENT",
        entityId: tournament.id,
        metadata: JSON.stringify({ from: tournament.status, to: newStatus }),
      },
    });

    return updated;
  }
}
