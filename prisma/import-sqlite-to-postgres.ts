import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const exportPath = path.join(__dirname, "sqlite_data_export.json");
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Data snapshot not found at ${exportPath}`);
  }

  const data = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  console.log("🚀 Starting controlled data migration from SQLite snapshot to PostgreSQL...");

  // 1. Users
  console.log(`Migrating ${data.users.length} users...`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        username: u.username,
        role: u.role,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        phone: u.phone,
        inGameId: u.inGameId,
        inGameName: u.inGameName,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }

  // 2. Organizations
  console.log(`Migrating ${data.organizations.length} organizations...`);
  for (const org of data.organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {},
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        status: org.status,
        ownerId: org.ownerId,
        createdAt: new Date(org.createdAt),
        updatedAt: new Date(org.updatedAt),
      },
    });
  }

  // 3. OrgMemberships
  console.log(`Migrating ${data.orgMemberships.length} org memberships...`);
  for (const m of data.orgMemberships) {
    await prisma.orgMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: m.organizationId,
          userId: m.userId,
        },
      },
      update: {},
      create: {
        id: m.id,
        organizationId: m.organizationId,
        userId: m.userId,
        role: m.role,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      },
    });
  }

  // 4. Teams
  console.log(`Migrating ${data.teams.length} teams...`);
  for (const t of data.teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        tag: t.tag,
        logoUrl: t.logoUrl,
        description: t.description,
        captainId: t.captainId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  // 5. TeamPlayers
  console.log(`Migrating ${data.teamPlayers.length} team players...`);
  for (const p of data.teamPlayers) {
    await prisma.teamPlayer.upsert({
      where: {
        teamId_inGameId: {
          teamId: p.teamId,
          inGameId: p.inGameId,
        },
      },
      update: {},
      create: {
        id: p.id,
        teamId: p.teamId,
        userId: p.userId,
        playerName: p.playerName,
        inGameId: p.inGameId,
        role: p.role,
        joinedAt: new Date(p.joinedAt),
      },
    });
  }

  // 6. Tournaments
  console.log(`Migrating ${data.tournaments.length} tournaments...`);
  for (const t of data.tournaments) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        organizationId: t.organizationId,
        organizerId: t.organizerId,
        title: t.title,
        slug: t.slug,
        description: t.description,
        game: t.game,
        bannerUrl: t.bannerUrl,
        rules: t.rules,
        teamCapacity: t.teamCapacity,
        teamSize: t.teamSize,
        scoringConfig: t.scoringConfig,
        registrationStart: new Date(t.registrationStart),
        registrationEnd: new Date(t.registrationEnd),
        tournamentStart: new Date(t.tournamentStart),
        tournamentEnd: t.tournamentEnd ? new Date(t.tournamentEnd) : null,
        status: t.status,
        isFeatured: t.isFeatured,
        prizePool: t.prizePool,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  // 7. TournamentRegistrations
  console.log(`Migrating ${data.tournamentRegistrations.length} registrations...`);
  for (const reg of data.tournamentRegistrations) {
    await prisma.tournamentRegistration.upsert({
      where: {
        tournamentId_teamId: {
          tournamentId: reg.tournamentId,
          teamId: reg.teamId,
        },
      },
      update: {},
      create: {
        id: reg.id,
        tournamentId: reg.tournamentId,
        teamId: reg.teamId,
        registeredById: reg.registeredById,
        status: reg.status,
        seed: reg.seed,
        registeredAt: new Date(reg.registeredAt),
      },
    });
  }

  // 8. Lobbies
  console.log(`Migrating ${data.lobbies.length} lobbies...`);
  for (const l of data.lobbies) {
    await prisma.lobby.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        tournamentId: l.tournamentId,
        lobbyNumber: l.lobbyNumber,
        title: l.title,
        mapName: l.mapName,
        scheduledTime: new Date(l.scheduledTime),
        revealTime: new Date(l.revealTime),
        roomId: l.roomId,
        roomPassword: l.roomPassword,
        status: l.status,
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
      },
    });
  }

  // 9. LobbyTeams
  console.log(`Migrating ${data.lobbyTeams.length} lobby teams...`);
  for (const lt of data.lobbyTeams) {
    await prisma.lobbyTeam.upsert({
      where: {
        lobbyId_teamId: {
          lobbyId: lt.lobbyId,
          teamId: lt.teamId,
        },
      },
      update: {},
      create: {
        id: lt.id,
        lobbyId: lt.lobbyId,
        teamId: lt.teamId,
        slotNumber: lt.slotNumber,
        assignedAt: new Date(lt.assignedAt),
      },
    });
  }

  // 10. LobbyResults
  console.log(`Migrating ${data.lobbyResults.length} lobby results...`);
  for (const lr of data.lobbyResults) {
    await prisma.lobbyResult.upsert({
      where: {
        lobbyId_teamId: {
          lobbyId: lr.lobbyId,
          teamId: lr.teamId,
        },
      },
      update: {},
      create: {
        id: lr.id,
        lobbyId: lr.lobbyId,
        teamId: lr.teamId,
        placement: lr.placement,
        kills: lr.kills,
        placementPoints: lr.placementPoints,
        killPoints: lr.killPoints,
        totalPoints: lr.totalPoints,
        status: lr.status,
        screenshotUrl: lr.screenshotUrl,
        submittedById: lr.submittedById,
        verifiedById: lr.verifiedById,
        submittedAt: new Date(lr.submittedAt),
        verifiedAt: lr.verifiedAt ? new Date(lr.verifiedAt) : null,
      },
    });
  }

  // 11. Disputes
  console.log(`Migrating ${data.disputes.length} disputes...`);
  for (const d of data.disputes) {
    await prisma.dispute.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        tournamentId: d.tournamentId,
        lobbyId: d.lobbyId,
        teamId: d.teamId,
        resultId: d.resultId,
        raisedById: d.raisedById,
        refereeId: d.refereeId,
        reason: d.reason,
        description: d.description,
        evidenceUrl: d.evidenceUrl,
        status: d.status,
        resolutionNotes: d.resolutionNotes,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
        resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : null,
      },
    });
  }

  // 12. Notifications
  console.log(`Migrating ${data.notifications.length} notifications...`);
  for (const n of data.notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        userId: n.userId,
        organizationId: n.organizationId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        linkUrl: n.linkUrl,
        createdAt: new Date(n.createdAt),
      },
    });
  }

  // 13. AuditLogs
  console.log(`Migrating ${data.auditLogs.length} audit logs...`);
  for (const a of data.auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        actorId: a.actorId,
        organizationId: a.organizationId,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: a.metadata,
        createdAt: new Date(a.createdAt),
      },
    });
  }

  console.log("✅ Data migration to PostgreSQL completed successfully!");

  // Validate counts
  const postgreCounts = {
    users: await prisma.user.count(),
    organizations: await prisma.organization.count(),
    orgMemberships: await prisma.orgMembership.count(),
    teams: await prisma.team.count(),
    teamPlayers: await prisma.teamPlayer.count(),
    tournaments: await prisma.tournament.count(),
    tournamentRegistrations: await prisma.tournamentRegistration.count(),
    lobbies: await prisma.lobby.count(),
    lobbyTeams: await prisma.lobbyTeam.count(),
    lobbyResults: await prisma.lobbyResult.count(),
    disputes: await prisma.dispute.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log("\n=== POSTGRESQL RECORD COUNT VALIDATION ===");
  const comparison = Object.keys(data.counts).map((key) => ({
    Entity: key,
    SQLite_Source: (data.counts as any)[key],
    PostgreSQL_Target: (postgreCounts as any)[key],
    Status: (data.counts as any)[key] === (postgreCounts as any)[key] ? "MATCH" : "MISMATCH",
  }));
  console.table(comparison);

  const hasMismatch = comparison.some((c) => c.Status === "MISMATCH");
  if (hasMismatch) {
    throw new Error("Validation failed: Count mismatch between SQLite source and PostgreSQL target.");
  }
  console.log("🎉 All entity counts match 100%!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
