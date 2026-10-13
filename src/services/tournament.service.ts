import { prisma } from "@/lib/db";
import { z } from "zod";
import { createTournamentSchema } from "@/lib/validations";
import { BracketService, ParticipantInfo } from "./bracket.service";

export class TournamentService {
  static async create(organizerId: string, data: z.infer<typeof createTournamentSchema>) {
    // Generate URL friendly slug
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const tournament = await prisma.tournament.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        gameId: data.gameId,
        organizerId,
        type: data.type,
        format: data.format,
        maxParticipants: data.maxParticipants,
        registrationDeadline: new Date(data.registrationDeadline),
        startDate: new Date(data.startDate),
        rulesText: data.rulesText,
        prizePool: data.prizePool,
        bannerUrl: data.bannerUrl || null,
        status: "REGISTRATION_OPEN",
      },
      include: {
        game: true,
        organizer: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return tournament;
  }

  static async list({
    search,
    gameSlug,
    status,
    type,
    page = 1,
    limit = 12,
  }: {
    search?: string;
    gameSlug?: string;
    status?: string;
    type?: string;
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

    if (gameSlug) {
      where.game = { slug: gameSlug };
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [total, tournaments] = await Promise.all([
      prisma.tournament.count({ where }),
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
        include: {
          game: true,
          organizer: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: { registrations: true },
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

  static async getBySlug(slug: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        game: true,
        organizer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        registrations: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
            team: { select: { id: true, name: true, tag: true, logoUrl: true } },
          },
          orderBy: { registeredAt: "asc" },
        },
        matches: {
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        },
      },
    });

    return tournament;
  }

  static async register(userId: string, tournamentId: string, teamId?: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: true,
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== "REGISTRATION_OPEN" && tournament.status !== "UPCOMING") {
      throw new Error(`Registration is closed for this tournament (Status: ${tournament.status})`);
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      throw new Error("The registration deadline has passed");
    }

    if (tournament.registrations.length >= tournament.maxParticipants) {
      throw new Error("Tournament has reached maximum capacity");
    }

    if (tournament.type === "TEAM") {
      if (!teamId) {
        throw new Error("A team must be selected to register for team tournaments");
      }

      // Check if user is captain or member of the team
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId, userId },
        },
      });

      if (!membership || membership.role !== "CAPTAIN") {
        throw new Error("Only the team captain can register the team for a tournament");
      }

      // Check if team already registered
      const existing = await prisma.tournamentRegistration.findUnique({
        where: {
          tournamentId_teamId: { tournamentId, teamId },
        },
      });

      if (existing) {
        throw new Error("Your team is already registered for this tournament");
      }

      const registration = await prisma.tournamentRegistration.create({
        data: {
          tournamentId,
          teamId,
          status: "CONFIRMED",
        },
        include: {
          team: true,
        },
      });

      return registration;
    } else {
      // Solo tournament
      const existing = await prisma.tournamentRegistration.findUnique({
        where: {
          tournamentId_userId: { tournamentId, userId },
        },
      });

      if (existing) {
        throw new Error("You are already registered for this tournament");
      }

      const registration = await prisma.tournamentRegistration.create({
        data: {
          tournamentId,
          userId,
          status: "CONFIRMED",
        },
        include: {
          user: true,
        },
      });

      return registration;
    }
  }

  static async startTournament(userId: string, userRole: string, tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          include: {
            user: true,
            team: true,
          },
        },
      },
    });

    if (!tournament) throw new Error("Tournament not found");

    if (userRole !== "ADMIN" && tournament.organizerId !== userId) {
      throw new Error("Unauthorized: Only tournament organizer or admin can start the event");
    }

    if (tournament.registrations.length < 2) {
      throw new Error("Cannot start tournament with fewer than 2 registered participants");
    }

    // Format participants
    const participants: ParticipantInfo[] = tournament.registrations.map((reg) => {
      if (tournament.type === "TEAM" && reg.team) {
        return { id: reg.team.id, name: `[${reg.team.tag}] ${reg.team.name}` };
      }
      return { id: reg.user?.id || reg.id, name: reg.user?.username || "Player" };
    });

    // Update status to ONGOING
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "ONGOING" },
    });

    // Generate bracket matches
    const matches = await BracketService.generateSingleElimination(tournamentId, participants);

    // Notify registered participants
    for (const reg of tournament.registrations) {
      const recipientId = reg.userId || (reg.team ? reg.team.captainId : null);
      if (recipientId) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            title: "Tournament Bracket Live!",
            message: `${tournament.title} has started! Check your bracket and match schedule.`,
            type: "TOURNAMENT",
            linkUrl: `/tournaments/${tournament.slug}`,
          },
        });
      }
    }

    return matches;
  }

  static async updateStatus(
    userId: string,
    userRole: string,
    tournamentId: string,
    newStatus: string
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) throw new Error("Tournament not found");

    if (userRole !== "ADMIN" && tournament.organizerId !== userId) {
      throw new Error("Unauthorized to modify tournament status");
    }

    // Validate lifecycle transitions
    const validTransitions: { [key: string]: string[] } = {
      DRAFT: ["UPCOMING", "REGISTRATION_OPEN", "CANCELLED"],
      UPCOMING: ["REGISTRATION_OPEN", "CANCELLED"],
      REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "ONGOING", "CANCELLED"],
      REGISTRATION_CLOSED: ["ONGOING", "REGISTRATION_OPEN", "CANCELLED"],
      ONGOING: ["COMPLETED", "CANCELLED"],
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

    return updated;
  }

  static async getStandings(tournamentId: string) {
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: "desc" }, { matchNumber: "asc" }],
    });

    if (matches.length === 0) {
      return [];
    }

    const maxRound = Math.max(...matches.map((m) => m.round));
    const finalMatch = matches.find((m) => m.round === maxRound);

    const standings: Array<{ rank: number; name: string; id: string; status: string }> = [];

    if (finalMatch && finalMatch.status === "COMPLETED" && finalMatch.winnerId) {
      // 1st place: Champion
      const champName =
        finalMatch.winnerId === finalMatch.participant1Id
          ? finalMatch.participant1Name
          : finalMatch.participant2Name;
      standings.push({
        rank: 1,
        id: finalMatch.winnerId,
        name: champName || "Champion",
        status: "Champion",
      });

      // 2nd place: Runner-up
      const runnerUpId =
        finalMatch.winnerId === finalMatch.participant1Id
          ? finalMatch.participant2Id
          : finalMatch.participant1Id;
      const runnerUpName =
        finalMatch.winnerId === finalMatch.participant1Id
          ? finalMatch.participant2Name
          : finalMatch.participant1Name;
      if (runnerUpId) {
        standings.push({
          rank: 2,
          id: runnerUpId,
          name: runnerUpName || "Runner-up",
          status: "Finalist",
        });
      }

      // 3rd & 4th place: Semi-finalists
      if (maxRound > 1) {
        const semiMatches = matches.filter((m) => m.round === maxRound - 1);
        for (const semi of semiMatches) {
          if (semi.status === "COMPLETED" && semi.winnerId) {
            const loserId =
              semi.winnerId === semi.participant1Id
                ? semi.participant2Id
                : semi.participant1Id;
            const loserName =
              semi.winnerId === semi.participant1Id
                ? semi.participant2Name
                : semi.participant1Name;
            if (loserId && loserId !== runnerUpId && loserId !== finalMatch.winnerId) {
              standings.push({
                rank: 3,
                id: loserId,
                name: loserName || "Semifinalist",
                status: "3rd-4th Place",
              });
            }
          }
        }
      }
    }

    return standings;
  }
}
