import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ArenaHub database with realistic esports data...");

  // Clean existing demonstration records
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminPasswordHash = await bcrypt.hash("ArenaAdmin123!", 10);
  const organizerPasswordHash = await bcrypt.hash("Organizer123!", 10);

  // 1. Seed Core Demonstration Users
  const adminUser = await prisma.user.create({
    data: {
      name: "ArenaHub Administrator",
      username: "admin",
      email: "admin@arenahub.gg",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      bio: "Platform Administrator & Head of Esports Operations.",
      region: "GLOBAL",
      preferredGame: "Valorant",
      discordTag: "admin#0001",
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      username: "apex_organizer",
      email: "organizer@arenahub.gg",
      passwordHash: organizerPasswordHash,
      role: "ORGANIZER",
      bio: "Official Tournament Director for North American Masters.",
      region: "NA",
      preferredGame: "Counter-Strike 2",
      discordTag: "marcus_vance#1337",
    },
  });

  const captainUser = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      username: "vanguard_cap",
      email: "captain@arenahub.gg",
      passwordHash: passwordHash,
      role: "PLAYER",
      bio: "In-game leader for Team Vanguard. 5x Regional Champion.",
      region: "EU",
      preferredGame: "Valorant",
      discordTag: "elena_igl#9999",
    },
  });

  const playerUser = await prisma.user.create({
    data: {
      name: "Kai 'Shadow' Tanaka",
      username: "shadow_striker",
      email: "player@arenahub.gg",
      passwordHash: passwordHash,
      role: "PLAYER",
      bio: "Duelist & Entry fragger. Competing at peak radiant tier.",
      region: "APAC",
      preferredGame: "Valorant",
      discordTag: "kai_shadow#7777",
    },
  });

  // Additional competitive players for brackets
  const additionalPlayers = [
    { name: "Liam Chen", username: "blaze_sniper", email: "blaze@arenahub.gg", region: "NA" },
    { name: "Sophia Miller", username: "valkyrie_core", email: "valkyrie@arenahub.gg", region: "EU" },
    { name: "Mateo Silva", username: "phantom_reflex", email: "phantom@arenahub.gg", region: "GLOBAL" },
    { name: "Yuki Sato", username: "tsunami_ace", email: "tsunami@arenahub.gg", region: "APAC" },
    { name: "Lucas Dubois", username: "iron_shield", email: "iron@arenahub.gg", region: "EU" },
    { name: "David Kim", username: "apex_predator", email: "apex@arenahub.gg", region: "NA" },
  ];

  const seededPlayers: any[] = [captainUser, playerUser];
  for (const p of additionalPlayers) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        username: p.username,
        email: p.email,
        passwordHash,
        role: "PLAYER",
        region: p.region,
        bio: `Competitive esports athlete competing in premier circuits.`,
      },
    });
    seededPlayers.push(user);
  }

  // 2. Seed Games
  const valorant = await prisma.game.create({
    data: {
      title: "Valorant",
      slug: "valorant",
      genre: "Tactical FPS",
      teamSize: 5,
      platforms: "PC",
      bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    },
  });

  const cs2 = await prisma.game.create({
    data: {
      title: "Counter-Strike 2",
      slug: "cs2",
      genre: "Tactical FPS",
      teamSize: 5,
      platforms: "PC",
      bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    },
  });

  const lol = await prisma.game.create({
    data: {
      title: "League of Legends",
      slug: "league-of-legends",
      genre: "MOBA",
      teamSize: 5,
      platforms: "PC",
      bannerUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
    },
  });

  const rocketLeague = await prisma.game.create({
    data: {
      title: "Rocket League",
      slug: "rocket-league",
      genre: "Sports / Vehicular",
      teamSize: 3,
      platforms: "PC, PS5, Xbox",
      bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
    },
  });

  // 3. Seed Teams
  const vanguardTeam = await prisma.team.create({
    data: {
      name: "Team Vanguard",
      tag: "VNG",
      description: "Premier European tactical esports organization competing at international majors.",
      gameId: valorant.id,
      captainId: captainUser.id,
      members: {
        create: [
          { userId: captainUser.id, role: "CAPTAIN" },
          { userId: playerUser.id, role: "MEMBER" },
          { userId: seededPlayers[2].id, role: "MEMBER" },
        ],
      },
    },
  });

  const eclipseTeam = await prisma.team.create({
    data: {
      name: "Eclipse Gaming",
      tag: "ECL",
      description: "North American tactical squad with high aggressive tempo.",
      gameId: cs2.id,
      captainId: seededPlayers[3].id,
      members: {
        create: [
          { userId: seededPlayers[3].id, role: "CAPTAIN" },
          { userId: seededPlayers[4].id, role: "MEMBER" },
        ],
      },
    },
  });

  // 4. Seed Tournaments
  // Tournament 1: Completed Tournament with Bracket & Results
  const completedTournament = await prisma.tournament.create({
    data: {
      title: "League of Legends Rift Masters Spring 2026",
      slug: "lol-rift-masters-spring-2026",
      description: "Elite 4-player knockout invitational to determine the regional spring champion.",
      gameId: lol.id,
      organizerId: organizerUser.id,
      format: "SINGLE_ELIMINATION",
      type: "SOLO",
      status: "COMPLETED",
      maxParticipants: 4,
      registrationDeadline: new Date(Date.now() - 7 * 86400000),
      startDate: new Date(Date.now() - 5 * 86400000),
      endDate: new Date(Date.now() - 4 * 86400000),
      rulesText: "Standard Tournament Draft. Best of 3 Semi-Finals, Best of 5 Grand Final. Server: EU West.",
      prizePool: 5000,
      isFeatured: true,
      registrations: {
        create: [
          { userId: seededPlayers[0].id, seed: 1, status: "CONFIRMED" },
          { userId: seededPlayers[1].id, seed: 2, status: "CONFIRMED" },
          { userId: seededPlayers[2].id, seed: 3, status: "CONFIRMED" },
          { userId: seededPlayers[3].id, seed: 4, status: "CONFIRMED" },
        ],
      },
    },
  });

  // Create matches for the completed tournament (Round 1: 2 matches, Round 2: 1 Grand Final)
  const finalMatch = await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      round: 2,
      matchNumber: 1,
      participant1Id: seededPlayers[0].id,
      participant1Name: seededPlayers[0].username,
      participant2Id: seededPlayers[1].id,
      participant2Name: seededPlayers[1].username,
      score1: 3,
      score2: 1,
      winnerId: seededPlayers[0].id,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      round: 1,
      matchNumber: 1,
      participant1Id: seededPlayers[0].id,
      participant1Name: seededPlayers[0].username,
      participant2Id: seededPlayers[2].id,
      participant2Name: seededPlayers[2].username,
      score1: 2,
      score2: 0,
      winnerId: seededPlayers[0].id,
      status: "COMPLETED",
      nextMatchId: finalMatch.id,
      completedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      round: 1,
      matchNumber: 2,
      participant1Id: seededPlayers[1].id,
      participant1Name: seededPlayers[1].username,
      participant2Id: seededPlayers[3].id,
      participant2Name: seededPlayers[3].username,
      score1: 2,
      score2: 1,
      winnerId: seededPlayers[1].id,
      status: "COMPLETED",
      nextMatchId: finalMatch.id,
      completedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  // Tournament 2: Ongoing Tournament (Valorant Champions Open)
  const ongoingTournament = await prisma.tournament.create({
    data: {
      title: "VALORANT Champions Open 2026",
      slug: "valorant-champions-open-2026",
      description: "High-stakes 4-competitor bracket. Round 1 has concluded, Grand Final underway!",
      gameId: valorant.id,
      organizerId: organizerUser.id,
      format: "SINGLE_ELIMINATION",
      type: "SOLO",
      status: "ONGOING",
      maxParticipants: 4,
      registrationDeadline: new Date(Date.now() - 2 * 86400000),
      startDate: new Date(Date.now() - 1 * 86400000),
      rulesText: "Standard Competitive Ruleset. Overtime Win by 2. All agents permitted.",
      prizePool: 2500,
      isFeatured: true,
      registrations: {
        create: [
          { userId: seededPlayers[0].id, status: "CONFIRMED" },
          { userId: seededPlayers[1].id, status: "CONFIRMED" },
          { userId: seededPlayers[2].id, status: "CONFIRMED" },
          { userId: seededPlayers[3].id, status: "CONFIRMED" },
        ],
      },
    },
  });

  const ongoingFinal = await prisma.match.create({
    data: {
      tournamentId: ongoingTournament.id,
      round: 2,
      matchNumber: 1,
      participant1Id: seededPlayers[0].id,
      participant1Name: seededPlayers[0].username,
      participant2Id: seededPlayers[1].id,
      participant2Name: seededPlayers[1].username,
      score1: 1,
      score2: 0,
      status: "IN_PROGRESS",
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: ongoingTournament.id,
      round: 1,
      matchNumber: 1,
      participant1Id: seededPlayers[0].id,
      participant1Name: seededPlayers[0].username,
      participant2Id: seededPlayers[2].id,
      participant2Name: seededPlayers[2].username,
      score1: 13,
      score2: 9,
      winnerId: seededPlayers[0].id,
      status: "COMPLETED",
      nextMatchId: ongoingFinal.id,
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: ongoingTournament.id,
      round: 1,
      matchNumber: 2,
      participant1Id: seededPlayers[1].id,
      participant1Name: seededPlayers[1].username,
      participant2Id: seededPlayers[3].id,
      participant2Name: seededPlayers[3].username,
      score1: 13,
      score2: 11,
      winnerId: seededPlayers[1].id,
      status: "COMPLETED",
      nextMatchId: ongoingFinal.id,
    },
  });

  // Tournament 3: Registration Open (CS2 Global Invitational Qualifier)
  await prisma.tournament.create({
    data: {
      title: "CS2 Global Invitational Qualifier",
      slug: "cs2-global-invitational-qualifier",
      description: "Open registration qualifier for the winter major. Limited to 8 team/solo slots.",
      gameId: cs2.id,
      organizerId: organizerUser.id,
      format: "SINGLE_ELIMINATION",
      type: "SOLO",
      status: "REGISTRATION_OPEN",
      maxParticipants: 8,
      registrationDeadline: new Date(Date.now() + 5 * 86400000),
      startDate: new Date(Date.now() + 7 * 86400000),
      rulesText: "MR12 overtime rules. Valve Anti-Cheat enabled. Demo recording required.",
      prizePool: 10000,
      isFeatured: true,
      registrations: {
        create: [
          { userId: seededPlayers[0].id, status: "CONFIRMED" },
          { userId: seededPlayers[1].id, status: "CONFIRMED" },
          { userId: seededPlayers[4].id, status: "CONFIRMED" },
        ],
      },
    },
  });

  // Tournament 4: Upcoming Tournament
  await prisma.tournament.create({
    data: {
      title: "Rocket League Velocity Cup",
      slug: "rocket-league-velocity-cup",
      description: "Fast-paced vehicular competitive showdown across all supported platforms.",
      gameId: rocketLeague.id,
      organizerId: adminUser.id,
      format: "SINGLE_ELIMINATION",
      type: "SOLO",
      status: "UPCOMING",
      maxParticipants: 16,
      registrationDeadline: new Date(Date.now() + 12 * 86400000),
      startDate: new Date(Date.now() + 14 * 86400000),
      rulesText: "5-minute regulation. Golden goal overtime. Standard maps.",
      prizePool: 1500,
    },
  });

  // 5. Seed Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: "PLATFORM_INITIALIZATION",
      targetType: "SYSTEM",
      targetId: "SYSTEM_ROOT",
      metadata: JSON.stringify({
        environment: "production-ready",
        seededAt: new Date().toISOString(),
      }),
    },
  });

  console.log("✅ ArenaHub database successfully seeded!");
  console.log("-----------------------------------------");
  console.log("Demonstration Credentials:");
  console.log("👑 Admin:     admin@arenahub.gg     / ArenaAdmin123!");
  console.log("🎯 Organizer: organizer@arenahub.gg / Organizer123!");
  console.log("🛡️ Captain:   captain@arenahub.gg   / Password123!");
  console.log("⚡ Player:    player@arenahub.gg    / Password123!");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
