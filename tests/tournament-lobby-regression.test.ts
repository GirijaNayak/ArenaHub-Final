import { prisma } from "@/lib/db";
import { TournamentService } from "@/services/tournament.service";
import { LobbyService } from "@/services/lobby.service";
import { canAccessRoomCredentials } from "@/lib/auth";

describe("Tournament & Lobby View Regression Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Regression: Undefined captain/players property access on tournament lobbies", () => {
    it("should include captain and players in lobbies.teams.team for getBySlug without exposing room credentials", async () => {
      const tourney = await TournamentService.getBySlug("bgmi-masters-series-2026");
      expect(tourney).not.toBeNull();
      expect(tourney?.lobbies).toBeDefined();
      expect(tourney?.lobbies.length).toBeGreaterThan(0);

      const firstLobby = tourney!.lobbies[0];
      expect(firstLobby.teams).toBeDefined();
      expect(firstLobby.teams.length).toBeGreaterThan(0);

      // Verify that team includes captain and players so frontend does not throw
      // "Cannot read properties of undefined (reading 'id')"
      for (const slot of firstLobby.teams) {
        expect(slot.team).toBeDefined();
        // captain must be defined with id and username
        expect(slot.team.captain).toBeDefined();
        expect(slot.team.captain?.id).toBeDefined();
        expect(typeof slot.team.captain?.id).toBe("string");
        expect(slot.team.captain?.username).toBeDefined();

        // players must be an array
        expect(Array.isArray(slot.team.players)).toBe(true);
      }

      // Verify credentials remain scrubbed in public view
      expect(firstLobby.roomId).toBeNull();
      expect(firstLobby.roomPassword).toBeNull();
    });

    it("should handle tournaments without lobbies or registrations gracefully", async () => {
      const tourney = await TournamentService.getBySlug("pubg-mobile-world-invitational");
      expect(tourney).not.toBeNull();
      expect(tourney?.lobbies).toBeDefined();
      expect(Array.isArray(tourney?.lobbies)).toBe(true);
      expect(Array.isArray(tourney?.registrations)).toBe(true);
    });

    it("should return null for non-existent tournament slug without crashing", async () => {
      const tourney = await TournamentService.getBySlug("non-existent-slug-xyz");
      expect(tourney).toBeNull();
    });
  });

  describe("Lobby Credential Access & Reveal Time Invariants", () => {
    it("should block spectators from accessing room credentials", async () => {
      const tourney = await prisma.tournament.findUnique({
        where: { slug: "bgmi-masters-series-2026" },
        include: { lobbies: true },
      });
      const lobby = tourney!.lobbies[0];

      // Spectator check
      const check = await canAccessRoomCredentials("mock-spectator-id", "SPECTATOR", lobby.id);
      expect(check.canAccess).toBe(false);
      expect(check.reason).toContain("Spectator");

      const secureLobby = await LobbyService.getLobbySecure(lobby.id, "mock-spectator-id", "SPECTATOR");
      expect(secureLobby?.roomId).toBeNull();
      expect(secureLobby?.roomPassword).toBeNull();
      expect(secureLobby?.canAccessCredentials).toBe(false);
    });

    it("should block unassigned teams from accessing room credentials", async () => {
      const tourney = await prisma.tournament.findUnique({
        where: { slug: "bgmi-masters-series-2026" },
        include: { lobbies: true },
      });
      const lobby = tourney!.lobbies[0];

      const check = await canAccessRoomCredentials("mock-unassigned-user-id", "PLAYER", lobby.id);
      expect(check.canAccess).toBe(false);

      const secureLobby = await LobbyService.getLobbySecure(lobby.id, "mock-unassigned-user-id", "PLAYER");
      expect(secureLobby?.roomId).toBeNull();
      expect(secureLobby?.roomPassword).toBeNull();
      expect(secureLobby?.canAccessCredentials).toBe(false);
    });

    it("should allow platform admin to access room credentials", async () => {
      const adminUser = await prisma.user.findFirst({
        where: { role: "PLATFORM_ADMIN" },
      });
      expect(adminUser).not.toBeNull();

      const tourney = await prisma.tournament.findUnique({
        where: { slug: "bgmi-masters-series-2026" },
        include: { lobbies: true },
      });
      const lobby = tourney!.lobbies[0];

      const secureLobby = await LobbyService.getLobbySecure(lobby.id, adminUser!.id, "PLATFORM_ADMIN");
      expect(secureLobby).not.toBeNull();
      expect(secureLobby?.canAccessCredentials).toBe(true);
    });
  });
});
