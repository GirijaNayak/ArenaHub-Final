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
  Plus,
  Settings,
  Crosshair,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LobbyRoomView, LobbyDetails } from "@/components/lobby-room-view";
import { BattleRoyaleStandings } from "@/components/battle-royale-standings";
import { ResultSubmissionModal } from "@/components/result-submission-modal";
import { DisputeModal } from "@/components/dispute-modal";
import { DisputeResolutionModal } from "@/components/dispute-resolution-modal";

interface TournamentDetailProps {
  params: Promise<{ slug: string }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailProps) {
  const { slug } = use(params);

  const [tournament, setTournament] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"lobbies" | "standings" | "squads" | "rules">("lobbies");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New lobby modal/form state
  const [showAddLobby, setShowAddLobby] = useState(false);
  const [lobbyTitle, setLobbyTitle] = useState("");
  const [lobbyMap, setLobbyMap] = useState<"Erangel" | "Miramar" | "Sanhok" | "Vikendi">("Erangel");
  const [lobbyScheduled, setLobbyScheduled] = useState("");
  const [lobbyReveal, setLobbyReveal] = useState("");
  const [creatingLobby, setCreatingLobby] = useState(false);

  // Modals state
  const [submissionModal, setSubmissionModal] = useState<{ isOpen: boolean; lobbyId: string; teamId: string }>({
    isOpen: false,
    lobbyId: "",
    teamId: "",
  });

  const [disputeModal, setDisputeModal] = useState<{
    isOpen: boolean;
    lobbyId: string;
    teamId: string;
    resultId?: string;
  }>({
    isOpen: false,
    lobbyId: "",
    teamId: "",
  });

  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    disputeId: string;
    teamTag: string;
    teamName: string;
    reason: string;
    description: string;
    evidenceUrl?: string | null;
  }>({
    isOpen: false,
    disputeId: "",
    teamTag: "",
    teamName: "",
    reason: "",
    description: "",
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [tourneyRes, authRes] = await Promise.all([
        fetch(`/api/tournaments/${slug}`),
        fetch("/api/auth/me"),
      ]);

      if (!tourneyRes.ok) {
        const errData = await tourneyRes.json().catch(() => ({}));
        if (tourneyRes.status === 404) {
          setTournament(null);
          setFetchError("Tournament not found");
        } else {
          setTournament(null);
          setFetchError(errData.error || "Failed to load tournament operations.");
        }
      } else {
        const data = await tourneyRes.json();
        setTournament(data.tournament || null);
      }

      if (authRes.ok) {
        const uData = await authRes.json().catch(() => ({}));
        setCurrentUser(uData.user || null);
        if (uData.user?.teamsLed && uData.user.teamsLed.length > 0) {
          setSelectedTeamId(uData.user.teamsLed[0]?.id || "");
        }
      }
    } catch {
      setTournament(null);
      setFetchError("Unable to connect to tournament operations. Please check your network connection.");
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
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
        <span className="text-xs text-slate-400 font-mono">Loading battle-royale operations...</span>
      </div>
    );
  }

  if (fetchError && !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white mb-2">Tournament Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{fetchError}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="sm" onClick={() => fetchData()}>
            Retry
          </Button>
          <Link href="/tournaments">
            <Button variant="ghost" size="sm">
              Browse Tournaments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white mb-2">Tournament Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          This tournament does not exist, has been removed, or is not yet published.
        </p>
        <Link href="/tournaments">
          <Button variant="primary" size="sm">Browse Tournaments</Button>
        </Link>
      </div>
    );
  }

  const registrations = tournament.registrations || [];
  const lobbies = tournament.lobbies || [];

  const isOrganizerOrAdmin = Boolean(
    currentUser &&
      (currentUser.id === tournament.organizerId ||
        currentUser.role === "PLATFORM_ADMIN" ||
        currentUser.role === "TOURNAMENT_ORGANIZER" ||
        currentUser.role === "REFEREE")
  );

  const isUserRegistered = Boolean(
    currentUser &&
      registrations.some(
        (r: any) =>
          r?.registeredById === currentUser.id ||
          (currentUser.teamsLed && currentUser.teamsLed.some((t: any) => t?.id === r?.teamId))
      )
  );

  const handleRegister = async () => {
    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!selectedTeamId) {
      setActionError("Please create a squad first before registering.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setRegistering(true);

    try {
      const res = await fetch(`/api/tournaments/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Squad registration failed");

      setActionSuccess("Your squad has been confirmed for this tournament!");
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setRegistering(false);
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

      setActionSuccess(`Tournament status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLobby(true);
    setActionError(null);

    try {
      const nextNum = (tournament.lobbies?.length || 0) + 1;
      const res = await fetch("/api/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          lobbyNumber: nextNum,
          title: lobbyTitle || `Match ${nextNum} - ${lobbyMap}`,
          mapName: lobbyMap,
          scheduledTime: new Date(lobbyScheduled).toISOString(),
          revealTime: new Date(lobbyReveal).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create match lobby");

      setShowAddLobby(false);
      setLobbyTitle("");
      setActionSuccess("Battle-Royale match lobby scheduled!");
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setCreatingLobby(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Tournament Banner & Hero */}
      <div className="relative w-full bg-[#0a0d14] border-b border-white/[0.08]">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src={
              tournament.bannerUrl ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
            }
            alt={tournament.title}
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 relative z-10 pb-6">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tournaments
          </Link>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-[#141b27] border border-white/10 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                  {tournament.game}
                </span>
                <Badge status={tournament.status} />
                <span className="text-slate-400 text-xs font-mono">
                  {tournament.teamSize}-Player Squads
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-mono mb-1.5">
                {tournament.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Hosted by <strong className="text-slate-200">{tournament.organization?.name || "Independent"}</strong></span>
              </div>
            </div>

            {/* Registration action */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
              {isUserRegistered ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase">
                  <CheckCircle className="w-3.5 h-3.5" /> Squad Registered & Confirmed
                </div>
              ) : tournament.status === "REGISTRATION_OPEN" ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {currentUser?.teamsLed && currentUser.teamsLed.length > 0 ? (
                    <>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="bg-[#141a27] border border-white/10 rounded px-2.5 py-2 text-xs text-white"
                      >
                        {currentUser.teamsLed.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            [{t.tag}] {t.name} ({(t.players || []).length} players)
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={registering}
                        onClick={handleRegister}
                      >
                        Register Squad
                      </Button>
                    </>
                  ) : (
                    <Link href="/teams/create">
                      <Button variant="primary" size="md">
                        Create Squad to Register
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded bg-slate-900 border border-white/10 text-xs text-slate-400 font-mono uppercase">
                  Registration {tournament.status.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ribbon Stats */}
      <div className="bg-[#0e131b] border-b border-white/[0.06] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-400">Prize Pool</div>
              <div className="text-xs font-bold text-white">
                {tournament.prizePool > 0 ? `₹${tournament.prizePool.toLocaleString()}` : "Glory & Points"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[10px] uppercase text-slate-400">Squad Slots</div>
              <div className="text-xs font-bold text-white">
                {registrations.length} / {tournament.teamCapacity || 20} Squads
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-400">Tournament Start</div>
              <div className="text-xs font-bold text-white">
                {new Date(tournament.tournamentStart).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-400">Registration Ends</div>
              <div className="text-xs font-bold text-white">
                {new Date(tournament.registrationEnd).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer / Referee Management Ribbon */}
      {isOrganizerOrAdmin && (
        <div className="bg-[#121926] border-b border-amber-500/20 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase">
              <Settings className="w-4 h-4" /> Organizer & Referee Console
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="xs"
                variant="amber-subtle"
                onClick={() => setShowAddLobby(!showAddLobby)}
                className="gap-1"
              >
                <Plus className="w-3 h-3" /> Schedule Match Lobby
              </Button>

              <select
                value={tournament.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="DRAFT">Status: Draft</option>
                <option value="REGISTRATION_OPEN">Status: Registration Open</option>
                <option value="REGISTRATION_CLOSED">Status: Registration Closed</option>
                <option value="LIVE">Status: Live / Matches In Progress</option>
                <option value="COMPLETED">Status: Completed</option>
                <option value="CANCELLED">Status: Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Add Lobby Form */}
      {showAddLobby && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <form onSubmit={handleAddLobby} className="p-4 surface-panel border border-amber-500/30 rounded-lg space-y-3">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Schedule Shared Battle-Royale Lobby
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                label="Lobby Title (Optional)"
                placeholder="e.g. Match 1 - Erangel"
                value={lobbyTitle}
                onChange={(e) => setLobbyTitle(e.target.value)}
              />
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1">
                  Map
                </label>
                <select
                  value={lobbyMap}
                  onChange={(e: any) => setLobbyMap(e.target.value)}
                  className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-white"
                >
                  <option value="Erangel">Erangel</option>
                  <option value="Miramar">Miramar</option>
                  <option value="Sanhok">Sanhok</option>
                  <option value="Vikendi">Vikendi</option>
                </select>
              </div>
              <Input
                label="Match Start (UTC)"
                type="datetime-local"
                required
                value={lobbyScheduled}
                onChange={(e) => setLobbyScheduled(e.target.value)}
              />
              <Input
                label="Room Reveal Time (UTC)"
                type="datetime-local"
                required
                value={lobbyReveal}
                onChange={(e) => setLobbyReveal(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddLobby(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs" isLoading={creatingLobby}>
                Schedule Lobby
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
        {actionSuccess && (
          <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded mb-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1">
        <div className="flex items-center gap-1 border-b border-white/10 mb-6 overflow-x-auto pb-1">
          {(["lobbies", "standings", "squads", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors ${
                activeTab === tab
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "lobbies" ? `Match Lobbies (${lobbies.length})` : tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Lobbies */}
        {activeTab === "lobbies" && (
          <div className="space-y-6">
            {lobbies.length > 0 ? (
              lobbies.map((lobby: LobbyDetails) => (
                <LobbyRoomView
                  key={lobby.id}
                  lobby={lobby}
                  currentUserId={currentUser?.id}
                  currentUserRole={currentUser?.role}
                  isOrganizerOrReferee={isOrganizerOrAdmin}
                  onRefresh={fetchData}
                  onSubmitResult={(lobbyId, teamId) =>
                    setSubmissionModal({ isOpen: true, lobbyId, teamId })
                  }
                  onVerifyResult={(resultId, placement, kills) => {
                    // Open referee verification
                    const notes = prompt("Enter verification note (or press OK to verify):", "Verified via match end screen");
                    if (notes !== null) {
                      fetch(`/api/lobbies/results/${resultId}/verify`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ placement, kills, status: "VERIFIED" }),
                      }).then(() => fetchData());
                    }
                  }}
                  onRaiseDispute={(lobbyId, teamId, resultId) =>
                    setDisputeModal({ isOpen: true, lobbyId, teamId, resultId })
                  }
                />
              ))
            ) : (
              <div className="surface-panel p-10 text-center rounded-lg">
                <Crosshair className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">No Match Lobbies Scheduled</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The tournament organizer will post match lobbies, scheduled start times, and room credentials shortly.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Standings */}
        {activeTab === "standings" && (
          <BattleRoyaleStandings standings={tournament.standings || []} />
        )}

        {/* Tab 3: Squads */}
        {activeTab === "squads" && (
          <div className="surface-panel p-5 rounded-lg border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Registered Battle-Royale Squads ({registrations.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Confirmed team rosters verified for this tournament.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {registrations.map((reg: any, idx: number) => (
                <div key={reg.id} className="p-3.5 bg-[#121824] border border-white/5 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      #{idx + 1}
                    </span>
                    <Badge variant="gold">Confirmed</Badge>
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    [{reg.team?.tag || "TEAM"}] {reg.team?.name || "Squad"}
                  </h4>
                  <div className="text-[11px] text-slate-400 mb-2">
                    Captain: <span className="text-slate-300 font-semibold">{reg.team?.captain?.username || "Unknown"}</span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                    <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                      Roster Lineup ({(reg.team?.players || []).length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(reg.team?.players || []).map((p: any) => (
                        <span
                          key={p.id}
                          className="bg-black/50 border border-white/5 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                        >
                          {p.playerName} ({p.inGameId})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Rules & Scoring Matrix */}
        {activeTab === "rules" && (
          <div className="surface-panel p-5 rounded-lg border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono mb-1">
                Official Battle-Royale Scoring Matrix
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Placement finishes are rewarded with descending placement points, combined with 1 point per confirmed frag.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                <div className="p-2 bg-[#121822] border border-white/5 rounded text-center">
                  <span className="text-amber-400 font-bold block">1st Place</span>
                  <span className="text-slate-300">15 Pts (WWCD)</span>
                </div>
                <div className="p-2 bg-[#121822] border border-white/5 rounded text-center">
                  <span className="text-slate-300 font-bold block">2nd Place</span>
                  <span className="text-slate-300">12 Pts</span>
                </div>
                <div className="p-2 bg-[#121822] border border-white/5 rounded text-center">
                  <span className="text-slate-300 font-bold block">3rd Place</span>
                  <span className="text-slate-300">10 Pts</span>
                </div>
                <div className="p-2 bg-[#121822] border border-white/5 rounded text-center">
                  <span className="text-slate-400 font-bold block">4th Place</span>
                  <span className="text-slate-300">8 Pts</span>
                </div>
                <div className="p-2 bg-[#121822] border border-white/5 rounded text-center">
                  <span className="text-slate-400 font-bold block">5th Place</span>
                  <span className="text-slate-300">6 Pts</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <h3 className="text-sm font-bold text-white font-mono mb-1">
                Rules & Code of Conduct
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {tournament.rules}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ResultSubmissionModal
        isOpen={submissionModal.isOpen}
        lobbyId={submissionModal.lobbyId}
        teamId={submissionModal.teamId}
        onClose={() => setSubmissionModal({ isOpen: false, lobbyId: "", teamId: "" })}
        onSuccess={() => {
          setActionSuccess("Result submitted for referee verification!");
          fetchData();
        }}
      />

      <DisputeModal
        isOpen={disputeModal.isOpen}
        tournamentId={tournament.id}
        lobbyId={disputeModal.lobbyId}
        teamId={disputeModal.teamId}
        resultId={disputeModal.resultId}
        onClose={() => setDisputeModal({ isOpen: false, lobbyId: "", teamId: "" })}
        onSuccess={() => {
          setActionSuccess("Dispute filed! Referees have been notified.");
          fetchData();
        }}
      />

      <DisputeResolutionModal
        isOpen={resolutionModal.isOpen}
        disputeId={resolutionModal.disputeId}
        teamTag={resolutionModal.teamTag}
        teamName={resolutionModal.teamName}
        reason={resolutionModal.reason}
        description={resolutionModal.description}
        evidenceUrl={resolutionModal.evidenceUrl}
        onClose={() =>
          setResolutionModal({
            isOpen: false,
            disputeId: "",
            teamTag: "",
            teamName: "",
            reason: "",
            description: "",
          })
        }
        onSuccess={() => {
          setActionSuccess("Official ruling recorded!");
          fetchData();
        }}
      />
    </div>
  );
}
