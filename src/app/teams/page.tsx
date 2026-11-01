import React from "react";
import Link from "next/link";
import { Users, Plus, Shield, ArrowRight, UserCheck, Gamepad2 } from "lucide-react";
import { TeamService } from "@/services/team.service";
import { Button } from "@/components/ui/button";

export default async function TeamsPage() {
  const teams = await TeamService.list({ limit: 50 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
              Competitive Battle Royale Squads
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Esports Teams & Squad Rosters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verified 4-player competitive squads competing in official tournament lobbies.
          </p>
        </div>
        <Link href="/teams/create">
          <Button variant="primary" size="md" className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Register Squad
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="group bg-[#0e131b] border border-white/10 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#141b24] border border-amber-500/30 flex items-center justify-center font-black text-base text-amber-400 font-mono shadow-md">
                    {team.tag}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                      {team.name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Captain: <strong className="text-slate-200">{team.captain.username}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                  4-Player Squad
                </span>
              </div>

              {team.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {team.description}
                </p>
              )}

              {/* Roster preview */}
              <div className="mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-2">
                  Active Squad Members ({team.players.length}/5)
                </span>
                <div className="space-y-1.5">
                  {team.players.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-[#090c10] border border-white/5"
                    >
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        {p.playerName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {p.inGameId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#090c10] border border-white/5 text-xs mb-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block font-mono">
                    Tournaments
                  </span>
                  <span className="font-bold text-white font-mono text-sm">
                    {team._count.tournamentRegistrations} Entered
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block font-mono">
                    Lobbies Played
                  </span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {team._count.lobbyAssignments} Matches
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/teams/${team.id}`}>
              <Button variant="secondary" size="sm" className="w-full justify-between">
                <span>View Full Squad Profile</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
