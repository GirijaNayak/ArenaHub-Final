import React from "react";
import Link from "next/link";
import { Trophy, Shield, Users, Crosshair, ArrowRight, ShieldAlert, KeyRound, Flame } from "lucide-react";
import { prisma } from "@/lib/db";
import { TournamentCard } from "@/components/tournament-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [
    featuredTournaments,
    totalOrgs,
    totalTournaments,
    totalLobbies,
    totalTeams,
  ] = await Promise.all([
    prisma.tournament.findMany({
      take: 3,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: {
        organization: { select: { name: true, slug: true, logoUrl: true } },
        _count: { select: { registrations: true, lobbies: true } },
      },
    }),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.tournament.count(),
    prisma.lobby.count(),
    prisma.team.count(),
  ]);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-white/[0.08] bg-[#090c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#161f2c] border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold mb-6">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Tenant Battle-Royale Esports Operations SaaS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase font-mono max-w-4xl mx-auto leading-tight mb-4">
            Commercial Tournament Management for <span className="text-amber-400">Battle-Royale</span> Esports
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            The complete esports operations platform for independent organizations. Manage shared battle-royale lobbies, time-restricted room credentials, verified placement & kill scoring, automated standings, and referee dispute resolution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link href="/tournaments" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full gap-2">
                <Trophy className="w-4 h-4" /> Explore Tournaments
              </Button>
            </Link>
            <Link href="/tournaments/create" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full gap-2">
                Host Competition
              </Button>
            </Link>
          </div>

          {/* Platform Performance Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mt-16 pt-8 border-t border-white/[0.08]">
            <div className="p-3.5 rounded-lg surface-panel">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {totalOrgs}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                Esports Orgs
              </div>
            </div>
            <div className="p-3.5 rounded-lg surface-panel">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                {totalTournaments}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                Tournaments
              </div>
            </div>
            <div className="p-3.5 rounded-lg surface-panel">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {totalLobbies}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                Match Lobbies
              </div>
            </div>
            <div className="p-3.5 rounded-lg surface-panel">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                {totalTeams}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                Registered Squads
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <Crosshair className="w-3.5 h-3.5" /> Live Competitions
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Featured Battle-Royale Tournaments
            </h2>
          </div>
          <Link href="/tournaments">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              View All Tournaments <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-14 bg-[#0a0d14] border-t border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              Engineered for Battle-Royale Tournament Workflows
            </h2>
            <p className="text-xs text-slate-400">
              Designed specifically for multi-squad battle-royale operations with shared lobbies and time-gated room credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-panel p-5 rounded-lg border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Time-Restricted Room Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Room IDs and passwords are cryptographically hidden on the server until the exact reveal time, preventing room leaks.
              </p>
            </div>

            <div className="surface-panel p-5 rounded-lg border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">25-Slot Shared Lobbies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assign up to 25 squad rosters per room with custom slot numbers, map selection, and participant line-ups.
              </p>
            </div>

            <div className="surface-panel p-5 rounded-lg border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Placement + Kill Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic points matrix recalculates rankings and multi-level tie-breakers immediately upon score entry.
              </p>
            </div>

            <div className="surface-panel p-5 rounded-lg border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Referee Dispute Arbitration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Captains can contest match results with screenshot proof; referees adjudicate disputes with immutable audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
