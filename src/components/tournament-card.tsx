import React from "react";
import Link from "next/link";
import { Users, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface TournamentCardProps {
  tournament: {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: string;
    type: string;
    prizePool: number;
    maxParticipants: number;
    startDate: string | Date;
    bannerUrl?: string | null;
    game: {
      title: string;
      slug: string;
      bannerUrl?: string | null;
    };
    organizer: {
      name: string;
      username: string;
    };
    _count?: {
      registrations: number;
    };
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const registeredCount = tournament._count?.registrations || 0;
  const progressPercent = Math.min(
    100,
    Math.round((registeredCount / tournament.maxParticipants) * 100)
  );

  const formattedDate = new Date(tournament.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative bg-[#0f1420] border border-white/[0.08] hover:border-indigo-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between">
      <div>
        {/* Banner with gradient overlay */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-900">
          <img
            src={
              tournament.bannerUrl ||
              tournament.game.bannerUrl ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
            }
            alt={tournament.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1420] via-[#0f1420]/50 to-transparent" />

          {/* Top Status & Game Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="bg-black/70 backdrop-blur-md text-[11px] font-bold text-slate-200 px-2.5 py-1 rounded-md border border-white/10 uppercase tracking-wider">
              {tournament.game.title}
            </span>
            <Badge status={tournament.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>Hosted by <span className="text-slate-300 font-semibold">{tournament.organizer.username}</span></span>
            <span>•</span>
            <span className="uppercase text-[10px] tracking-wider font-mono text-indigo-400 font-bold">
              {tournament.type}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
            <Link href={`/tournaments/${tournament.slug}`}>
              {tournament.title}
            </Link>
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {tournament.description}
          </p>

          {/* Slots capacity bar */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Slots
              </span>
              <span className="font-mono text-slate-300 font-medium">
                {registeredCount} / {tournament.maxParticipants}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="p-5 pt-0 border-t border-white/[0.04] mt-auto">
        <div className="flex items-center justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Prize Pool
            </span>
            <span className="text-sm font-extrabold text-amber-400 font-mono">
              {tournament.prizePool > 0 ? `$${tournament.prizePool.toLocaleString()}` : "Glory & Points"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <Link href={`/tournaments/${tournament.slug}`} className="block mt-4">
          <Button variant="secondary" size="sm" className="w-full group/btn justify-between">
            <span>View Tournament</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
