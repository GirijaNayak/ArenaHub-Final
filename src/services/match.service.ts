import { prisma } from "@/lib/db";
import { z } from "zod";
import { reportMatchResultSchema } from "@/lib/validations";
import { BracketService } from "./bracket.service";

export class MatchService {
  static async reportResult(
    userId: string,
    userRole: string,
    data: z.infer<typeof reportMatchResultSchema>
  ) {
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: {
        tournament: true,
      },
    });

    if (!match) throw new Error("Match not found");

    if (match.status === "COMPLETED") {
      throw new Error("Match has already been finalized and cannot be resubmitted");
    }

    // Verify reporter authorization: either match participant, organizer, or admin
    const isOrganizer = match.tournament.organizerId === userId;
    const isAdmin = userRole === "ADMIN";
    const isParticipant =
      match.participant1Id === userId || match.participant2Id === userId;

    if (!isOrganizer && !isAdmin && !isParticipant) {
      throw new Error("Unauthorized: Only match participants, organizers, or admins can report results");
    }

    // Validate winner is one of the participants
    if (data.winnerId !== match.participant1Id && data.winnerId !== match.participant2Id) {
      throw new Error("Winner must be one of the registered participants for this match");
    }

    const winnerName =
      data.winnerId === match.participant1Id
        ? match.participant1Name || "Participant 1"
        : match.participant2Name || "Participant 2";

    // Atomically update score and advance winner
    await prisma.match.update({
      where: { id: match.id },
      data: {
        score1: data.score1,
        score2: data.score2,
        reportedById: userId,
        status: "COMPLETED",
        completedAt: new Date(),
        winnerId: data.winnerId,
      },
    });

    // Advance to next bracket round
    await BracketService.advanceWinner(match.id, data.winnerId, winnerName);

    // Create notifications for participants
    const participantsToNotify = [match.participant1Id, match.participant2Id].filter(
      Boolean
    ) as string[];

    for (const pId of participantsToNotify) {
      await prisma.notification.create({
        data: {
          userId: pId,
          title: "Match Result Recorded",
          message: `Match results for Round ${match.round} in ${match.tournament.title} have been verified. Winner: ${winnerName}`,
          type: "MATCH",
          linkUrl: `/tournaments/${match.tournament.slug}`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "MATCH_RESULT_REPORTED",
        targetType: "MATCH",
        targetId: match.id,
        metadata: JSON.stringify({
          score1: data.score1,
          score2: data.score2,
          winnerId: data.winnerId,
          tournamentId: match.tournamentId,
        }),
      },
    });

    return await prisma.match.findUnique({
      where: { id: match.id },
      include: { tournament: true },
    });
  }

  static async getTournamentMatches(tournamentId: string) {
    return prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    });
  }
}
