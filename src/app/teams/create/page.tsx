"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateTeamPage() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    gameId: "",
    description: "",
    logoUrl: "",
  });

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        if (data.games && data.games.length > 0) {
          setGames(data.games);
          setFormData((prev) => ({ ...prev, gameId: data.games[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");

      router.push(`/teams/${data.team.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 w-full flex-1">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Create Esports Team</h1>
          <p className="text-xs text-slate-400">
            Form a team roster, invite teammates, and register for team events.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-[#0f1420] border border-white/10 rounded-2xl p-6 sm:p-8">
        <Input
          label="Team Name"
          required
          placeholder="e.g. Sentinels Prime"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tag (2-6 Chars)"
            required
            maxLength={6}
            placeholder="e.g. SEN"
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Primary Game
            </label>
            <select
              value={formData.gameId}
              onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
              className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Team Biography & Playstyle
          </label>
          <textarea
            rows={3}
            placeholder="Team history, goals, schedule..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#141a27] border border-white/10 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            Create Team Roster
          </Button>
        </div>
      </form>
    </div>
  );
}
