import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  requireRole,
  SessionPayload,
} from "@/lib/auth";

describe("Authentication & Security Unit Tests", () => {
  it("should securely hash passwords and verify them correctly", async () => {
    const raw = "SecurePassword2026!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt signature

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should sign and verify valid JWT session tokens", async () => {
    const payload: SessionPayload = {
      userId: "user_test_123",
      email: "player@arenahub.gg",
      username: "pro_player",
      name: "Pro Player",
      role: "PLAYER",
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // valid JWT structure

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.username).toBe(payload.username);
    expect(verified?.role).toBe("PLAYER");
  });

  it("should reject invalid or tampered tokens", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const verified = await verifySessionToken(invalidToken);
    expect(verified).toBeNull();
  });

  it("should enforce role authorization hierarchy", () => {
    const player: SessionPayload = {
      userId: "p1",
      email: "p@a.gg",
      username: "p",
      name: "P",
      role: "PLAYER",
    };
    const organizer: SessionPayload = {
      userId: "o1",
      email: "o@a.gg",
      username: "o",
      name: "O",
      role: "ORGANIZER",
    };
    const admin: SessionPayload = {
      userId: "a1",
      email: "a@a.gg",
      username: "a",
      name: "A",
      role: "ADMIN",
    };

    // Organizer check
    expect(requireRole(player, ["ORGANIZER"])).toBe(false);
    expect(requireRole(organizer, ["ORGANIZER"])).toBe(true);
    expect(requireRole(admin, ["ORGANIZER"])).toBe(true); // Admins inherit organizer rights

    // Admin check
    expect(requireRole(player, ["ADMIN"])).toBe(false);
    expect(requireRole(organizer, ["ADMIN"])).toBe(false);
    expect(requireRole(admin, ["ADMIN"])).toBe(true);
  });
});
