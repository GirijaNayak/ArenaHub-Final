import React from "react";
import Link from "next/link";
import { Users, Calendar, Trophy, ArrowRight, Shield } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface TournamentCardProps {
  tournament: {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: string;
    game: string;
    prizePool: number;
    teamCapacity: number;
    teamSize: number;
    tournamentStart: string | Date;
    bannerUrl?: string | null;
    organization: {
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
    _count?: {
      registrations: number;
      lobbies?: number;
    };
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const registeredCount = tournament._count?.registrations || 0;
  const progressPercent = Math.min(
    100,
    Math.round((registeredCount / tournament.teamCapacity) * 100)
  );

  const formattedDate = new Date(tournament.tournamentStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="surface-panel surface-hover rounded-lg overflow-hidden transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Banner with clean gradient overlay */}
        <div className="relative h-36 w-full overflow-hidden bg-[#121822]">
          <img
            src={
              tournament.bannerUrl ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
            }
            alt={tournament.title}
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e131b] via-[#0e131b]/60 to-transparent" />

          {/* Top Status & Game Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="bg-black/80 backdrop-blur-sm text-[11px] font-mono font-semibold text-slate-200 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
              {tournament.game}
            </span>
            <Badge status={tournament.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-300 truncate">
              {tournament.organization?.name || "Independent"}
            </span>
            <span>•</span>
            <span className="font-mono text-[10px] uppercase text-slate-400">
              {tournament.teamSize}-Player Squads
            </span>
          </div>

          <h3 className="text-base font-bold text-white line-clamp-1 mb-1.5">
            <Link href={`/tournaments/${tournament.slug}`} className="hover:text-amber-400 transition-colors">
              {tournament.title}
            </Link>
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {tournament.description}
          </p>

          {/* Slots capacity bar */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Users className="w-3 h-3 text-slate-500" />
                Squad Slots
              </span>
              <span className="font-mono text-xs text-slate-300 font-medium">
                {registeredCount} / {tournament.teamCapacity}
              </span>
            </div>
            <div className="w-full h-1 bg-[#192231] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="p-4 pt-0 border-t border-white/[0.04] mt-auto">
        <div className="flex items-center justify-between pt-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Prize Pool
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {tournament.prizePool > 0 ? `₹${tournament.prizePool.toLocaleString()}` : "Glory & Points"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <Link href={`/tournaments/${tournament.slug}`} className="block mt-3">
          <Button variant="secondary" size="sm" className="w-full justify-between">
            <span>View Tournament & Lobbies</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
