import React from "react";
import Link from "next/link";
import { Trophy, Shield, Medal, Crosshair, Users, Flame } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function LeaderboardsPage() {
  const [teams, players] = await Promise.all([
    prisma.team.findMany({
      take: 15,
      orderBy: { createdAt: "asc" },
      include: {
        captain: { select: { username: true, name: true } },
        players: true,
        lobbyResults: {
          where: { status: "VERIFIED" },
        },
        _count: {
          select: {
            tournamentRegistrations: true,
            lobbyAssignments: true,
          },
        },
      },
    }),
    prisma.teamPlayer.findMany({
      take: 20,
      include: {
        team: { select: { id: true, name: true, tag: true } },
      },
    }),
  ]);

  // Aggregate team stats: WWCD, Kills, Total Points
  const rankedTeams = teams.map((team) => {
    let wwcd = 0;
    let kills = 0;
    let points = 0;

    team.lobbyResults.forEach((res) => {
      if (res.placement === 1) wwcd += 1;
      kills += res.kills;
      points += res.totalPoints;
    });

    return {
      ...team,
      wwcd,
      kills,
      points,
    };
  });

  rankedTeams.sort((a, b) => b.points - a.points || b.kills - a.kills || b.wwcd - a.wwcd);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
            Official Battle Royale Power Rankings
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Competitive Squad & Player Leaderboards
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
          Live rankings aggregated from official lobby match results, WWCD counts, and frag tallies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Squad Standings Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Shield className="w-4 h-4 text-amber-500" /> Top Battle Royale Squads
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ranked by Total Points</span>
          </div>

          <div className="bg-[#0e131b] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#090c10] border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <span className="col-span-1">Rank</span>
              <span className="col-span-5">Squad</span>
              <span className="col-span-2 text-center">WWCD</span>
              <span className="col-span-2 text-center">Kills</span>
              <span className="col-span-2 text-right">Points</span>
            </div>

            <div className="divide-y divide-white/5">
              {rankedTeams.map((t, idx) => (
                <div
                  key={t.id}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-slate-800/30 transition-colors"
                >
                  <span className="col-span-1 font-mono font-bold">
                    {idx === 0 ? (
                      <span className="text-amber-400 font-black">#1</span>
                    ) : idx === 1 ? (
                      <span className="text-slate-300 font-black">#2</span>
                    ) : idx === 2 ? (
                      <span className="text-amber-600 font-black">#3</span>
                    ) : (
                      <span className="text-slate-500">#{idx + 1}</span>
                    )}
                  </span>

                  <div className="col-span-5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#141b24] border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-400 font-mono">
                      {t.tag}
                    </div>
                    <div>
                      <Link
                        href={`/teams/${t.id}`}
                        className="font-bold text-white hover:text-amber-400 transition-colors block truncate"
                      >
                        {t.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Captain: @{t.captain.username}
                      </span>
                    </div>
                  </div>

                  <span className="col-span-2 text-center font-mono font-bold text-amber-400">
                    {t.wwcd}
                  </span>

                  <span className="col-span-2 text-center font-mono text-slate-300">
                    {t.kills}
                  </span>

                  <span className="col-span-2 text-right font-mono font-black text-amber-500 text-sm">
                    {t.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Players / Fraggers Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Crosshair className="w-4 h-4 text-amber-500" /> Registered Fraggers
            </h3>
            <span className="text-xs text-slate-400 font-mono">Active Roster</span>
          </div>

          <div className="bg-[#0e131b] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
            {players.slice(0, 10).map((p, idx) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-slate-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      {p.playerName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      [{p.team.tag}] {p.team.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#090c10] border border-white/5 text-amber-400">
                    ID: {p.inGameId}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#0e131b] border border-white/10 text-xs text-slate-400 space-y-2 shadow-xl">
            <div className="flex items-center gap-1.5 text-slate-200 font-mono font-bold uppercase text-[10px]">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Official Scoring Matrix
            </div>
            <p className="text-[11px] leading-relaxed font-sans">
              Points are evaluated from verified placement points (1st = 15, 2nd = 12, 3rd = 10, etc.) and +1 point per verified frag kill. Tie-breakers prioritize total match points, then total kills, then WWCDs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
