"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GameOption {
  id: string;
  title: string;
  slug: string;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    gameId: "",
    type: "SOLO",
    format: "SINGLE_ELIMINATION",
    maxParticipants: 8,
    registrationDeadline: "",
    startDate: "",
    rulesText: "Standard tournament draft. Anti-cheat required. Respect match officials.",
    prizePool: 0,
    bannerUrl: "",
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
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxParticipants: Number(formData.maxParticipants),
          prizePool: Number(formData.prizePool),
          registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
          startDate: new Date(formData.startDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create tournament");
      }

      router.push(`/tournaments/${data.tournament.slug}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Tournaments
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Create New Tournament</h1>
          <p className="text-xs text-slate-400">
            Configure rules, format, seeding parameters, and eligibility.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#0f1420] border border-white/10 rounded-2xl p-6 sm:p-8">
        <Input
          label="Tournament Title"
          required
          placeholder="e.g. VALORANT Winter Masters Invitational"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            required
            rows={3}
            placeholder="Outline competition overview, tier eligibility, and broadcast details..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#141a27] border border-white/10 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Esports Game Title
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Registration Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="SOLO">Solo (Individual Competitors)</option>
              <option value="TEAM">Team (Rosters Registered by Captains)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Bracket Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="SINGLE_ELIMINATION">Single Elimination Knockout</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Max Bracket Slots
            </label>
            <select
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="4">4 Competitors (Semifinals + Final)</option>
              <option value="8">8 Competitors (Quarterfinals to Final)</option>
              <option value="16">16 Competitors (Round of 16 to Final)</option>
              <option value="32">32 Competitors</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Registration Deadline"
            type="datetime-local"
            required
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
          />

          <Input
            label="Tournament Start Date"
            type="datetime-local"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Prize Pool ($ USD)"
            type="number"
            min="0"
            value={formData.prizePool}
            onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
          />

          <Input
            label="Banner Artwork URL (Optional)"
            placeholder="https://..."
            value={formData.bannerUrl}
            onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Official Rules & Regulations
          </label>
          <textarea
            required
            rows={4}
            value={formData.rulesText}
            onChange={(e) => setFormData({ ...formData, rulesText: e.target.value })}
            className="w-full bg-[#141a27] border border-white/10 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            Publish Tournament
          </Button>
        </div>
      </form>
    </div>
  );
}
