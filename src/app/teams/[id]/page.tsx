"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Users, Shield, UserPlus, ArrowLeft, CheckCircle, AlertCircle, Trophy, Trash2, Crosshair, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [team, setTeam] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newInGameId, setNewInGameId] = useState("");
  const [newRole, setNewRole] = useState("PLAYER");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchData = async () => {
    try {
      const [teamRes, authRes] = await Promise.all([
        fetch(`/api/teams/${id}`),
        fetch("/api/auth/me"),
      ]);

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeam(data.team);
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
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading squad profile...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Squad Not Found</h2>
        <Link href="/teams">
          <Button variant="primary" size="sm">Browse Squads</Button>
        </Link>
      </div>
    );
  }

  const isCaptain = currentUser && currentUser.id === team.captainId;

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newInGameId.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: newPlayerName.trim(),
          inGameId: newInGameId.trim(),
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add player to squad");

      setMessage({ text: `Player ${newPlayerName} added to roster!`, type: "success" });
      setNewPlayerName("");
      setNewInGameId("");
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePlayer = async (playerId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the squad?`)) return;

    try {
      const res = await fetch(`/api/teams/${id}/players?playerId=${playerId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove player");

      setMessage({ text: `${name} removed from roster.`, type: "success" });
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Squads
      </Link>

      {/* Team Header Card */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#141b24] border-2 border-amber-500/40 flex items-center justify-center font-black text-2xl text-amber-400 font-mono shadow-lg">
              {team.tag}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Battle Royale Squad
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {team.players.length} / 5 Players
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{team.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Squad Captain: <strong className="text-slate-200">{team.captain.name} ({team.captain.username})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCaptain && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
                👑 You are Squad Captain
              </span>
            )}
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-slate-300 mt-6 leading-relaxed max-w-2xl border-t border-white/5 pt-4">
            {team.description}
          </p>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roster List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <Users className="w-4 h-4 text-amber-500" /> Official Squad Roster
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {team.players.length} Registered
              </span>
            </div>

            <div className="bg-[#0e131b] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
              {team.players.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#141b24] border border-white/10 flex items-center justify-center font-bold text-xs text-amber-400 font-mono uppercase">
                      {p.playerName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {p.playerName}
                        </span>
                        {p.role === "CAPTAIN" && (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            CAPTAIN
                          </span>
                        )}
                        {p.role === "SUBSTITUTE" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            SUB
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        Character ID: <span className="text-slate-300 font-bold">{p.inGameId}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCaptain && p.role !== "CAPTAIN" && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id, p.playerName)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournament Participation History */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-500" /> Tournament Registrations
            </h3>
            {team.tournamentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#0e131b] border border-white/10 rounded-2xl">
                This squad has not yet registered for any tournaments.
              </div>
            ) : (
              <div className="bg-[#0e131b] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
                {team.tournamentRegistrations.map((tr: any) => (
                  <div key={tr.id} className="p-4 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/tournaments/${tr.tournament.slug}`}
                        className="font-bold text-white text-sm hover:text-amber-400 transition-colors"
                      >
                        {tr.tournament.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {tr.tournament.game} • Status: {tr.status}
                      </div>
                    </div>
                    <Badge status={tr.tournament.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Captain Roster Management */}
        <div>
          {isCaptain ? (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 text-amber-500">
                <UserPlus className="w-4 h-4" /> Add Squad Member
              </h3>
              <p className="text-xs text-slate-400">
                Add up to 5 squad players (4 active starters + 1 substitute) with verified character IDs.
              </p>

              {team.players.length >= 5 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono text-center">
                  Roster maximum capacity reached (5 players). Remove a player to add a replacement.
                </div>
              ) : (
                <form onSubmit={handleAddPlayer} className="space-y-3">
                  <Input
                    label="In-Game Name (IGN)"
                    placeholder="e.g. GodL-Neyoo"
                    required
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                  <Input
                    label="Character ID"
                    placeholder="e.g. 511223348"
                    required
                    value={newInGameId}
                    onChange={(e) => setNewInGameId(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                      Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-[#090c10] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="PLAYER">Active Player</option>
                      <option value="SUBSTITUTE">Substitute</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full font-bold"
                    isLoading={submitting}
                  >
                    Add to Squad
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-xl">
              <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Only the team captain (<span className="text-white font-bold">{team.captain.username}</span>) can modify the active roster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
