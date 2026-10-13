"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Users, Shield, UserPlus, ArrowLeft, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [team, setTeam] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
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
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading team roster...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Team Not Found</h2>
        <Link href="/teams">
          <Button variant="primary" size="sm">Browse All Teams</Button>
        </Link>
      </div>
    );
  }

  const isCaptain = currentUser && currentUser.id === team.captainId;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setInviting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: inviteInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      setMessage({ text: `Invitation sent to ${inviteInput}!`, type: "success" });
      setInviteInput("");
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
      </Link>

      {/* Team Header Card */}
      <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center font-black text-2xl text-indigo-400 font-mono">
              {team.tag}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded">
                  {team.game.title}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {team.members.length} Members
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{team.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Captain: <strong className="text-slate-200">{team.captain.username}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCaptain && (
              <span className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                You are the Captain
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
          className={`mb-6 flex items-center gap-2 p-3 text-xs rounded-lg border ${
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Active Roster
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {team.members.length} Players
            </span>
          </div>

          <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl divide-y divide-white/5 overflow-hidden">
            {team.members.map((m: any) => (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
                    {m.user.username.slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm block">
                      {m.user.username}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Badge variant={m.role === "CAPTAIN" ? "purple" : "default"}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>

          {/* Tournament Participation History */}
          <div className="pt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Tournament History
            </h3>
            {team.tournamentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#0f1420] border border-white/[0.08] rounded-xl">
                This team has not yet competed in tournaments.
              </div>
            ) : (
              <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl divide-y divide-white/5 overflow-hidden">
                {team.tournamentRegistrations.map((tr: any) => (
                  <div key={tr.id} className="p-4 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/tournaments/${tr.tournament.slug}`}
                        className="font-semibold text-white text-sm hover:text-indigo-400 transition-colors"
                      >
                        {tr.tournament.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tr.tournament.game.title} • {new Date(tr.tournament.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge status={tr.tournament.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Captain Invite Controls */}
        <div>
          {isCaptain ? (
            <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Invite Player
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Recruit new talent by searching their username or registered email.
              </p>

              <form onSubmit={handleInvite} className="space-y-3">
                <Input
                  placeholder="Username or email address..."
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={inviting}
                >
                  Send Invitation
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl p-6 text-center text-xs text-slate-400">
              Only the team captain can issue invitations and manage the roster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
