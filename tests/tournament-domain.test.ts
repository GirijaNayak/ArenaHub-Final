import { prisma } from "@/lib/db";
import { ScoringService } from "@/services/scoring.service";
import { StandingsService } from "@/services/standings.service";
import { canAccessRoomCredentials } from "@/lib/auth";
import { DisputeService } from "@/services/dispute.service";

describe("Battle-Royale Tournament Domain & Security Invariants", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Battle-Royale Scoring Engine", () => {
    const defaultConfig = JSON.stringify({
      placementPoints: {
        1: 15,
        2: 12,
        3: 10,
        4: 8,
        5: 6,
        6: 4,
        7: 2,
        8: 1,
        9: 1,
        10: 1,
      },
      killMultiplier: 1,
    });

    it("should accurately calculate placement and kill points according to official matrix", () => {
      // 1st place with 12 kills: 15 + 12 = 27 pts
      const r1 = ScoringService.calculatePoints(1, 12, defaultConfig);
      expect(r1.placementPoints).toBe(15);
      expect(r1.killPoints).toBe(12);
      expect(r1.totalPoints).toBe(27);

      // 2nd place with 8 kills: 12 + 8 = 20 pts
      const r2 = ScoringService.calculatePoints(2, 8, defaultConfig);
      expect(r2.placementPoints).toBe(12);
      expect(r2.killPoints).toBe(8);
      expect(r2.totalPoints).toBe(20);

      // 4th place with 4 kills: 8 + 4 = 12 pts
      const r4 = ScoringService.calculatePoints(4, 4, defaultConfig);
      expect(r4.placementPoints).toBe(8);
      expect(r4.killPoints).toBe(4);
      expect(r4.totalPoints).toBe(12);

      // 16th place (zero placement pts) with 3 kills: 0 + 3 = 3 pts
      const r16 = ScoringService.calculatePoints(16, 3, defaultConfig);
      expect(r16.placementPoints).toBe(0);
      expect(r16.killPoints).toBe(3);
      expect(r16.totalPoints).toBe(3);
    });

    it("should support custom scoring configs and kill multipliers", () => {
      const customConfig = JSON.stringify({
        placementPoints: { 1: 20, 2: 15, 3: 10 },
        killMultiplier: 2, // 2 points per kill
      });

      const result = ScoringService.calculatePoints(1, 5, customConfig);
      expect(result.placementPoints).toBe(20);
      expect(result.killPoints).toBe(10); // 5 * 2
      expect(result.totalPoints).toBe(30);
    });
  });

  describe("Deterministic Standings & Leaderboard Invariants", () => {
    it("should compute aggregate standings with WWCD, placement points, and kills from seeded tournament", async () => {
      const tournament = await prisma.tournament.findUnique({
        where: { slug: "bgmi-masters-series-2026" },
      });

      expect(tournament).not.toBeNull();
      if (!tournament) return;

      const standings = await StandingsService.getTournamentStandings(tournament.id);
      expect(standings.length).toBeGreaterThanOrEqual(4);

      // Verify standings order: ranks are strictly sequential (1, 2, 3, 4)
      standings.forEach((entry, idx) => {
        expect(entry.rank).toBe(idx + 1);
        expect(entry.totalPoints).toBe(entry.placementPoints + entry.killPoints);
      });

      // Verify that squads with WWCD (1st place finishes) have correct wins count
      const wwcdSquads = standings.filter((s) => s.wins > 0);
      expect(wwcdSquads.length).toBeGreaterThan(0);
    });
  });

  describe("Time-Restricted Room Credentials Security Engine", () => {
    it("should NEVER reveal credentials to spectators", async () => {
      const spectator = await prisma.user.findFirst({ where: { role: "SPECTATOR" } });
      const lobby = await prisma.lobby.findFirst();

      expect(spectator).not.toBeNull();
      expect(lobby).not.toBeNull();

      if (!spectator || !lobby) return;

      const access = await canAccessRoomCredentials(spectator.id, "SPECTATOR", lobby.id);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toContain("Spectators are strictly prohibited");
    });

    it("should deny unassigned teams from accessing credentials", async () => {
      // Create a random user who is not assigned to any team in the lobby
      const randomUser = await prisma.user.create({
        data: {
          name: "Unassigned Competitor",
          username: `unassigned_${Date.now()}`,
          email: `unassigned_${Date.now()}@test.gg`,
          passwordHash: "hash",
          role: "PLAYER",
        },
      });

      const lobby = await prisma.lobby.findFirst();
      if (!lobby) return;

      const access = await canAccessRoomCredentials(randomUser.id, "PLAYER", lobby.id);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toContain("not assigned");

      // Cleanup
      await prisma.user.delete({ where: { id: randomUser.id } });
    });

    it("should immediately grant credentials to tournament organizers and assigned referees", async () => {
      const organizer = await prisma.user.findFirst({ where: { role: "TOURNAMENT_ORGANIZER" } });
      const referee = await prisma.user.findFirst({ where: { role: "REFEREE" } });
      const lobby = await prisma.lobby.findFirst();

      expect(organizer).not.toBeNull();
      expect(referee).not.toBeNull();
      expect(lobby).not.toBeNull();

      if (!organizer || !referee || !lobby) return;

      const orgAccess = await canAccessRoomCredentials(organizer.id, "TOURNAMENT_ORGANIZER", lobby.id);
      expect(orgAccess.canAccess).toBe(true);
      expect(orgAccess.isOfficial).toBe(true);

      const refAccess = await canAccessRoomCredentials(referee.id, "REFEREE", lobby.id);
      expect(refAccess.canAccess).toBe(true);
      expect(refAccess.isOfficial).toBe(true);
    });

    it("should enforce time-lock when revealTime is in the future for assigned squad players", async () => {
      const captain = await prisma.user.findFirst({ where: { role: "TEAM_CAPTAIN" } });
      const tournament = await prisma.tournament.findFirst();

      if (!captain || !tournament) return;

      // Create a future locked lobby with revealTime in 30 minutes
      const futureLobby = await prisma.lobby.create({
        data: {
          tournamentId: tournament.id,
          lobbyNumber: 99,
          title: "Match Future Test",
          mapName: "Vikendi",
          scheduledTime: new Date(Date.now() + 45 * 60000),
          revealTime: new Date(Date.now() + 30 * 60000), // Locked for 30 more minutes
          roomId: "SECRET_ROOM",
          roomPassword: "SECRET_PASSWORD",
          status: "SCHEDULED",
        },
      });

      const team = await prisma.team.findFirst({ where: { captainId: captain.id } });
      if (team) {
        await prisma.lobbyTeam.create({
          data: {
            lobbyId: futureLobby.id,
            teamId: team.id,
            slotNumber: 15,
          },
        });
      }

      // Check access for assigned captain: MUST BE LOCKED
      const lockedAccess = await canAccessRoomCredentials(captain.id, "TEAM_CAPTAIN", futureLobby.id);
      expect(lockedAccess.canAccess).toBe(false);
      expect(lockedAccess.reason).toContain("Room credentials are locked");

      // Cleanup
      await prisma.lobbyTeam.deleteMany({ where: { lobbyId: futureLobby.id } });
      await prisma.lobby.delete({ where: { id: futureLobby.id } });
    });
  });

  describe("Dispute Resolution & Score Correction Lifecycle", () => {
    it("should allow a referee to uphold dispute and update lobby score", async () => {
      const lobby = await prisma.lobby.findFirst({ include: { tournament: true } });
      const team = await prisma.team.findFirst();
      const captain = await prisma.user.findFirst({ where: { role: "TEAM_CAPTAIN" } });
      expect(lobby).not.toBeNull();
      expect(team).not.toBeNull();
      expect(captain).not.toBeNull();
      if (!lobby || !team || !captain) return;

      const dispute = await prisma.dispute.create({
        data: {
          tournamentId: lobby.tournamentId,
          lobbyId: lobby.id,
          teamId: team.id,
          raisedById: captain.id,
          reason: "INCORRECT_KILLS",
          description: "Test dispute for automated adjudication",
          status: "OPEN",
        },
        include: { lobby: true, team: true },
      });

      const referee = await prisma.user.findFirst({ where: { role: "REFEREE" } });
      expect(referee).not.toBeNull();
      if (!referee) return;

      // Adjudicate dispute: correct kills from 5 to 8
      const resolved = await DisputeService.resolveDispute(referee.id, dispute.id, {
        status: "RESOLVED",
        resolutionNotes: "Kill feed video evidence verified. Jonathan had 5 kills and Neyoo had 3 kills (total 8 kills).",
        correctedPlacement: 2,
        correctedKills: 8,
      });

      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.resolutionNotes).toContain("Kill feed video evidence verified");

      // Verify the corrected LobbyResult in database
      const updatedResult = await prisma.lobbyResult.findUnique({
        where: {
          lobbyId_teamId: {
            lobbyId: dispute.lobbyId,
            teamId: dispute.teamId,
          },
        },
      });

      expect(updatedResult).not.toBeNull();
      expect(updatedResult?.kills).toBe(8);
      expect(updatedResult?.killPoints).toBe(8);
      // 2nd place (12 pts) + 8 kills = 20 pts
      expect(updatedResult?.totalPoints).toBe(20);
      expect(updatedResult?.status).toBe("VERIFIED");

      // Cleanup
      await prisma.dispute.delete({ where: { id: dispute.id } }).catch(() => {});
    });
  });
});
