import { prisma } from "@/lib/db";

export interface ParticipantInfo {
  id: string; // userId or teamId
  name: string;
}

export class BracketService {
  /**
   * Generates single-elimination tournament bracket matches
   */
  static async generateSingleElimination(
    tournamentId: string,
    participants: ParticipantInfo[]
  ) {
    if (participants.length < 2) {
      throw new Error("At least 2 participants are required to generate a bracket");
    }

    // Determine tournament bracket size as nearest power of 2 >= participants.length
    let bracketSize = 2;
    while (bracketSize < participants.length) {
      bracketSize *= 2;
    }

    const totalRounds = Math.log2(bracketSize);

    // Shuffle or seed participants
    const seeded = [...participants];
    // Pad with byes if participants < bracketSize
    while (seeded.length < bracketSize) {
      seeded.push({ id: "", name: "BYE" });
    }

    // Delete any existing matches for this tournament
    await prisma.match.deleteMany({
      where: { tournamentId },
    });

    // Create matches round by round from final back to round 1 so nextMatchId can be linked
    // We'll store match map by key: `${round}_${matchIndex}`
    const matchMap: { [key: string]: string } = {};

    // Loop from final round down to round 1
    for (let r = totalRounds; r >= 1; r--) {
      const matchCountInRound = Math.pow(2, totalRounds - r);

      for (let m = 1; m <= matchCountInRound; m++) {
        let nextMatchId: string | undefined = undefined;
        if (r < totalRounds) {
          const nextMatchIndex = Math.ceil(m / 2);
          nextMatchId = matchMap[`${r + 1}_${nextMatchIndex}`];
        }

        // For round 1, assign initial participants
        let p1: ParticipantInfo | null = null;
        let p2: ParticipantInfo | null = null;

        if (r === 1) {
          p1 = seeded[(m - 1) * 2];
          p2 = seeded[(m - 1) * 2 + 1];
        }

        const match = await prisma.match.create({
          data: {
            tournamentId,
            round: r,
            matchNumber: m,
            participant1Id: p1 && p1.id ? p1.id : null,
            participant1Name: p1 ? p1.name : null,
            participant2Id: p2 && p2.id ? p2.id : null,
            participant2Name: p2 ? p2.name : null,
            nextMatchId: nextMatchId || null,
            status: "SCHEDULED",
            score1: 0,
            score2: 0,
          },
        });

        matchMap[`${r}_${m}`] = match.id;
      }
    }

    // Handle initial byes in Round 1 if any participant has a BYE opponent
    const round1Matches = await prisma.match.findMany({
      where: { tournamentId, round: 1 },
    });

    for (const match of round1Matches) {
      if (match.participant1Name && match.participant2Name === "BYE") {
        // Automatic walkover for participant 1
        await this.advanceWinner(match.id, match.participant1Id!, match.participant1Name);
      } else if (match.participant2Name && match.participant1Name === "BYE") {
        // Automatic walkover for participant 2
        await this.advanceWinner(match.id, match.participant2Id!, match.participant2Name);
      }
    }

    return await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    });
  }

  /**
   * Advances a winner to the next bracket round
   */
  static async advanceWinner(
    matchId: string,
    winnerId: string,
    winnerName: string
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) throw new Error("Match not found");

    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    if (!match.nextMatchId) {
      // This was the Grand Final! Tournament is now completed.
      await prisma.tournament.update({
        where: { id: match.tournamentId },
        data: {
          status: "COMPLETED",
          endDate: new Date(),
        },
      });
      return;
    }

    // Advance into nextMatchId
    const nextMatch = await prisma.match.findUnique({
      where: { id: match.nextMatchId },
    });

    if (!nextMatch) return;

    // Check whether this match is odd or even to place as participant1 or participant2
    const isOdd = match.matchNumber % 2 !== 0;

    await prisma.match.update({
      where: { id: match.nextMatchId },
      data: isOdd
        ? {
            participant1Id: winnerId,
            participant1Name: winnerName,
          }
        : {
            participant2Id: winnerId,
            participant2Name: winnerName,
          },
    });
  }
}
