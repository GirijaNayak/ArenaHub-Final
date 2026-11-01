"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  Copy,
  Check,
  Clock,
  MapPin,
  Users,
  Shield,
  Plus,
  AlertTriangle,
  Award,
  CheckCircle,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface LobbyTeamData {
  id: string;
  slotNumber: number;
  team: {
    id: string;
    name: string;
    tag: string;
    logoUrl?: string | null;
    captain: { id: string; username: string };
    players: Array<{ id: string; playerName: string; inGameId: string; role: string }>;
  };
}

export interface LobbyResultData {
  id: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  status: string;
  team: { id: string; name: string; tag: string };
}

export interface LobbyDetails {
  id: string;
  tournamentId: string;
  lobbyNumber: number;
  title: string;
  mapName: string;
  scheduledTime: string | Date;
  revealTime: string | Date;
  roomId?: string | null;
  roomPassword?: string | null;
  status: string;
  canAccessCredentials?: boolean;
  credentialLockReason?: string;
  teams: LobbyTeamData[];
  results: LobbyResultData[];
}

interface LobbyRoomViewProps {
  lobby: LobbyDetails;
  currentUserId?: string;
  currentUserRole?: string;
  isOrganizerOrReferee?: boolean;
  onRefresh: () => void;
  onSubmitResult: (lobbyId: string, teamId: string) => void;
  onVerifyResult: (resultId: string, placement: number, kills: number) => void;
  onRaiseDispute: (lobbyId: string, teamId: string, resultId?: string) => void;
}

