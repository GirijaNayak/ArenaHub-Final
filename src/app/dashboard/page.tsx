"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Shield,
  KeyRound,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Gavel,
  Sliders,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (!data.user) {
          window.location.href = "/auth/login";
          return;
        }
        setProfile(data.user);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading esports dashboard...</span>
      </div>
    );
  }

  if (!profile) return null;

  const isStaff =
    profile.role === "PLATFORM_ADMIN" ||
    profile.role === "TOURNAMENT_ORGANIZER" ||
    profile.role === "REFEREE";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header Profile Bar */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#141b24] border-2 border-amber-500/40 flex items-center justify-center font-black text-2xl text-amber-400 font-mono shadow-md">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-white text-xl sm:text-2xl">{profile.name}</span>
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {profile.role}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                <span>@{profile.username}</span>
                {profile.inGameName && (
                  <>
                    <span>•</span>
                    <span>IGN: <strong className="text-slate-200">{profile.inGameName}</strong></span>
                  </>
                )}
                {profile.inGameId && (
                  <>
                    <span>•</span>
                    <span>Character ID: <strong className="text-amber-400">{profile.inGameId}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.role === "PLATFORM_ADMIN" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2 font-mono text-xs border-amber-500/40 text-amber-400">
                  <Sliders className="w-3.5 h-3.5" /> Admin Console
                </Button>
              </Link>
            )}
            {(profile.role === "REFEREE" || profile.role === "TOURNAMENT_ORGANIZER" || profile.role === "TEAM_CAPTAIN") && (
              <Link href="/disputes">
                <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                  <Gavel className="w-3.5 h-3.5 text-amber-500" /> Dispute Center
                </Button>
              </Link>
            )}
            {(profile.role === "TOURNAMENT_ORGANIZER" || profile.role === "PLATFORM_ADMIN") && (
              <Link href="/tournaments/create">
                <Button variant="primary" size="sm" className="gap-2 font-bold font-mono text-xs">
                  <Plus className="w-3.5 h-3.5" /> Host Tournament
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Org memberships */}
        {profile.orgMemberships && profile.orgMemberships.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-mono uppercase text-[10px] font-bold">
              Organization Tenants:
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.orgMemberships.map((m: any) => (
                <span
                  key={m.id}
                  className="px-2.5 py-0.5 rounded-lg bg-[#090c10] border border-white/10 text-slate-300 font-mono text-xs flex items-center gap-1.5"
                >
                  <Building className="w-3 h-3 text-amber-500" />
                  {m.organization.name} ({m.role})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Squads & Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Registered Tournaments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-500" /> Registered Battle Royale Tournaments
            </h3>
            <Link href="/tournaments">
              <Button variant="ghost" size="sm" className="text-xs text-amber-400">
                Browse Tournaments
              </Button>
            </Link>
          </div>

          {!profile.registrationsCreated || profile.registrationsCreated.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-[#0e131b] border border-white/10 rounded-2xl shadow-xl">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>You haven't registered any squads for upcoming tournaments.</p>
              <Link href="/tournaments" className="inline-block mt-4">
                <Button variant="primary" size="sm" className="font-bold">
                  Explore Active Circuits
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
              {profile.registrationsCreated.map((reg: any) => (
                <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tournaments/${reg.tournament.slug}`}
                        className="font-bold text-white text-sm hover:text-amber-400 transition-colors"
                      >
                        {reg.tournament.title}
                      </Link>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {reg.team?.tag}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      {reg.tournament.game} • {reg.tournament.organization?.name} • Starts{" "}
                      {new Date(reg.tournament.tournamentStart).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={reg.tournament.status} />
                    <Link href={`/tournaments/${reg.tournament.slug}`}>
                      <Button variant="secondary" size="sm" className="text-xs font-mono">
                        View Lobbies
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Squad Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Users className="w-4 h-4 text-amber-500" /> Your Squads
            </h3>
            <Link href="/teams/create">
              <Button variant="ghost" size="sm" className="text-xs text-amber-400">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Squad
              </Button>
            </Link>
          </div>

          {(!profile.teamsLed || profile.teamsLed.length === 0) &&
          (!profile.teamPlayerProfiles || profile.teamPlayerProfiles.length === 0) ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#0e131b] border border-white/10 rounded-2xl shadow-xl">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>You are not affiliated with any competitive squads.</p>
              <Link href="/teams/create" className="inline-block mt-3">
                <Button variant="primary" size="sm" className="font-bold">
                  Register a 4-Player Squad
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
              {profile.teamsLed?.map((team: any) => (
                <div key={team.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#141b24] border border-amber-500/30 flex items-center justify-center font-black text-xs text-amber-400 font-mono">
                      {team.tag}
                    </div>
                    <div>
                      <Link
                        href={`/teams/${team.id}`}
                        className="font-bold text-white text-sm hover:text-amber-400 transition-colors block"
                      >
                        {team.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {team.players.length} players • Captain (You)
                      </span>
                    </div>
                  </div>
                  <Link href={`/teams/${team.id}`}>
                    <ArrowRight className="w-4 h-4 text-slate-500 hover:text-amber-400" />
                  </Link>
                </div>
              ))}

              {profile.teamPlayerProfiles?.map((tp: any) => (
                <div key={tp.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#141b24] border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300 font-mono">
                      {tp.team.tag}
                    </div>
                    <div>
                      <Link
                        href={`/teams/${tp.team.id}`}
                        className="font-bold text-white text-sm hover:text-amber-400 transition-colors block"
                      >
                        {tp.team.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Role: {tp.role} • Captain: @{tp.team.captain?.username}
                      </span>
                    </div>
                  </div>
                  <Link href={`/teams/${tp.team.id}`}>
                    <ArrowRight className="w-4 h-4 text-slate-500 hover:text-amber-400" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
