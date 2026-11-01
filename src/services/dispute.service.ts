import { prisma } from "@/lib/db";
import { ScoringService } from "./scoring.service";
import { z } from "zod";
import { createDisputeSchema, resolveDisputeSchema } from "@/lib/validations";

export class DisputeService {
  /**
   * Team Captain raises a match dispute
   */
  static async createDispute(
    userId: string,
    data: z.infer<typeof createDisputeSchema>
  ) {
    // Verify user is captain of the team
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== userId) {
      throw new Error("Forbidden: Only the team captain can raise a dispute");
    }

    // Verify team was assigned to this lobby
    const lobbyTeam = await prisma.lobbyTeam.findUnique({
      where: {
        lobbyId_teamId: {
          lobbyId: data.lobbyId,
          teamId: data.teamId,
        },
      },
      include: {
        lobby: {
          include: {
            tournament: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!lobbyTeam) {
      throw new Error("Your team was not assigned to this lobby");
    }

    if (lobbyTeam.lobby.tournament.organization.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    // Prevent duplicate open disputes
    const existing = await prisma.dispute.findFirst({
      where: {
        lobbyId: data.lobbyId,
        teamId: data.teamId,
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    if (existing) {
      throw new Error("A dispute is already active for this match. Please await referee review.");
    }

    const dispute = await prisma.dispute.create({
      data: {
        tournamentId: data.tournamentId,
        lobbyId: data.lobbyId,
        teamId: data.teamId,
        resultId: data.resultId || null,
        raisedById: userId,
        reason: data.reason,
        description: data.description,
        evidenceUrl: data.evidenceUrl || null,
        status: "OPEN",
      },
      include: {
        team: true,
        lobby: true,
      },
    });

    // Notify organization organizers/referees
    const orgMembers = await prisma.orgMembership.findMany({
      where: {
        organizationId: lobbyTeam.lobby.tournament.organizationId,
        role: { in: ["TOURNAMENT_ORGANIZER", "REFEREE"] },
      },
    });

    for (const m of orgMembers) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title: "New Match Dispute Raised",
          message: `Team [${team.tag}] ${team.name} raised a dispute for ${lobbyTeam.lobby.title}: ${data.reason}`,
          type: "DISPUTE",
          linkUrl: `/disputes/${dispute.id}`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId: lobbyTeam.lobby.tournament.organizationId,
        action: "DISPUTE_RAISED",
        entityType: "DISPUTE",
        entityId: dispute.id,
        metadata: JSON.stringify({
          reason: data.reason,
          teamTag: team.tag,
          teamName: team.name,
        }),
      },
    });

    return dispute;
  }

  /**
   * Referee resolves or rejects a dispute, with optional score correction
   * Security Invariant: Only verified referees/organizers of this tournament's organization or platform admins can resolve disputes.
   * Captains cannot resolve their own or any other disputes.
   */
  static async resolveDispute(
    refereeId: string,
    disputeId: string,
    data: z.infer<typeof resolveDisputeSchema>
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        lobby: {
          include: {
            tournament: {
              include: {
                organization: {
                  include: {
                    members: { where: { userId: refereeId } },
                  },
                },
              },
            },
          },
        },
        team: true,
      },
    });

    if (!dispute) throw new Error("Dispute not found");

    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
      throw new Error("This dispute has already been concluded");
    }

    const org = dispute.lobby.tournament.organization;
    if (org.status === "SUSPENDED") {
      throw new Error("Forbidden: This organization is currently suspended");
    }

    // Verify actor is authorized referee, organizer, or platform admin
    const actorUser = await prisma.user.findUnique({
      where: { id: refereeId },
      select: { role: true },
    });
    const isPlatformAdmin = actorUser?.role === "PLATFORM_ADMIN";

    // Strict Captain self-adjudication block
    if (dispute.raisedById === refereeId && !isPlatformAdmin) {
      throw new Error("Forbidden: Captains cannot adjudicate disputes they filed");
    }

    const isOrgStaff =
      isPlatformAdmin ||
      dispute.lobby.tournament.organizerId === refereeId ||
      org.ownerId === refereeId ||
      org.members.some((m) => m.role === "REFEREE" || m.role === "TOURNAMENT_ORGANIZER");

    if (!isOrgStaff) {
      throw new Error("Forbidden: You are not an authorized referee or organizer for this organization's tournament");
    }

    return prisma.$transaction(async (tx) => {
      // If score correction is applied upon resolution
      if (data.status === "RESOLVED" && data.correctedPlacement !== undefined && data.correctedKills !== undefined) {
        const scoringConfig = ScoringService.parseConfig(dispute.lobby.tournament.scoringConfig);
        const calculated = ScoringService.calculatePoints(
          data.correctedPlacement,
          data.correctedKills,
          scoringConfig
        );

        // Upsert the corrected result
        await tx.lobbyResult.upsert({
          where: {
            lobbyId_teamId: {
              lobbyId: dispute.lobbyId,
              teamId: dispute.teamId,
            },
          },
          update: {
            placement: data.correctedPlacement,
            kills: data.correctedKills,
            placementPoints: calculated.placementPoints,
            killPoints: calculated.killPoints,
            totalPoints: calculated.totalPoints,
            status: "VERIFIED",
            verifiedById: refereeId,
            verifiedAt: new Date(),
          },
          create: {
            lobbyId: dispute.lobbyId,
            teamId: dispute.teamId,
            placement: data.correctedPlacement,
            kills: data.correctedKills,
            placementPoints: calculated.placementPoints,
            killPoints: calculated.killPoints,
            totalPoints: calculated.totalPoints,
            status: "VERIFIED",
            verifiedById: refereeId,
            verifiedAt: new Date(),
          },
        });
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: data.status,
          refereeId,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: data.status === "RESOLVED" || data.status === "REJECTED" ? new Date() : null,
        },
        include: {
          team: true,
          lobby: true,
        },
      });

      // Notify captain
      await tx.notification.create({
        data: {
          userId: dispute.team.captainId,
          title: `Dispute ${data.status === "RESOLVED" ? "Resolved" : data.status === "REJECTED" ? "Rejected" : "Under Review"}`,
          message: `Your dispute for ${dispute.lobby.title} was marked ${data.status}. Notes: ${data.resolutionNotes}`,
          type: "DISPUTE",
          linkUrl: `/tournaments/${dispute.lobby.tournament.slug}`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: refereeId,
          organizationId: dispute.lobby.tournament.organizationId,
          action: "DISPUTE_RESOLVED",
          entityType: "DISPUTE",
          entityId: dispute.id,
          metadata: JSON.stringify({
            status: data.status,
            notes: data.resolutionNotes,
            correctedPlacement: data.correctedPlacement,
            correctedKills: data.correctedKills,
          }),
        },
      });

      return updatedDispute;
    });
  }

  /**
   * List disputes with tenant filtering
   */
  static async listDisputes({
    tournamentId,
    organizationId,
    status,
    page = 1,
    limit = 20,
  }: {
    tournamentId?: string;
    organizationId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (status && status !== "ALL") where.status = status;
    if (organizationId) {
      where.tournament = { organizationId };
    }

    const skip = (page - 1) * limit;

    const [total, disputes] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          team: { select: { id: true, name: true, tag: true, logoUrl: true } },
          lobby: { select: { id: true, title: true, mapName: true, lobbyNumber: true } },
          tournament: { select: { id: true, title: true, slug: true } },
          raisedBy: { select: { id: true, username: true, name: true } },
          referee: { select: { id: true, username: true, name: true } },
        },
      }),
    ]);

    return {
      disputes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
