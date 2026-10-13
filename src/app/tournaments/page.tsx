import React from "react";
import Link from "next/link";
import { Trophy, Plus, Search, Filter } from "lucide-react";
import { prisma } from "@/lib/db";
import { TournamentCard } from "@/components/tournament-card";
import { Button } from "@/components/ui/button";

interface TournamentsPageProps {
  searchParams: Promise<{
    search?: string;
    game?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}


export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const gameSlug = params.game || "";
  const status = params.status || "";
  const page = parseInt(params.page || "1", 10);
  const limit = 9;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (gameSlug) {
    where.game = { slug: gameSlug };
  }
  if (status) {
    where.status = status;
  }

  const [total, tournaments, games] = await Promise.all([
    prisma.tournament.count({ where }),
    prisma.tournament.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
      include: {
        game: true,
        organizer: { select: { name: true, username: true } },
        _count: { select: { registrations: true } },
      },
    }),
    prisma.game.findMany({
      where: { active: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tournaments Discovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse competitive events, register with your squad, and battle for the prize pool.
          </p>
        </div>
        <Link href="/tournaments/create">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" /> Create Tournament
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl p-4 mb-8 space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search tournaments..."
              className="w-full bg-[#141b2a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              name="game"
              defaultValue={gameSlug}
              className="w-full bg-[#141b2a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Games</option>
              {games.map((g) => (
                <option key={g.id} value={g.slug}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status}
              className="w-full bg-[#141b2a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="UPCOMING">Upcoming</option>
            </select>

            <Button type="submit" variant="secondary" size="sm" className="px-4">
              Apply
            </Button>
          </div>
        </form>
      </div>

      {/* Tournament Cards Grid */}
      {tournaments.length === 0 ? (
        <div className="bg-[#0f1420] border border-white/10 rounded-2xl p-16 text-center">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Tournaments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Try adjusting your search criteria or create a brand new tournament event!
          </p>
          <Link href="/tournaments/create">
            <Button variant="primary" size="sm">
              Create a Competition
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/tournaments?page=${p}${search ? `&search=${search}` : ""}${
                gameSlug ? `&game=${gameSlug}` : ""
              }${status ? `&status=${status}` : ""}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
