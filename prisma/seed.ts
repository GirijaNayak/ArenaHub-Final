import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_SCORING_CONFIG = JSON.stringify({
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
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
  },
  killMultiplier: 1,
});

async function main() {
  console.log("🌱 Seeding ArenaHub Battle-Royale multi-tenant database...");

  // Clean existing records in correct foreign key cascade order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.lobbyResult.deleteMany();
  await prisma.lobbyTeam.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.teamPlayer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.orgMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminPasswordHash = await bcrypt.hash("ArenaAdmin123!", 10);
  const organizerPasswordHash = await bcrypt.hash("Organizer123!", 10);

  // 1. Seed 6 Users representing all 6 distinct roles
  const adminUser = await prisma.user.create({
    data: {
      name: "Vikram Malhotra",
      username: "admin",
      email: "admin@arenahub.gg",
      passwordHash: adminPasswordHash,
      role: "PLATFORM_ADMIN",
      bio: "Global Platform Administrator & Head of Esports Engineering.",
      inGameName: "ArenaAdmin",
      inGameId: "999000111",
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      name: "Rajesh Sharma",
      username: "organizer",
      email: "organizer@arenahub.gg",
      passwordHash: organizerPasswordHash,
      role: "TOURNAMENT_ORGANIZER",
      bio: "Chief Operations Director for KRAFTON Esports India.",
      inGameName: "KraftonOps",
      inGameId: "888000222",
    },
  });

  const refereeUser = await prisma.user.create({
    data: {
      name: "Amit Patel",
      username: "referee",
      email: "referee@arenahub.gg",
      passwordHash: passwordHash,
      role: "REFEREE",
      bio: "Senior League Referee & Dispute Arbitrator for Premier Tournaments.",
      inGameName: "LeadRef-Amit",
      inGameId: "777000333",
    },
  });

  const captainUser = await prisma.user.create({
    data: {
      name: "Jonathan Amaral",
      username: "captain",
      email: "captain@arenahub.gg",
      passwordHash: passwordHash,
      role: "TEAM_CAPTAIN",
      bio: "In-Game Leader & Fragger for GodLike Esports. 6x MVP.",
      inGameName: "GodL-JONATHAN",
      inGameId: "511223344",
    },
  });

  const playerUser = await prisma.user.create({
    data: {
      name: "Harsh Paudwal",
      username: "player",
      email: "player@arenahub.gg",
      passwordHash: passwordHash,
      role: "PLAYER",
      bio: "Assaulter for Team Soul. BMPS Champion & MVP.",
      inGameName: "Soul-Goblin",
      inGameId: "522334455",
    },
  });

  const spectatorUser = await prisma.user.create({
    data: {
      name: "Ananya Iyer",
      username: "spectator",
      email: "spectator@arenahub.gg",
      passwordHash: passwordHash,
      role: "SPECTATOR",
      bio: "Esports enthusiast, statistical analyst, and community caster.",
      inGameName: "AnanyaCasts",
    },
  });

  // Additional captain accounts for Team XSpark & Blind Esports
  const captainTX = await prisma.user.create({
    data: {
      name: "Tanmay Singh",
      username: "tx_scout",
      email: "scout@arenahub.gg",
      passwordHash: passwordHash,
      role: "TEAM_CAPTAIN",
      bio: "Captain of Team XSpark.",
      inGameName: "TX-ScoutOP",
      inGameId: "533445566",
    },
  });

  const captainBlind = await prisma.user.create({
    data: {
      name: "Mohammad Manya",
      username: "blind_manya",
      email: "manya@arenahub.gg",
      passwordHash: passwordHash,
      role: "TEAM_CAPTAIN",
      bio: "IGL for Blind Esports.",
      inGameName: "Blind-Manya",
      inGameId: "544556677",
    },
  });

  console.log("✅ Seeded 8 users across all 6 roles.");

  // 2. Seed 2 Organizations (Tenants)
  const kraftonOrg = await prisma.organization.create({
    data: {
      name: "KRAFTON Esports India",
      slug: "krafton-esports-india",
      description: "Official publisher and tournament circuit organizer for Battlegrounds Mobile India.",
      status: "ACTIVE",
      ownerId: organizerUser.id,
      members: {
        create: [
          { userId: organizerUser.id, role: "TOURNAMENT_ORGANIZER" },
          { userId: refereeUser.id, role: "REFEREE" },
        ],
      },
    },
  });

  const skyesportsOrg = await prisma.organization.create({
    data: {
      name: "Skyesports Championship",
      slug: "skyesports-championship",
      description: "South Asia's premier independent multi-title esports tournament brand.",
      status: "ACTIVE",
      ownerId: adminUser.id,
      members: {
        create: [
          { userId: adminUser.id, role: "TOURNAMENT_ORGANIZER" },
          { userId: refereeUser.id, role: "REFEREE" },
        ],
      },
    },
  });

  console.log("✅ Seeded 2 Organizations with tenant memberships.");

  // 3. Seed 4 Squad Teams (4 players each with Game IDs)
  const godlTeam = await prisma.team.create({
    data: {
      name: "GodLike Esports",
      tag: "GODL",
      description: "Iconic Indian battle-royale powerhouse known for aggressive offensive plays.",
      captainId: captainUser.id,
      players: {
        create: [
          { userId: captainUser.id, playerName: "GodL-JONATHAN", inGameId: "511223344", role: "CAPTAIN" },
          { playerName: "GodL-Neyoo", inGameId: "511223345", role: "PLAYER" },
          { playerName: "GodL-Zgod", inGameId: "511223346", role: "PLAYER" },
          { playerName: "GodL-Punkk", inGameId: "511223347", role: "PLAYER" },
        ],
      },
    },
  });

  const soulTeam = await prisma.team.create({
    data: {
      name: "Team Soul",
      tag: "SOUL",
      description: "Historic champions of BMPS and regional majors with a passionate global fanbase.",
      captainId: playerUser.id,
      players: {
        create: [
          { userId: playerUser.id, playerName: "Soul-Goblin", inGameId: "522334455", role: "CAPTAIN" },
          { playerName: "Soul-Hector", inGameId: "522334456", role: "PLAYER" },
          { playerName: "Soul-Akshat", inGameId: "522334457", role: "PLAYER" },
          { playerName: "Soul-Omega", inGameId: "522334458", role: "PLAYER" },
        ],
      },
    },
  });

  const txTeam = await prisma.team.create({
    data: {
      name: "Team XSpark",
      tag: "TX",
      description: "Premier high-tempo squad featuring some of the finest mechanically skilled fraggers.",
      captainId: captainTX.id,
      players: {
        create: [
          { userId: captainTX.id, playerName: "TX-ScoutOP", inGameId: "533445566", role: "CAPTAIN" },
          { playerName: "TX-Sarang", inGameId: "533445567", role: "PLAYER" },
          { playerName: "TX-NinjaBoi", inGameId: "533445568", role: "PLAYER" },
          { playerName: "TX-Shadow", inGameId: "533445569", role: "PLAYER" },
        ],
      },
    },
  });

  const blindTeam = await prisma.team.create({
    data: {
      name: "Blind Esports",
      tag: "BLIND",
      description: "Consistent tactical squad with supreme zone rotations and zone control.",
      captainId: captainBlind.id,
      players: {
        create: [
          { userId: captainBlind.id, playerName: "Blind-Manya", inGameId: "544556677", role: "CAPTAIN" },
          { playerName: "Blind-Spower", inGameId: "544556678", role: "PLAYER" },
          { playerName: "Blind-Nakul", inGameId: "544556679", role: "PLAYER" },
          { playerName: "Blind-Rony", inGameId: "544556680", role: "PLAYER" },
        ],
      },
    },
  });

  console.log("✅ Seeded 4 Teams with full 4-player rosters and in-game IDs.");

  // 4. Seed Tournaments
  // Tournament 1: LIVE Battle-Royale Tournament
  const now = new Date();
  const bgmiTournament = await prisma.tournament.create({
    data: {
      organizationId: kraftonOrg.id,
      organizerId: organizerUser.id,
      title: "BGMI Masters Series 2026 - Season 3",
      slug: "bgmi-masters-series-2026",
      description: "The official national premier battle royale championship featuring 20 elite squads competing across Erangel, Miramar, and Sanhok for the championship trophy.",
      game: "BGMI",
      rules: "Official KRAFTON Esports Ruleset 2026. 4-player squads. Standard competitive circles, vehicle spawns, and red-zone disabled. Top 16 placements earn points; 1 kill = 1 point.",
      teamCapacity: 20,
      teamSize: 4,
      scoringConfig: DEFAULT_SCORING_CONFIG,
      registrationStart: new Date(now.getTime() - 7 * 86400000),
      registrationEnd: new Date(now.getTime() - 2 * 86400000),
      tournamentStart: new Date(now.getTime() - 1 * 86400000),
      tournamentEnd: new Date(now.getTime() + 3 * 86400000),
      status: "LIVE",
      isFeatured: true,
      prizePool: 2500000,
      registrations: {
        create: [
          { teamId: godlTeam.id, registeredById: captainUser.id, status: "CONFIRMED", seed: 1 },
          { teamId: soulTeam.id, registeredById: playerUser.id, status: "CONFIRMED", seed: 2 },
          { teamId: txTeam.id, registeredById: captainTX.id, status: "CONFIRMED", seed: 3 },
          { teamId: blindTeam.id, registeredById: captainBlind.id, status: "CONFIRMED", seed: 4 },
        ],
      },
    },
  });

  // Lobby 1: Match 1 - Erangel (COMPLETED)
  const lobby1 = await prisma.lobby.create({
    data: {
      tournamentId: bgmiTournament.id,
      lobbyNumber: 1,
      title: "Match 1 - Erangel (Group Stage)",
      mapName: "Erangel",
      scheduledTime: new Date(now.getTime() - 2 * 3600000),
      revealTime: new Date(now.getTime() - 2 * 3600000 - 15 * 60000),
      roomId: "BGMI-MS3-L1",
      roomPassword: "erangel#pass#881",
      status: "COMPLETED",
      teams: {
        create: [
          { teamId: godlTeam.id, slotNumber: 1 },
          { teamId: soulTeam.id, slotNumber: 2 },
          { teamId: txTeam.id, slotNumber: 3 },
          { teamId: blindTeam.id, slotNumber: 4 },
        ],
      },
    },
  });

  // Seed verified results for Lobby 1
  // GodLike: 1st (15 pts) + 12 kills = 27 pts
  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby1.id,
      teamId: godlTeam.id,
      placement: 1,
      kills: 12,
      placementPoints: 15,
      killPoints: 12,
      totalPoints: 27,
      status: "VERIFIED",
      submittedById: captainUser.id,
      verifiedById: refereeUser.id,
      verifiedAt: new Date(now.getTime() - 1 * 3600000),
    },
  });

  // Soul: 2nd (12 pts) + 8 kills = 20 pts
  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby1.id,
      teamId: soulTeam.id,
      placement: 2,
      kills: 8,
      placementPoints: 12,
      killPoints: 8,
      totalPoints: 20,
      status: "VERIFIED",
      submittedById: playerUser.id,
      verifiedById: refereeUser.id,
      verifiedAt: new Date(now.getTime() - 1 * 3600000),
    },
  });

  // Team XSpark: 3rd (10 pts) + 6 kills = 16 pts
  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby1.id,
      teamId: txTeam.id,
      placement: 3,
      kills: 6,
      placementPoints: 10,
      killPoints: 6,
      totalPoints: 16,
      status: "VERIFIED",
      submittedById: captainTX.id,
      verifiedById: refereeUser.id,
      verifiedAt: new Date(now.getTime() - 1 * 3600000),
    },
  });

  // Blind Esports: 4th (8 pts) + 4 kills = 12 pts
  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby1.id,
      teamId: blindTeam.id,
      placement: 4,
      kills: 4,
      placementPoints: 8,
      killPoints: 4,
      totalPoints: 12,
      status: "VERIFIED",
      submittedById: captainBlind.id,
      verifiedById: refereeUser.id,
      verifiedAt: new Date(now.getTime() - 1 * 3600000),
    },
  });

  // Lobby 2: Match 2 - Miramar (LIVE / ROOM_POSTED with an active dispute)
  const lobby2 = await prisma.lobby.create({
    data: {
      tournamentId: bgmiTournament.id,
      lobbyNumber: 2,
      title: "Match 2 - Miramar (Group Stage)",
      mapName: "Miramar",
      scheduledTime: new Date(now.getTime() - 30 * 60000),
      revealTime: new Date(now.getTime() - 45 * 60000),
      roomId: "BGMI-MS3-L2",
      roomPassword: "miramar#krafton#99",
      status: "RESULTS_PENDING",
      teams: {
        create: [
          { teamId: godlTeam.id, slotNumber: 1 },
          { teamId: soulTeam.id, slotNumber: 2 },
          { teamId: txTeam.id, slotNumber: 3 },
          { teamId: blindTeam.id, slotNumber: 4 },
        ],
      },
    },
  });

  // Lobby 2 results (Soul won, GodLike disputed kills)
  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby2.id,
      teamId: soulTeam.id,
      placement: 1,
      kills: 14,
      placementPoints: 15,
      killPoints: 14,
      totalPoints: 29,
      status: "SUBMITTED",
      submittedById: playerUser.id,
    },
  });

  const disputedResult = await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby2.id,
      teamId: godlTeam.id,
      placement: 2,
      kills: 5, // contested by captain
      placementPoints: 12,
      killPoints: 5,
      totalPoints: 17,
      status: "DISPUTED",
      submittedById: organizerUser.id,
    },
  });

  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby2.id,
      teamId: blindTeam.id,
      placement: 3,
      kills: 7,
      placementPoints: 10,
      killPoints: 7,
      totalPoints: 17,
      status: "SUBMITTED",
      submittedById: captainBlind.id,
    },
  });

  await prisma.lobbyResult.create({
    data: {
      lobbyId: lobby2.id,
      teamId: txTeam.id,
      placement: 4,
      kills: 3,
      placementPoints: 8,
      killPoints: 3,
      totalPoints: 11,
      status: "SUBMITTED",
      submittedById: captainTX.id,
    },
  });

  // Seed 1 Active Dispute filed by GodLike Captain
  const activeDispute = await prisma.dispute.create({
    data: {
      tournamentId: bgmiTournament.id,
      lobbyId: lobby2.id,
      teamId: godlTeam.id,
      resultId: disputedResult.id,
      raisedById: captainUser.id,
      reason: "INCORRECT_KILLS",
      description: "Match 2 Miramar scoreboard incorrectly credited GodLike with only 5 kills. The official match end screen and replay log show Jonathan with 5 kills and Neyoo with 3 kills, yielding 8 total team kills.",
      evidenceUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
      status: "OPEN",
    },
  });

  // Tournament 2: Registration Open (Skyesports PUBG Mobile Invitational)
  const skyTournament = await prisma.tournament.create({
    data: {
      organizationId: skyesportsOrg.id,
      organizerId: adminUser.id,
      title: "PUBG Mobile World Invitational Qualifier 2026",
      slug: "pubg-mobile-world-invitational",
      description: "Open registration qualifier for South Asian squads aiming for the World Invitational in Riyadh. 25 lobby slots available.",
      game: "PUBG Mobile",
      rules: "Standard PUBG Mobile Global Championship rules. 25 squads per lobby. 6 matches over 2 matchdays.",
      teamCapacity: 25,
      teamSize: 4,
      scoringConfig: DEFAULT_SCORING_CONFIG,
      registrationStart: new Date(now.getTime() - 2 * 86400000),
      registrationEnd: new Date(now.getTime() + 5 * 86400000),
      tournamentStart: new Date(now.getTime() + 7 * 86400000),
      tournamentEnd: new Date(now.getTime() + 9 * 86400000),
      status: "REGISTRATION_OPEN",
      isFeatured: true,
      prizePool: 5000000,
      registrations: {
        create: [
          { teamId: godlTeam.id, registeredById: captainUser.id, status: "CONFIRMED", seed: 1 },
          { teamId: soulTeam.id, registeredById: playerUser.id, status: "CONFIRMED", seed: 2 },
        ],
      },
    },
  });

  // 5. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: refereeUser.id,
        organizationId: kraftonOrg.id,
        title: "Dispute Opened: Match 2 Miramar",
        message: "GodLike Esports has raised a dispute regarding recorded kills in Match 2 Miramar.",
        type: "DISPUTE",
        linkUrl: `/tournaments/${bgmiTournament.slug}`,
      },
      {
        userId: captainUser.id,
        title: "Room Credentials Posted",
        message: "Room ID and Password for Match 2 Miramar are now available to your squad.",
        type: "CREDENTIALS",
        linkUrl: `/tournaments/${bgmiTournament.slug}`,
      },
      {
        userId: playerUser.id,
        title: "Match 1 Results Verified",
        message: "Official referee has verified Match 1 Erangel scores. Team Soul earned 20 points.",
        type: "RESULT",
        linkUrl: `/tournaments/${bgmiTournament.slug}`,
      },
    ],
  });

  // 6. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: organizerUser.id,
        organizationId: kraftonOrg.id,
        action: "TOURNAMENT_CREATED",
        entityType: "Tournament",
        entityId: bgmiTournament.id,
        metadata: JSON.stringify({ title: bgmiTournament.title, capacity: 20 }),
      },
      {
        actorId: refereeUser.id,
        organizationId: kraftonOrg.id,
        action: "RESULTS_VERIFIED",
        entityType: "Lobby",
        entityId: lobby1.id,
        metadata: JSON.stringify({ verifiedMatch: "Match 1 - Erangel", teamsVerified: 4 }),
      },
      {
        actorId: captainUser.id,
        organizationId: kraftonOrg.id,
        action: "DISPUTE_RAISED",
        entityType: "Dispute",
        entityId: activeDispute.id,
        metadata: JSON.stringify({ reason: "INCORRECT_KILLS", team: "GodLike Esports" }),
      },
    ],
  });

  console.log("✅ ArenaHub Battle-Royale database successfully seeded!");
  console.log("---------------------------------------------------------");
  console.log("🔑 Demonstration Accounts:");
  console.log("👑 Platform Admin:        admin@arenahub.gg     / ArenaAdmin123!");
  console.log("🎯 Tournament Organizer:  organizer@arenahub.gg / Organizer123!");
  console.log("⚖️ Senior Referee:        referee@arenahub.gg   / Password123!");
  console.log("🛡️ Squad Captain (GodL):  captain@arenahub.gg   / Password123!");
  console.log("⚡ Squad Player (Soul):   player@arenahub.gg    / Password123!");
  console.log("👁️ Public Spectator:      spectator@arenahub.gg / Password123!");
  console.log("---------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
