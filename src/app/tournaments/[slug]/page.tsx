"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BracketView, BracketMatch } from "@/components/bracket-view";
import { MatchReportModal } from "@/components/match-report-modal";

interface TournamentDetailProps {
  params: Promise<{ slug: string }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailProps) {
  const { slug } = use(params);

  const [tournament, setTournament] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"bracket" | "standings" | "participants" | "rules">("bracket");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Match report modal state
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [tourneyRes, authRes] = await Promise.all([
        fetch(`/api/tournaments/${slug}`),
        fetch("/api/auth/me"),
      ]);

      if (tourneyRes.ok) {
        const data = await tourneyRes.json();
        setTournament(data.tournament);

        // Fetch standings
        fetch(`/api/tournaments/${slug}/standings`)
          .then((r) => r.json())
          .then((s) => setStandings(s.standings || []))
          .catch(() => {});
      }

      if (authRes.ok) {
        const uData = await authRes.json();
        setCurrentUser(uData.user || null);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading tournament data...</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Tournament Not Found</h2>
        <Link href="/tournaments">
          <Button variant="primary" size="sm">
            Browse All Tournaments
          </Button>
        </Link>
      </div>
    );
  }

  const isOrganizerOrAdmin =
    currentUser &&
    (currentUser.id === tournament.organizerId || currentUser.role === "ADMIN");

  const isUserRegistered =
    currentUser &&
    tournament.registrations.some(
      (r: any) =>
        r.userId === currentUser.id ||
        (currentUser.teamsLed &&
          currentUser.teamsLed.some((t: any) => t.id === r.teamId))
    );

  const handleRegister = async () => {
    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setRegistering(true);

    try {
      let teamId: string | undefined = undefined;
      if (tournament.type === "TEAM" && currentUser.teamsLed && currentUser.teamsLed.length > 0) {
        teamId = currentUser.teamsLed[0].id;
      }

      const res = await fetch(`/api/tournaments/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setActionSuccess("Successfully registered for this tournament!");
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleStartTournament = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/tournaments/${slug}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start tournament");

      setActionSuccess("Tournament started and bracket generated!");
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/tournaments/${slug}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setActionSuccess(`Status transitioned to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Tournament Banner & Hero */}
      <div className="relative w-full bg-[#0a0d15] border-b border-white/[0.08]">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={
              tournament.bannerUrl ||
              tournament.game.bannerUrl ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
            }
            alt={tournament.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d15] via-[#0a0d15]/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 relative z-10 pb-8">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tournaments
          </Link>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                  {tournament.game.title}
                </span>
                <Badge status={tournament.status} />
                <span className="bg-slate-900 border border-white/10 text-slate-300 text-xs font-mono uppercase px-2.5 py-1 rounded-md">
                  {tournament.type} Tournament
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono mb-2">
                {tournament.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Organized by <strong className="text-slate-200">{tournament.organizer.username}</strong></span>
                <span>•</span>
                <span>Single Elimination Format</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {isUserRegistered ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Registered & Confirmed
                </div>
              ) : tournament.status === "REGISTRATION_OPEN" ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  isLoading={registering}
                  onClick={handleRegister}
                >
                  Register Now
                </Button>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-400 font-mono uppercase">
                  Registration {tournament.status.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Ribbon */}
      <div className="bg-[#0f1422] border-b border-white/[0.08] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Prize Pool</div>
              <div className="text-sm font-bold text-white font-mono">
                {tournament.prizePool > 0 ? `$${tournament.prizePool.toLocaleString()}` : "Glory / Points"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Slots Filled</div>
              <div className="text-sm font-bold text-white font-mono">
                {tournament.registrations.length} / {tournament.maxParticipants}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Start Date</div>
              <div className="text-sm font-bold text-white font-mono">
                {new Date(tournament.startDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Deadline</div>
              <div className="text-sm font-bold text-white font-mono">
                {new Date(tournament.registrationDeadline).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer / Admin Management Bar */}
      {isOrganizerOrAdmin && (
        <div className="bg-[#12192a] border-b border-indigo-500/30 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase font-mono">
              <Settings className="w-4 h-4" /> Organizer Control Console
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(tournament.status === "REGISTRATION_OPEN" || tournament.status === "REGISTRATION_CLOSED") && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleStartTournament}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start & Generate Bracket
                </Button>
              )}

              <select
                value={tournament.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-slate-900 border border-white/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="REGISTRATION_OPEN">Status: Registration Open</option>
                <option value="REGISTRATION_CLOSED">Status: Registration Closed</option>
                <option value="ONGOING">Status: Ongoing</option>
                <option value="COMPLETED">Status: Completed</option>
                <option value="CANCELLED">Status: Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
        {actionSuccess && (
          <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Main Tabbed Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-1">
          {(["bracket", "standings", "participants", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors capitalize ${
                activeTab === tab
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Bracket */}
        {activeTab === "bracket" && (
          <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white">Single Elimination Bracket</h3>
              <p className="text-xs text-slate-400">
                Live match tree. Matches advance automatically upon official score reporting.
              </p>
            </div>

            <BracketView
              matches={tournament.matches || []}
              canReportResult={Boolean(isOrganizerOrAdmin || currentUser)}
              onReportMatch={(m) => {
                setSelectedMatch(m);
                setIsReportModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Standings */}
        {activeTab === "standings" && (
          <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Official Tournament Standings</h3>
            <p className="text-xs text-slate-400 mb-6">
              Derived from finalized and verified match results.
            </p>

            {standings.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Standings will be updated as matches conclude.
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
                {standings.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-[#121824] hover:bg-[#161e2d] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          s.rank === 1
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : s.rank === 2
                            ? "bg-slate-300/20 text-slate-300 border border-slate-300/40"
                            : "bg-indigo-900/40 text-indigo-300"
                        }`}
                      >
                        #{s.rank}
                      </span>
                      <span className="font-semibold text-white text-sm">{s.name}</span>
                    </div>
                    <Badge variant={s.rank === 1 ? "warning" : "default"}>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Participants */}
        {activeTab === "participants" && (
          <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Registered Participants</h3>
                <p className="text-xs text-slate-400">
                  {tournament.registrations.length} competitors locked in.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tournament.registrations.map((r: any, idx: number) => {
                const name = r.team ? `[${r.team.tag}] ${r.team.name}` : r.user?.username || "Player";
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-[#121824] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500 font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200 text-xs sm:text-sm">{name}</div>
                        <div className="text-[10px] text-slate-500">
                          Joined {new Date(r.registeredAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="success">Confirmed</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Rules */}
        {activeTab === "rules" && (
          <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Rules & Code of Conduct</h3>
            <div className="prose prose-invert text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {tournament.rulesText}
            </div>
          </div>
        )}
      </div>

      {/* Match Reporting Modal */}
      <MatchReportModal
        match={selectedMatch}
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedMatch(null);
        }}
        onSuccess={() => {
          setActionSuccess("Score reported! Bracket updated.");
          fetchData();
        }}
      />
    </div>
  );
}
