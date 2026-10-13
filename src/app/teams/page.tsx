import React from "react";
import Link from "next/link";
import { Users, Plus, Shield, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";


export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      game: true,
      captain: { select: { username: true } },
      _count: { select: { members: true, tournamentRegistrations: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Esports Teams & Rosters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Discover established competitive rosters or create your own team to compete in squad tournaments.
          </p>
        </div>
        <Link href="/teams/create">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" /> Create Team
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="group bg-[#0f1420] border border-white/[0.08] hover:border-indigo-500/40 rounded-xl p-6 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center font-bold text-base text-indigo-400 font-mono">
                    {team.tag}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                      {team.name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Captain: <strong className="text-slate-300">{team.captain.username}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-white/10 text-indigo-300 px-2.5 py-1 rounded">
                  {team.game.title}
                </span>
              </div>

              {team.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {team.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#141b2a] border border-white/5 text-xs mb-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                    Roster Size
                  </span>
                  <span className="font-bold text-white font-mono">
                    {team._count.members} Members
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                    Tournaments
                  </span>
                  <span className="font-bold text-white font-mono">
                    {team._count.tournamentRegistrations} Entered
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/teams/${team.id}`}>
              <Button variant="secondary" size="sm" className="w-full justify-between">
                <span>View Roster</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
