import React from "react";
import Link from "next/link";
import { Trophy, Shield, Users, Swords, Zap, ArrowRight, Flame } from "lucide-react";
import { prisma } from "@/lib/db";
import { TournamentCard } from "@/components/tournament-card";
import { Button } from "@/components/ui/button";


export default async function HomePage() {
  const [featuredTournaments, games, totalTournaments, totalMatches, totalTeams] =
    await Promise.all([
      prisma.tournament.findMany({
        take: 3,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: {
          game: true,
          organizer: { select: { name: true, username: true } },
          _count: { select: { registrations: true } },
        },
      }),
      prisma.game.findMany({
        take: 4,
        include: { _count: { select: { tournaments: true } } },
      }),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.team.count(),
    ]);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-white/[0.08] bg-radial-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Season 2026 Competitive Circuit Is Now Live</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-mono max-w-4xl mx-auto leading-none mb-6">
            Compete. Dominate. <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">Ascend.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The next-generation competitive gaming platform. Discover high-stakes tournaments, manage verified team rosters, and compete with automated single-elimination brackets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/tournaments" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full gap-2">
                <Trophy className="w-5 h-5" /> Explore Tournaments
              </Button>
            </Link>
            <Link href="/tournaments/create" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full gap-2">
                Host an Event
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 pt-8 border-t border-white/[0.08]">
            <div className="p-4 rounded-xl bg-[#0f1420]/80 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {totalTournaments}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Active Tournaments
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0f1420]/80 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">
                {totalMatches}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Matches Recorded
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0f1420]/80 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
                {totalTeams}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Verified Rosters
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0f1420]/80 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                $19,000+
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
                Active Prize Pool
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" /> Premier Competitions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Featured Tournaments
            </h2>
          </div>
          <Link href="/tournaments">
            <Button variant="outline" size="sm" className="gap-2">
              View All Tournaments <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      {/* Competitive Titles Section */}
      <section className="py-16 bg-[#090c13] border-t border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Competitive Titles
            </h2>
            <p className="text-sm text-slate-400">
              Battle-tested tournament management supporting premier tactical shooters, MOBAs, and sports esports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/tournaments?game=${game.slug}`}
                className="group relative rounded-xl overflow-hidden bg-[#101522] border border-white/10 hover:border-indigo-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="text-xs font-mono uppercase text-indigo-400 font-semibold mb-1">
                    {game.genre}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {game.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-2">
                    Team Size: {game.teamSize}v{game.teamSize} • {game.platforms}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span>{game._count.tournaments} Events</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
