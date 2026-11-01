import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

async function main() {
  const counts = {
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

  console.log("=== SQLITE DATABASE RECORD COUNTS ===");
  console.table(counts);

  // Export full snapshot to JSON for preservation and verification
  const snapshot = {
    counts,
    users: await prisma.user.findMany(),
    organizations: await prisma.organization.findMany(),
    orgMemberships: await prisma.orgMembership.findMany(),
    teams: await prisma.team.findMany(),
    teamPlayers: await prisma.teamPlayer.findMany(),
    tournaments: await prisma.tournament.findMany(),
    tournamentRegistrations: await prisma.tournamentRegistration.findMany(),
    lobbies: await prisma.lobby.findMany(),
    lobbyTeams: await prisma.lobbyTeam.findMany(),
    lobbyResults: await prisma.lobbyResult.findMany(),
    disputes: await prisma.dispute.findMany(),
    notifications: await prisma.notification.findMany(),
    auditLogs: await prisma.auditLog.findMany(),
  };

  const exportPath = path.join(__dirname, "sqlite_data_export.json");
  fs.writeFileSync(exportPath, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Snapshot saved to ${exportPath}`);
}

main()
  .catch((e) => {
    console.error("Export error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