export function LobbyRoomView({
  lobby,
  currentUserId,
  currentUserRole,
  isOrganizerOrReferee,
  onRefresh,
  onSubmitResult,
  onVerifyResult,
  onRaiseDispute,
}: LobbyRoomViewProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [activeTab, setActiveTab] = useState<"slots" | "results">("slots");

  // Credential update state for organizer
  const [editingCreds, setEditingCreds] = useState(false);
  const [newRoomId, setNewRoomId] = useState(lobby.roomId || "");
  const [newPassword, setNewPassword] = useState(lobby.roomPassword || "");
  const [savingCreds, setSavingCreds] = useState(false);

  const copyToClipboard = (text: string, isPass: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPass) {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreds(true);
    try {
      const res = await fetch(`/api/lobbies/${lobby.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: newRoomId,
          roomPassword: newPassword,
          status: newRoomId ? "ROOM_POSTED" : undefined,
        }),
      });
      if (res.ok) {
        setEditingCreds(false);
        onRefresh();
      }
    } catch {
      // Ignore
    } finally {
      setSavingCreds(false);
    }
  };

  // Find user's assigned team if any
  const userTeam = lobby.teams.find(
    (lt) =>
      lt.team.captain.id === currentUserId ||
      lt.team.players.some((p) => p.playerName.toLowerCase() === currentUserId?.toLowerCase())
  );

  return (
    <div className="surface-panel rounded-lg overflow-hidden border border-white/[0.08]">
      {/* Lobby Header */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#121824] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
              Match #{lobby.lobbyNumber}
            </span>
            <Badge status={lobby.status} />
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              {lobby.mapName}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{lobby.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Start: {new Date(lobby.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span>•</span>
            <span>
              Reveal: {new Date(lobby.revealTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Organizer quick actions */}
        {isOrganizerOrReferee && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCreds(!editingCreds)}
              className="text-xs"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-400" />
              {editingCreds ? "Close Editor" : "Post Room ID & Password"}
            </Button>
          </div>
        )}
      </div>

      {/* Organizer Room Credential Editor Modal/Bar */}
      {editingCreds && (
        <form onSubmit={handleSaveCredentials} className="p-4 bg-[#162030] border-b border-amber-500/20">
          <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" /> Official Room Management
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input
              label="Room ID"
              placeholder="e.g. 7482910"
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              required
            />
            <Input
              label="Room Password"
              placeholder="e.g. bgmi99"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCreds(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingCreds}>
              Save & Broadcast Credentials
            </Button>
          </div>
        </form>
      )}

      {/* Room Credential Security Box */}
      <div className="p-4 sm:p-5 bg-[#0a0d14] border-b border-white/[0.06]">
        {lobby.canAccessCredentials && lobby.roomId ? (
          <div className="p-4 rounded-md bg-[#131d2a] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Room Credentials Unlocked
              </div>
              <p className="text-xs text-slate-400">
                Authorized for assigned squads and match officials. Join your assigned slot inside the game room.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0a0d14] border border-white/10 rounded px-3 py-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">ID:</span>
                <span className="font-mono font-bold text-sm text-white">{lobby.roomId}</span>
                <button
                  onClick={() => copyToClipboard(lobby.roomId!, false)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Copy Room ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[#0a0d14] border border-white/10 rounded px-3 py-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Pass:</span>
                <span className="font-mono font-bold text-sm text-amber-400">{lobby.roomPassword || "None"}</span>
                {lobby.roomPassword && (
                  <button
                    onClick={() => copyToClipboard(lobby.roomPassword!, true)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Password"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-md bg-[#0f141f] border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
                <Lock className="w-4 h-4 text-amber-500/80" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                  Private Room Credentials Protected
                </span>
                <span className="text-xs text-slate-400">
                  {lobby.credentialLockReason || "Credentials unlocked only for assigned squads at reveal time."}
                </span>
              </div>
            </div>
            <Badge variant="warning">Time-Restricted</Badge>
          </div>
        )}
      </div>

      {/* Tabs: Slots vs Results */}
      <div className="flex items-center border-b border-white/[0.06] bg-[#0c1017] px-4">
        <button
          onClick={() => setActiveTab("slots")}
          className={`py-3 px-4 text-xs font-mono uppercase font-bold tracking-wider border-b-2 transition-colors ${
            activeTab === "slots"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Room Slots ({lobby.teams.length}/25)
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`py-3 px-4 text-xs font-mono uppercase font-bold tracking-wider border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Match Results ({lobby.results.length})
        </button>
      </div>

      {/* Tab Content: Assigned Slots 1 to 25 */}
      {activeTab === "slots" && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lobby.teams.map((slot) => {
              const isMyTeam = slot.team.captain.id === currentUserId;
              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-md border text-xs transition-colors ${
                    isMyTeam
                      ? "bg-amber-500/[0.06] border-amber-500/40"
                      : "bg-[#101622] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      SLOT #{slot.slotNumber}
                    </span>
                    {isMyTeam && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                        Your Squad
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-white text-sm truncate mb-1">
                    [{slot.team.tag}] {slot.team.name}
                  </div>

                  <div className="text-[11px] text-slate-400 mb-2">
                    Captain: <span className="text-slate-200 font-semibold">{slot.team.captain.username}</span>
                  </div>

                  {/* Roster lineup */}
                  <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                    <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                      Squad Lineup ({slot.team.players.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {slot.team.players.map((p) => (
                        <span
                          key={p.id}
                          className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                          title={`Character ID: ${p.inGameId}`}
                        >
                          {p.playerName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {lobby.teams.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No squads assigned to this room yet.
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Match Results */}
      {activeTab === "results" && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-slate-400">
              Battle-royale placement and kills recorded for {lobby.title}.
            </div>

            {/* If user is captain of an assigned squad, can submit score */}
            {userTeam && (
              <Button
                variant="amber-subtle"
                size="sm"
                onClick={() => onSubmitResult(lobby.id, userTeam.team.id)}
              >
                Submit Squad Result
              </Button>
            )}
          </div>

          {lobby.results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Results have not yet been posted for this match.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#141b26] text-slate-400 font-mono text-[10px] uppercase">
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Squad</th>
                    <th className="p-2.5 text-center">Placement</th>
                    <th className="p-2.5 text-center">Kills</th>
                    <th className="p-2.5 text-center">Total Pts</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {lobby.results.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-white">
                        [{r.team.tag}] {r.team.name}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-300">
                        #{r.placement}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-300">{r.kills}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-400">
                        {r.totalPoints}
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge status={r.status} />
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOrganizerOrReferee && r.status !== "VERIFIED" && (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => onVerifyResult(r.id, r.placement, r.kills)}
                            >
                              Verify
                            </Button>
                          )}
                          {/* Captain can dispute result */}
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => onRaiseDispute(lobby.id, r.team.id, r.id)}
                          >
                            Dispute
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
