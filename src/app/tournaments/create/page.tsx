"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft, AlertCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    organizationId: "",
    title: "",
    description: "",
    game: "BGMI",
    rules: "Standard Battle-Royale competitive ruleset. Emulators strictly prohibited. Room ID & password will be revealed 15 minutes before match start. Captains must submit end-game screenshot proof for score disputes.",
    teamCapacity: 20,
    teamSize: 4,
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    prizePool: 10000,
    bannerUrl: "",
  });

  useEffect(() => {
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations && data.organizations.length > 0) {
          setOrganizations(data.organizations);
          setFormData((prev) => ({ ...prev, organizationId: data.organizations[0].id }));
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
          teamCapacity: Number(formData.teamCapacity),
          teamSize: Number(formData.teamSize),
          prizePool: Number(formData.prizePool),
          registrationStart: new Date(formData.registrationStart).toISOString(),
          registrationEnd: new Date(formData.registrationEnd).toISOString(),
          tournamentStart: new Date(formData.tournamentStart).toISOString(),
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-5 transition-colors font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Tournaments
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono">
            Create Battle-Royale Tournament
          </h1>
          <p className="text-xs text-slate-400">
            Set up shared match lobbies, squad capacity, rules, and scoring parameters.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 surface-panel p-5 sm:p-7 rounded-lg">
        {/* Organization selection */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Hosting Organization (Tenant)
          </label>
          {organizations.length === 0 ? (
            <div className="p-3 bg-[#141b27] border border-white/10 rounded text-xs text-amber-300">
              No organization found. Please register or join an organization first.
            </div>
          ) : (
            <select
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          )}
        </div>

        <Input
          label="Tournament Title"
          required
          placeholder="e.g. BGMI Pro Scrims Series — Season 1"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <div>
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description & Circuit Overview
          </label>
          <textarea
            required
            rows={2}
            placeholder="Official tournament circuit details, streaming broadcasts, and squad requirements..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Battle-Royale Title
            </label>
            <select
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="BGMI">BGMI (Battlegrounds Mobile India)</option>
              <option value="PUBG Mobile">PUBG Mobile</option>
              <option value="Apex Legends">Apex Legends</option>
              <option value="FreeFire">Free Fire MAX</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Squad Capacity (Max Teams)
            </label>
            <select
              value={formData.teamCapacity}
              onChange={(e) => setFormData({ ...formData, teamCapacity: parseInt(e.target.value) })}
              className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="16">16 Squads (1 Lobby)</option>
              <option value="20">20 Squads (1 Lobby)</option>
              <option value="25">25 Squads (1 Full Room)</option>
              <option value="50">50 Squads (Multi-Group)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Squad Size (Players)
            </label>
            <select
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) })}
              className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="4">4 Players (Standard Squad)</option>
              <option value="2">2 Players (Duo)</option>
              <option value="1">1 Player (Solo)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Registration Opens"
            type="datetime-local"
            required
            value={formData.registrationStart}
            onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
          />

          <Input
            label="Registration Closes"
            type="datetime-local"
            required
            value={formData.registrationEnd}
            onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
          />

          <Input
            label="Tournament Start"
            type="datetime-local"
            required
            value={formData.tournamentStart}
            onChange={(e) => setFormData({ ...formData, tournamentStart: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Prize Pool (₹ INR)"
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
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Official Rules & Dispute Policy
          </label>
          <textarea
            required
            rows={3}
            value={formData.rules}
            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
            className="w-full bg-[#141a27] border border-white/10 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <Button type="submit" variant="primary" size="md" isLoading={loading}>
            Publish Tournament Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
