import {
  registerSchema,
  loginSchema,
  createTournamentSchema,
  reportMatchResultSchema,
  createTeamSchema,
} from "@/lib/validations";

describe("Validation Schemas Unit Tests", () => {
  describe("Registration Schema", () => {
    it("should accept valid registration input", () => {
      const valid = {
        name: "Alex Mercer",
        username: "proto_alex",
        email: "alex@example.com",
        password: "StrongPassword123!",
        role: "PLAYER" as const,
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject usernames with special characters", () => {
      const invalid = {
        name: "Alex Mercer",
        username: "proto@alex!",
        email: "alex@example.com",
        password: "StrongPassword123!",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject short passwords under 8 characters", () => {
      const invalid = {
        name: "Alex Mercer",
        username: "proto_alex",
        email: "alex@example.com",
        password: "short",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Tournament Creation Schema", () => {
    it("should validate tournament capacity limits", () => {
      const valid = {
        title: "Championship 2026",
        description: "Official annual esports circuit championship event.",
        gameId: "game_123",
        type: "SOLO" as const,
        format: "SINGLE_ELIMINATION" as const,
        maxParticipants: 16,
        registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
        startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        rulesText: "Standard competitive ruleset applies.",
        prizePool: 5000,
      };
      const result = createTournamentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject tournament capacity less than 4 or negative prize", () => {
      const invalid = {
        title: "Small Tourney",
        description: "Short",
        gameId: "game_123",
        maxParticipants: 2, // minimum 4
        prizePool: -100, // negative not allowed
        registrationDeadline: "invalid-date",
        startDate: "invalid-date",
        rulesText: "Too short",
      };
      const result = createTournamentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Match Result Schema", () => {
    it("should validate legitimate match score report", () => {
      const valid = {
        matchId: "match_1",
        score1: 13,
        score2: 11,
        winnerId: "p1",
      };
      const result = reportMatchResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative match scores", () => {
      const invalid = {
        matchId: "match_1",
        score1: -1,
        score2: 10,
        winnerId: "p2",
      };
      const result = reportMatchResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Team Creation Schema", () => {
    it("should validate valid team data and uppercase tag", () => {
      const valid = {
        name: "Sentinels Legion",
        tag: "sen",
        gameId: "game_valorant",
        description: "Professional tier roster.",
      };
      const result = createTeamSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tag).toBe("SEN");
      }
    });
  });
});
