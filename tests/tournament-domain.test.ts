import { prisma } from "@/lib/db";
import { TournamentService } from "@/services/tournament.service";
import { BracketService, ParticipantInfo } from "@/services/bracket.service";

describe("Tournament Domain & Bracket Invariants", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Single Elimination Bracket Invariants", () => {
    it("should correctly compute standings for completed tournament", async () => {
      const tournament = await prisma.tournament.findUnique({
        where: { slug: "lol-rift-masters-spring-2026" },
      });

      expect(tournament).not.toBeNull();
      if (!tournament) return;

      const standings = await TournamentService.getStandings(tournament.id);
      expect(standings.length).toBeGreaterThan(0);

      // 1st place champion must exist
      const champion = standings.find((s) => s.rank === 1);
      expect(champion).toBeDefined();
      expect(champion?.status).toBe("Champion");

      // 2nd place runner-up must exist
      const runnerUp = standings.find((s) => s.rank === 2);
      expect(runnerUp).toBeDefined();
      expect(runnerUp?.status).toBe("Finalist");
    });

    it("should generate balanced single-elimination matches for 4 participants", async () => {
      // Create a test tournament
      const game = await prisma.game.findFirst();
      const organizer = await prisma.user.findFirst({ where: { role: "ORGANIZER" } });

      const testTournament = await prisma.tournament.create({
        data: {
          title: "Test Knockout Bracket",
          slug: `test-knockout-${Date.now()}`,
          description: "Integration test tournament bracket generation",
          gameId: game!.id,
          organizerId: organizer!.id,
          registrationDeadline: new Date(Date.now() + 86400000),
          startDate: new Date(Date.now() + 2 * 86400000),
          rulesText: "Rules for testing",
          maxParticipants: 4,
          status: "ONGOING",
        },
      });

      const participants: ParticipantInfo[] = [
        { id: "p1", name: "Alpha" },
        { id: "p2", name: "Bravo" },
        { id: "p3", name: "Charlie" },
        { id: "p4", name: "Delta" },
      ];

      const matches = await BracketService.generateSingleElimination(
        testTournament.id,
        participants
      );

      // For 4 participants: 2 Round 1 matches, 1 Round 2 (Final) match = 3 total matches
      expect(matches.length).toBe(3);

      const round1 = matches.filter((m) => m.round === 1);
      const round2 = matches.filter((m) => m.round === 2);

      expect(round1.length).toBe(2);
      expect(round2.length).toBe(1);

      // Final match should have no nextMatchId
      expect(round2[0].nextMatchId).toBeNull();

      // Round 1 matches should link to the final match
      expect(round1[0].nextMatchId).toBe(round2[0].id);
      expect(round1[1].nextMatchId).toBe(round2[0].id);

      // Clean up test tournament
      await prisma.match.deleteMany({ where: { tournamentId: testTournament.id } });
      await prisma.tournament.delete({ where: { id: testTournament.id } });
    });
  });
});
