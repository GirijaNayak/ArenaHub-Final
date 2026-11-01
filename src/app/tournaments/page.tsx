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
    page?: string;
  }>;
}

export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const game = params.game || "";
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
  if (game) {
    where.game = game;
  }
  if (status) {
    where.status = status;
  }

  const [total, tournaments] = await Promise.all([
    prisma.tournament.count({ where }),
    prisma.tournament.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { tournamentStart: "asc" }],
      include: {
        organization: { select: { name: true, slug: true, logoUrl: true } },
        _count: { select: { registrations: true, lobbies: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            Battle-Royale Tournaments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover competitive events, register your 4-player squad, and battle for the prize pool.
          </p>
        </div>
        <Link href="/tournaments/create">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Host Tournament
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="surface-panel rounded-lg p-3.5 mb-6">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search tournaments by name or description..."
              className="w-full bg-[#141b28] border border-white/10 rounded px-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              name="game"
              defaultValue={game}
              className="w-full bg-[#141b28] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Games</option>
              <option value="BGMI">BGMI</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Apex Legends">Apex Legends</option>
              <option value="FreeFire">Free Fire</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status}
              className="w-full bg-[#141b28] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="LIVE">Live / In-Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
            </select>

            <Button type="submit" variant="secondary" size="xs" className="px-3">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Tournament Cards Grid */}
      {tournaments.length === 0 ? (
        <div className="surface-panel rounded-lg p-12 text-center">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-1">No Tournaments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or create a tournament for your esports organization!
          </p>
          <Link href="/tournaments/create">
            <Button variant="primary" size="sm">
              Host a Competition
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/tournaments?page=${p}${search ? `&search=${search}` : ""}${
                game ? `&game=${game}` : ""
              }${status ? `&status=${status}` : ""}`}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                p === page
                  ? "bg-amber-500 text-black"
                  : "bg-[#141a26] text-slate-300 hover:bg-[#1a2232]"
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
