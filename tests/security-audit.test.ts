import { prisma } from "@/lib/db";
import { canAccessRoomCredentials } from "@/lib/auth";
import { TournamentService } from "@/services/tournament.service";
import { LobbyService } from "@/services/lobby.service";
import { DisputeService } from "@/services/dispute.service";
import { rateLimiter } from "@/lib/rate-limiter";
import { registerSchema, safeHttpUrlSchema } from "@/lib/validations";

describe("ArenaHub Enterprise Security Audit & Invariant Regression Suite", () => {
  let orgA: any;
  let orgB: any;
  let suspendedOrg: any;
  let adminUser: any;
  let organizerA: any;
  let organizerB: any;
  let refereeA: any;
  let captainA: any;
  let captainB: any;
  let playerA: any;
  let spectatorUser: any;
  let tournamentA: any;
  let lobbyA: any;
  let teamA: any;
  let teamB: any;

  beforeAll(async () => {
    // Fetch seeded fixtures
    adminUser = await prisma.user.findFirst({ where: { role: "PLATFORM_ADMIN" } });
    organizerA = await prisma.user.findFirst({ where: { username: "organizer" } });
    refereeA = await prisma.user.findFirst({ where: { username: "referee" } });
    captainA = await prisma.user.findFirst({ where: { username: "captain" } });
    captainB = await prisma.user.findFirst({ where: { username: "tx_scout" } });
    playerA = await prisma.user.findFirst({ where: { username: "player" } });
    spectatorUser = await prisma.user.findFirst({ where: { username: "spectator" } });

    orgA = await prisma.organization.findUnique({ where: { slug: "krafton-esports-india" } });
    orgB = await prisma.organization.findUnique({ where: { slug: "skyesports-championship" } });

    teamA = await prisma.team.findFirst({ where: { captainId: captainA.id } });
    teamB = await prisma.team.findFirst({ where: { captainId: captainB.id } });

    // Create an independent Organizer strictly belonging to Org B
    organizerB = await prisma.user.upsert({
      where: { email: "organizer_b@arenahub.gg" },
      update: {},
      create: {
        name: "Org B Staff",
        username: "organizer_b",
        email: "organizer_b@arenahub.gg",
        passwordHash: "dummyhash",
        role: "TOURNAMENT_ORGANIZER",
      },
    });

    await prisma.orgMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: orgB.id,
          userId: organizerB.id,
        },
      },
      update: {},
      create: {
        organizationId: orgB.id,
        userId: organizerB.id,
        role: "TOURNAMENT_ORGANIZER",
      },
    });

    // Create a SUSPENDED organization fixture
    suspendedOrg = await prisma.organization.upsert({
      where: { slug: "suspended-org-fixture" },
      update: { status: "SUSPENDED" },
      create: {
        name: "Suspended Esports Org",
        slug: "suspended-org-fixture",
        description: "Organization suspended due to policy violations.",
        status: "SUSPENDED",
        ownerId: adminUser.id,
        members: {
          create: [{ userId: organizerA.id, role: "TOURNAMENT_ORGANIZER" }],
        },
      },
    });

    tournamentA = await prisma.tournament.findFirst({
      where: { organizationId: orgA.id },
      include: { lobbies: true },
    });

    lobbyA = tournamentA.lobbies[0];
  });

  afterAll(async () => {
    // Cleanup temporary suspended org and users
    if (suspendedOrg) {
      await prisma.orgMembership.deleteMany({ where: { organizationId: suspendedOrg.id } });
      await prisma.organization.delete({ where: { id: suspendedOrg.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("Invariant 1: Multi-Tenant Organization Isolation", () => {
    it("should prevent Organizer of Org B from creating a tournament in Org A", async () => {
      await expect(
        TournamentService.create(organizerB.id, {
          organizationId: orgA.id,
          title: "Malicious Cross-Tenant Cup",
          description: "Cross tenant tournament injection attempt",
          rules: "Standard fair play rules apply.",
          game: "BGMI",
          teamSize: 4,
          teamCapacity: 16,
          prizePool: 10000,
          tournamentStart: new Date().toISOString(),
          registrationStart: new Date().toISOString(),
          registrationEnd: new Date(Date.now() + 86400000).toISOString(),
        })
      ).rejects.toThrow(/Forbidden/);
    });

    it("should prevent Staff of Org B from creating lobbies in Org A's tournament", async () => {
      await expect(
        LobbyService.create(organizerB.id, {
          tournamentId: tournamentA.id,
          title: "Unauthorized Org B Lobby",
          lobbyNumber: 99,
          mapName: "Erangel",
          scheduledTime: new Date().toISOString(),
          revealTime: new Date().toISOString(),
        })
      ).rejects.toThrow(/Forbidden/);
    });

    it("should prevent Staff of Org B from resolving disputes in Org A's tournament", async () => {
      // Create a test dispute in tournament A
      const testDispute = await prisma.dispute.create({
        data: {
          tournamentId: tournamentA.id,
          lobbyId: lobbyA.id,
          teamId: teamA.id,
          raisedById: captainA.id,
          reason: "UNRECORDED_POINTS",
          description: "Cross tenant resolution attempt test",
          status: "OPEN",
        },
      });

      await expect(
        DisputeService.resolveDispute(organizerB.id, testDispute.id, {
          status: "RESOLVED",
          resolutionNotes: "Malicious attempt to adjudicate competitor org dispute",
        })
      ).rejects.toThrow(/Forbidden/);

      // Clean up dispute
      await prisma.dispute.delete({ where: { id: testDispute.id } });
    });
  });

  describe("Invariant 2 & 3 & 4: Lobby Room Credential Protection & Timing Restrictions", () => {
    let lockedLobby: any;

    beforeAll(async () => {
      // Create a future lobby with reveal time in 1 hour
      lockedLobby = await prisma.lobby.create({
        data: {
          tournamentId: tournamentA.id,
          lobbyNumber: 88,
          title: "Security Credentials Invariant Test Lobby",
          mapName: "Miramar",
          roomId: "CONFIDENTIAL_ROOM_101",
          roomPassword: "SUPER_SECRET_PASSWORD_XYZ",
          scheduledTime: new Date(Date.now() + 7200000),
          revealTime: new Date(Date.now() + 3600000), // 1 hour in future
          status: "SCHEDULED",
        },
      });

      // Assign teamA to slot 5
      await prisma.lobbyTeam.create({
        data: {
          lobbyId: lockedLobby.id,
          teamId: teamA.id,
          slotNumber: 5,
        },
      });
    });

    afterAll(async () => {
      if (lockedLobby) {
        await prisma.lobbyTeam.deleteMany({ where: { lobbyId: lockedLobby.id } });
        await prisma.lobby.delete({ where: { id: lockedLobby.id } });
      }
    });

    it("Spectators MUST NEVER be able to retrieve room credentials", async () => {
      const access = await canAccessRoomCredentials(spectatorUser.id, "SPECTATOR", lockedLobby.id);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toContain("Spectators are strictly prohibited from viewing private room credentials");
    });

    it("Unassigned teams MUST NOT be able to retrieve room credentials", async () => {
      // captainB (TX) is NOT assigned to lockedLobby
      const access = await canAccessRoomCredentials(captainB.id, "TEAM_CAPTAIN", lockedLobby.id);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toContain("Your team is not assigned to this battle-royale lobby");
    });

    it("Assigned teams CANNOT retrieve credentials before revealTime", async () => {
      // captainA (GodL) is assigned to lockedLobby, but revealTime is in 1 hour
      const access = await canAccessRoomCredentials(captainA.id, "TEAM_CAPTAIN", lockedLobby.id);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toContain("Room credentials are locked");
    });

    it("Public getBySlug MUST NEVER expose roomId or roomPassword in API payloads", async () => {
      const publicData = await TournamentService.getBySlug(tournamentA.slug);
      expect(publicData).not.toBeNull();
      if (!publicData) return;
      expect(publicData.lobbies.length).toBeGreaterThan(0);
      for (const lobby of publicData.lobbies) {
        expect(lobby.roomId).toBeNull();
        expect(lobby.roomPassword).toBeNull();
      }
    });
  });

  describe("Invariant 5: Captains & Non-Staff Cannot Resolve Disputes", () => {
    it("should prevent Team Captain from adjudicating or resolving any dispute", async () => {
      const dispute = await prisma.dispute.create({
        data: {
          tournamentId: tournamentA.id,
          lobbyId: lobbyA.id,
          teamId: teamA.id,
          raisedById: captainA.id,
          reason: "CHEATING_ACCUSATION",
          description: "Captain dispute adjudication guard test",
          status: "OPEN",
        },
      });

      await expect(
        DisputeService.resolveDispute(captainA.id, dispute.id, {
          status: "RESOLVED",
          resolutionNotes: "Self resolution by captain",
        })
      ).rejects.toThrow(/Forbidden/);

      // Clean up
      await prisma.dispute.delete({ where: { id: dispute.id } });
    });
  });

  describe("Invariant 6: Players Cannot Overwrite Official Verified Results", () => {
    let testVerifiedLobby: any;
    let testResult: any;

    beforeAll(async () => {
      testVerifiedLobby = await prisma.lobby.create({
        data: {
          tournamentId: tournamentA.id,
          lobbyNumber: 77,
          title: "Verified Score Guard Test",
          mapName: "Sanhok",
          scheduledTime: new Date(),
          revealTime: new Date(Date.now() - 3600000),
          status: "COMPLETED",
        },
      });

      await prisma.lobbyTeam.create({
        data: {
          lobbyId: testVerifiedLobby.id,
          teamId: teamA.id,
          slotNumber: 1,
        },
      });

      testResult = await prisma.lobbyResult.create({
        data: {
          lobbyId: testVerifiedLobby.id,
          teamId: teamA.id,
          placement: 1,
          kills: 10,
          placementPoints: 15,
          killPoints: 10,
          totalPoints: 25,
          status: "VERIFIED",
        },
      });
    });

    afterAll(async () => {
      if (testVerifiedLobby) {
        await prisma.lobbyResult.deleteMany({ where: { lobbyId: testVerifiedLobby.id } });
        await prisma.lobbyTeam.deleteMany({ where: { lobbyId: testVerifiedLobby.id } });
        await prisma.lobby.delete({ where: { id: testVerifiedLobby.id } });
      }
    });

    it("should reject player/captain attempts to overwrite VERIFIED match results", async () => {
      await expect(
        LobbyService.submitResult(captainA.id, {
          lobbyId: testVerifiedLobby.id,
          teamId: teamA.id,
          placement: 1,
          kills: 99, // Attempted cheat modification
        })
      ).rejects.toThrow(/officially verified by referees/);
    });

    it("should reject player attempts to submit results for an unassociated team", async () => {
      await expect(
        LobbyService.submitResult(captainA.id, {
          lobbyId: testVerifiedLobby.id,
          teamId: teamB.id, // Team B does not belong to captainA
          placement: 2,
          kills: 4,
        })
      ).rejects.toThrow(/not authorized to submit match results for this squad/);
    });
  });

  describe("Invariant 7: Privilege Escalation Prevention in Registration", () => {
    it("should forbid public self-registration with TOURNAMENT_ORGANIZER role", () => {
      const parsed = registerSchema.safeParse({
        name: "Hacker User",
        username: "hacker1",
        email: "hacker1@example.com",
        password: "Password123!",
        role: "TOURNAMENT_ORGANIZER",
      });
      expect(parsed.success).toBe(false);
    });

    it("should forbid public self-registration with REFEREE role", () => {
      const parsed = registerSchema.safeParse({
        name: "Hacker User",
        username: "hacker2",
        email: "hacker2@example.com",
        password: "Password123!",
        role: "REFEREE",
      });
      expect(parsed.success).toBe(false);
    });

    it("should forbid public self-registration with PLATFORM_ADMIN role", () => {
      const parsed = registerSchema.safeParse({
        name: "Hacker User",
        username: "hacker3",
        email: "hacker3@example.com",
        password: "Password123!",
        role: "PLATFORM_ADMIN",
      });
      expect(parsed.success).toBe(false);
    });

    it("should accept valid competitor roles (PLAYER, TEAM_CAPTAIN, SPECTATOR)", () => {
      const roles = ["PLAYER", "TEAM_CAPTAIN", "SPECTATOR"];
      for (const role of roles) {
        const parsed = registerSchema.safeParse({
          name: "Legit Competitor",
          username: `competitor_${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@example.com`,
          password: "Password123!",
          role,
        });
        expect(parsed.success).toBe(true);
      }
    });
  });

  describe("Invariant 8: Concurrent Result Submission Integrity", () => {
    let raceLobby: any;

    beforeAll(async () => {
      raceLobby = await prisma.lobby.create({
        data: {
          tournamentId: tournamentA.id,
          lobbyNumber: 66,
          title: "Race Condition Stress Test Lobby",
          mapName: "Erangel",
          scheduledTime: new Date(),
          revealTime: new Date(Date.now() - 3600000),
          status: "IN_PROGRESS",
        },
      });

      await prisma.lobbyTeam.create({
        data: {
          lobbyId: raceLobby.id,
          teamId: teamA.id,
          slotNumber: 2,
        },
      });
    });

    afterAll(async () => {
      if (raceLobby) {
        await prisma.auditLog.deleteMany({ where: { entityId: raceLobby.id } });
        await prisma.lobbyResult.deleteMany({ where: { lobbyId: raceLobby.id } });
        await prisma.lobbyTeam.deleteMany({ where: { lobbyId: raceLobby.id } });
        await prisma.lobby.delete({ where: { id: raceLobby.id } });
      }
    });

    it("should handle simultaneous concurrent submissions safely within transaction without database corruption", async () => {
      // Concurrently submit two valid results for teamA
      const sub1 = LobbyService.submitResult(captainA.id, {
        lobbyId: raceLobby.id,
        teamId: teamA.id,
        placement: 3,
        kills: 6,
      });

      const sub2 = LobbyService.submitResult(captainA.id, {
        lobbyId: raceLobby.id,
        teamId: teamA.id,
        placement: 3,
        kills: 7,
      });

      const [res1, res2] = await Promise.all([sub1, sub2]);
      expect(res1).toBeDefined();
      expect(res2).toBeDefined();

      // Ensure precisely one final LobbyResult row exists for this team in this lobby
      const results = await prisma.lobbyResult.findMany({
        where: {
          lobbyId: raceLobby.id,
          teamId: teamA.id,
        },
      });
      expect(results.length).toBe(1);
      expect(results[0].status).toBe("SUBMITTED");
    });
  });

  describe("Invariant 9: Suspended Organizations Restricted from Operations", () => {
    it("should prevent creating a tournament under a suspended organization", async () => {
      await expect(
        TournamentService.create(adminUser.id, {
          organizationId: suspendedOrg.id,
          title: "Suspended Org Tournament",
          description: "Testing suspended org create guard",
          rules: "Standard fair play rules apply.",
          game: "BGMI",
          teamSize: 4,
          teamCapacity: 16,
          prizePool: 0,
          tournamentStart: new Date().toISOString(),
          registrationStart: new Date().toISOString(),
          registrationEnd: new Date(Date.now() + 86400000).toISOString(),
        })
      ).rejects.toThrow(/currently suspended/);
    });

    it("should prevent squad registrations in tournaments of a suspended organization", async () => {
      // Force create a tournament under suspendedOrg using raw prisma to test the service guard
      const suspendedTourn = await prisma.tournament.create({
        data: {
          organizationId: suspendedOrg.id,
          organizerId: adminUser.id,
          title: "Raw Created Suspended Cup",
          slug: "raw-created-suspended-cup",
          description: "Testing suspended org registration guard",
          rules: "Standard fair play tournament rules.",
          game: "BGMI",
          status: "REGISTRATION_OPEN",
          teamSize: 4,
          teamCapacity: 16,
          tournamentStart: new Date(),
          registrationStart: new Date(),
          registrationEnd: new Date(Date.now() + 3600000),
          scoringConfig: tournamentA.scoringConfig,
        },
      });

      await expect(
        TournamentService.registerSquad(captainA.id, suspendedTourn.id, teamA.id)
      ).rejects.toThrow(/currently suspended/);

      await prisma.tournament.delete({ where: { id: suspendedTourn.id } });
    });
  });

  describe("Rate Limiting & Brute Force Defense", () => {
    it("should enforce sliding window limits and reject requests beyond threshold", () => {
      rateLimiter.reset();
      const testKey = "test-rate-limit-ip-" + Date.now();
      const limit = 3;
      const windowMs = 5000;

      // 1st request -> allowed
      const r1 = rateLimiter.check(testKey, limit, windowMs);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      // 2nd request -> allowed
      const r2 = rateLimiter.check(testKey, limit, windowMs);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      // 3rd request -> allowed
      const r3 = rateLimiter.check(testKey, limit, windowMs);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // 4th request -> blocked (429)
      const r4 = rateLimiter.check(testKey, limit, windowMs);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.resetInMs).toBeGreaterThan(0);
    });
  });

  describe("XSS Protocol Sanitization", () => {
    it("should accept valid http and https URLs", () => {
      expect(safeHttpUrlSchema.safeParse("https://i.imgur.com/evidence1.png").success).toBe(true);
      expect(safeHttpUrlSchema.safeParse("http://cdn.example.org/feed.mp4").success).toBe(true);
    });

    it("should reject malicious javascript: URLs", () => {
      const res = safeHttpUrlSchema.safeParse("javascript:alert(document.cookie)");
      expect(res.success).toBe(false);
    });

    it("should reject malicious data: URLs", () => {
      const res = safeHttpUrlSchema.safeParse("data:text/html,<script>alert(1)</script>");
      expect(res.success).toBe(false);
    });
  });
});
