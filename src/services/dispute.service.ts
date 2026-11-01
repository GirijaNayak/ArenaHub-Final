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
        lobby: { include: { tournament: true } },
      },
    });

    if (!lobbyTeam) {
      throw new Error("Your team was not assigned to this lobby");
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
          teamId: data.teamId,
          reason: data.reason,
          lobbyId: data.lobbyId,
        }),
      },
    });

    return dispute;
  }

  /**
   * Referee resolves or rejects a dispute, with optional score correction
   */
  static async resolveDispute(
    refereeId: string,
    disputeId: string,
    data: z.infer<typeof resolveDisputeSchema>
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        lobby: { include: { tournament: true } },
        team: true,
      },
    });

    if (!dispute) throw new Error("Dispute not found");

    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
      throw new Error("This dispute has already been concluded");
    }

    // If score correction is applied upon resolution
    if (data.status === "RESOLVED" && data.correctedPlacement !== undefined && data.correctedKills !== undefined) {
      const scoringConfig = ScoringService.parseConfig(dispute.lobby.tournament.scoringConfig);
      const calculated = ScoringService.calculatePoints(
        data.correctedPlacement,
        data.correctedKills,
        scoringConfig
      );

      // Upsert the corrected result
      await prisma.lobbyResult.upsert({
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

    const updatedDispute = await prisma.dispute.update({
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
    await prisma.notification.create({
      data: {
        userId: dispute.team.captainId,
        title: `Dispute ${data.status === "RESOLVED" ? "Resolved" : data.status === "REJECTED" ? "Rejected" : "Under Review"}`,
        message: `Your dispute for ${dispute.lobby.title} was marked ${data.status}. Notes: ${data.resolutionNotes}`,
        type: "DISPUTE",
        linkUrl: `/tournaments/${dispute.lobby.tournament.slug}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
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
  }

  /**
   * List disputes for tournament or organization
   */
  static async listDisputes(filters: {
    tournamentId?: string;
    organizationId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.tournamentId) where.tournamentId = filters.tournamentId;
    if (filters.organizationId) where.tournament = { organizationId: filters.organizationId };
    if (filters.status) where.status = filters.status;

    const [total, disputes] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          team: { select: { id: true, name: true, tag: true } },
          lobby: { select: { id: true, title: true, lobbyNumber: true } },
          raisedBy: { select: { id: true, username: true } },
          referee: { select: { id: true, username: true } },
        },
      }),
    ]);

    return { disputes, total, page, limit };
  }
}
