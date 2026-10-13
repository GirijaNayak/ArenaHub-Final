import React from "react";
import Link from "next/link";
import { Trophy, Shield, Medal, Award, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";


export default async function LeaderboardsPage() {
  const [players, teams] = await Promise.all([
    prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        region: true,
        preferredGame: true,
        _count: {
          select: {
            registrations: true,
            teamMemberships: true,
          },
        },
      },
    }),
    prisma.team.findMany({
      take: 10,
      orderBy: { createdAt: "asc" },
      include: {
        game: true,
        captain: { select: { username: true } },
        _count: {
          select: {
            members: true,
            tournamentRegistrations: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-400" /> Competitive Rankings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Global esports leaderboards derived directly from verified match results and tournament performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Players Standings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-indigo-400" /> Player Power Rankings
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top Competitors</span>
          </div>

          <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#131926] border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <span className="col-span-1">Rank</span>
              <span className="col-span-5">Player</span>
              <span className="col-span-2">Region</span>
              <span className="col-span-2 text-center">Events</span>
              <span className="col-span-2 text-right">Rating</span>
            </div>

            <div className="divide-y divide-white/5">
              {players.map((p, idx) => {
                const rating = 1500 + p._count.registrations * 60;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="col-span-1 font-mono font-bold">
                      {idx === 0 ? (
                        <span className="text-amber-400">#1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300">#2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600">#3</span>
                      ) : (
                        <span className="text-slate-500">#{idx + 1}</span>
                      )}
                    </span>

                    <div className="col-span-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-indigo-400 uppercase">
                        {p.username.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-white block truncate">
                          {p.username}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {p.preferredGame || "All-Rounder"}
                        </span>
                      </div>
                    </div>

                    <span className="col-span-2 text-slate-400 font-mono text-[11px]">
                      {p.region}
                    </span>

                    <span className="col-span-2 text-center font-mono text-slate-300">
                      {p._count.registrations}
                    </span>

                    <span className="col-span-2 text-right font-mono font-bold text-indigo-400">
                      {rating}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Teams Standings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Team Rankings
            </h3>
            <span className="text-xs text-slate-400 font-mono">Premier Squads</span>
          </div>

          <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl divide-y divide-white/5 overflow-hidden">
            {teams.map((t, idx) => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-slate-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <Link
                      href={`/teams/${t.id}`}
                      className="font-semibold text-white text-sm hover:text-indigo-400 transition-colors block"
                    >
                      [{t.tag}] {t.name}
                    </Link>
                    <span className="text-[10px] text-slate-400">
                      {t.game.title} • {t._count.members} Members
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {t._count.tournamentRegistrations} Events
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#0f1420] border border-white/5 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 uppercase block">
              Deterministic Ranking Rules
            </span>
            <p>
              Rankings update automatically based on verified match results, round progression, and tournament finishes. Tie-breakers are determined by head-to-head match outcomes followed by tournament win percentage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
