import { prisma } from "@/lib/db";

export interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string;
  logoUrl?: string | null;
  matchesPlayed: number;
  wins: number; // WWCD
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  bestPlacement: number;
}

export class StandingsService {
  /**
   * Recalculates and aggregates overall tournament standings from verified match results
   */
  static async getTournamentStandings(tournamentId: string): Promise<TeamStanding[]> {
    // Fetch all confirmed registered teams to ensure even teams with 0 matches are represented
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: "CONFIRMED",
      },
      include: {
        team: true,
      },
    });

    // Fetch all results for lobbies belonging to this tournament
    const results = await prisma.lobbyResult.findMany({
      where: {
        lobby: { tournamentId },
        status: { in: ["SUBMITTED", "VERIFIED"] },
      },
      include: {
        team: true,
      },
    });

    const teamMap: { [teamId: string]: TeamStanding } = {};

    // Initialize all registered teams
    for (const reg of registrations) {
      teamMap[reg.teamId] = {
        rank: 0,
        teamId: reg.team.id,
        teamName: reg.team.name,
        teamTag: reg.team.tag,
        logoUrl: reg.team.logoUrl,
        matchesPlayed: 0,
        wins: 0,
        kills: 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        bestPlacement: 999,
      };
    }

    // Accumulate results
    for (const res of results) {
      if (!teamMap[res.teamId]) {
        teamMap[res.teamId] = {
          rank: 0,
          teamId: res.team.id,
          teamName: res.team.name,
          teamTag: res.team.tag,
          logoUrl: res.team.logoUrl,
          matchesPlayed: 0,
          wins: 0,
          kills: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
          bestPlacement: 999,
        };
      }

      const entry = teamMap[res.teamId];
      entry.matchesPlayed += 1;
      if (res.placement === 1) {
        entry.wins += 1;
      }
      entry.kills += res.kills;
      entry.placementPoints += res.placementPoints;
      entry.killPoints += res.killPoints;
      entry.totalPoints += res.totalPoints;
      if (res.placement < entry.bestPlacement) {
        entry.bestPlacement = res.placement;
      }
    }

    const standingsList = Object.values(teamMap);

    // Deterministic Battle-Royale Tie-breaking
    standingsList.sort((a, b) => {
      // 1. Total Points
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // 2. Kill Points
      if (b.killPoints !== a.killPoints) {
        return b.killPoints - a.killPoints;
      }
      // 3. WWCD (Wins)
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // 4. Best Placement (lower number is better)
      if (a.bestPlacement !== b.bestPlacement) {
        return a.bestPlacement - b.bestPlacement;
      }
      // 5. Alphabetical tag
      return a.teamTag.localeCompare(b.teamTag);
    });

    // Assign rank numbers
    return standingsList.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      bestPlacement: item.bestPlacement === 999 ? 0 : item.bestPlacement,
    }));
  }
}
