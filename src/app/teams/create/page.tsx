"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
    logoUrl: "",
    players: [
      { playerName: "", inGameId: "", role: "CAPTAIN" },
      { playerName: "", inGameId: "", role: "PLAYER" },
      { playerName: "", inGameId: "", role: "PLAYER" },
      { playerName: "", inGameId: "", role: "PLAYER" },
    ],
  });

  const handlePlayerChange = (index: number, field: string, value: string) => {
    const updated = [...formData.players];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, players: updated });
  };

  const addSubstitute = () => {
    if (formData.players.length < 5) {
      setFormData({
        ...formData,
        players: [...formData.players, { playerName: "", inGameId: "", role: "SUBSTITUTE" }],
      });
    }
  };

  const removePlayer = (index: number) => {
    if (formData.players.length > 4) {
      setFormData({
        ...formData,
        players: formData.players.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that all 4 starter players have IGN and InGameId
    for (let i = 0; i < 4; i++) {
      if (!formData.players[i].playerName.trim() || !formData.players[i].inGameId.trim()) {
        setError(`Starter player #${i + 1} requires both In-Game Name (IGN) and Character ID.`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register squad");

      router.push(`/teams/${data.team.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Register 4-Player Battle Royale Squad</h1>
          <p className="text-xs text-slate-400">
            Form your competitive squad with In-Game IDs for official lobby slotting.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Squad Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-amber-500">
            1. Squad Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Squad Name"
                required
                placeholder="e.g. GodLike Esports"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Squad Tag (2-6 chars)"
                required
                maxLength={6}
                placeholder="e.g. GODL"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Squad Bio & Achievements
            </label>
            <textarea
              rows={2}
              placeholder="Competitive history, roster achievements, scrim schedule..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#090c10] border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* 4-Player Roster Form */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-amber-500">
                2. Squad Roster (4 Starters required)
              </h3>
              <p className="text-xs text-slate-400">
                In-game credentials used by referees for in-lobby slot verification.
              </p>
            </div>
            {formData.players.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSubstitute}
                className="text-xs text-amber-400 hover:text-amber-300 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Substitute (5th)
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {formData.players.map((player, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#090c10] border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 inline-flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {idx === 0 ? "Captain (IGL)" : idx === 4 ? "Substitute" : `Squad Member #${idx + 1}`}
                  </span>
                  {idx >= 4 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(idx)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="In-Game Name (IGN, e.g. GodL-JONATHAN)"
                    required
                    value={player.playerName}
                    onChange={(e) => handlePlayerChange(idx, "playerName", e.target.value)}
                  />
                  <Input
                    placeholder="Character ID (e.g. 511223344)"
                    required
                    value={player.inGameId}
                    onChange={(e) => handlePlayerChange(idx, "inGameId", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button type="submit" variant="primary" size="lg" className="font-bold tracking-wide" isLoading={loading}>
            Register Competitive Squad
          </Button>
        </div>
      </form>
    </div>
  );
}
