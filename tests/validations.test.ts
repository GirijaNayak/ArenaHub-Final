import {
  registerSchema,
  loginSchema,
  createTournamentSchema,
  createLobbySchema,
  submitLobbyResultSchema,
  createDisputeSchema,
  createTeamSchema,
} from "@/lib/validations";

describe("Battle-Royale Validation Schemas Unit Tests", () => {
  describe("Registration Schema", () => {
    it("should accept valid competitor registration with in-game ID", () => {
      const valid = {
        name: "Jonathan Amaral",
        username: "godl_jonathan",
        email: "jonathan@godl.gg",
        password: "StrongPassword123!",
        role: "TEAM_CAPTAIN" as const,
        inGameName: "GodL-JONATHAN",
        inGameId: "511223344",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject usernames with special characters", () => {
      const invalid = {
        name: "Jonathan Amaral",
        username: "godl@jonathan!",
        email: "jonathan@godl.gg",
        password: "StrongPassword123!",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject short passwords under 8 characters", () => {
      const invalid = {
        name: "Jonathan Amaral",
        username: "godl_jonathan",
        email: "jonathan@godl.gg",
        password: "short",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Battle-Royale Tournament Creation Schema", () => {
    it("should validate tournament creation with squad capacity and scoring config", () => {
      const valid = {
        organizationId: "org_krafton_1",
        title: "BGMI Masters Series Season 3",
        description: "Official national premier battle royale championship event.",
        game: "BGMI",
        teamCapacity: 20,
        teamSize: 4,
        registrationStart: new Date(Date.now() + 86400000).toISOString(),
        registrationEnd: new Date(Date.now() + 3 * 86400000).toISOString(),
        tournamentStart: new Date(Date.now() + 5 * 86400000).toISOString(),
        rules: "Official KRAFTON competitive ruleset. Top 16 placements earn points.",
        prizePool: 2500000,
        scoringConfig: JSON.stringify({
          placementPoints: { 1: 15, 2: 12, 3: 10, 4: 8 },
          killMultiplier: 1,
        }),
      };
      const result = createTournamentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject tournament squad capacity under 4", () => {
      const invalid = {
        organizationId: "org_krafton_1",
        title: "Short Tourney",
        description: "Too short",
        game: "BGMI",
        teamCapacity: 2, // Minimum 4 squads
        registrationStart: "invalid-date",
        registrationEnd: "invalid-date",
        tournamentStart: "invalid-date",
        rules: "Rules",
      };
      const result = createTournamentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Battle-Royale Lobby Creation Schema", () => {
    it("should validate legitimate match lobby with reveal time", () => {
      const now = Date.now();
      const valid = {
        tournamentId: "tourney_1",
        lobbyNumber: 1,
        title: "Match 1 - Erangel (Group Stage)",
        mapName: "Erangel" as const,
        scheduledTime: new Date(now + 3600000).toISOString(),
        revealTime: new Date(now + 2700000).toISOString(), // 15 mins before match
        roomId: "ROOM-101",
        roomPassword: "secure#pass#99",
      };
      const result = createLobbySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Lobby Score Report & Dispute Schemas", () => {
    it("should validate legitimate match score report", () => {
      const valid = {
        lobbyId: "lobby_1",
        teamId: "team_godl",
        placement: 1,
        kills: 12,
      };
      const result = submitLobbyResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative placement or kills", () => {
      const invalid = {
        lobbyId: "lobby_1",
        teamId: "team_godl",
        placement: 0, // Placements must be 1 to 50
        kills: -5,
      };
      const result = submitLobbyResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate dispute submission with valid category and proof", () => {
      const valid = {
        tournamentId: "tourney_1",
        lobbyId: "lobby_1",
        teamId: "team_godl",
        reason: "INCORRECT_KILLS" as const,
        description: "Official match end screen shows squad had 8 kills instead of 5 recorded.",
        evidenceUrl: "https://example.com/screenshot.jpg",
      };
      const result = createDisputeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Team 4-Player Squad Schema", () => {
    it("should validate squad registration with 4 starters", () => {
      const valid = {
        name: "GodLike Esports",
        tag: "godl",
        description: "Aggressive tactical battle royale squad.",
        players: [
          { playerName: "GodL-JONATHAN", inGameId: "511223344", role: "CAPTAIN" as const },
          { playerName: "GodL-Neyoo", inGameId: "511223345", role: "PLAYER" as const },
          { playerName: "GodL-Zgod", inGameId: "511223346", role: "PLAYER" as const },
          { playerName: "GodL-Punkk", inGameId: "511223347", role: "PLAYER" as const },
        ],
      };
      const result = createTeamSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tag).toBe("GODL");
      }
    });
  });
});
