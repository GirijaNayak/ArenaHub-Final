"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "PLAYER",
    inGameName: "",
    inGameId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const roleOptions = [
    { id: "PLAYER", label: "⚡ Squad Player", desc: "Join rosters & compete in lobbies" },
    { id: "TEAM_CAPTAIN", label: "🛡️ Squad Captain", desc: "Lead 4-player squad & file disputes" },
    { id: "TOURNAMENT_ORGANIZER", label: "🎯 Tournament Organizer", desc: "Create tournaments & manage lobbies" },
    { id: "REFEREE", label: "⚖️ Senior Referee", desc: "Verify scores & resolve disputes" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-lg font-mono shadow-lg shadow-amber-500/20">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white font-mono">
              ARENA<span className="text-amber-500">HUB</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">Join ArenaHub Esports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create an esports profile for Battle-Royale tournaments, lobbies, and official circuits.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 mb-6 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              placeholder="Jonathan Amaral"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Platform Username"
              required
              placeholder="jonathan_godl"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="jonathan@godl.gg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Password (min 8 chars)"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-white/5">
            <Input
              label="In-Game Name (IGN)"
              placeholder="GodL-JONATHAN"
              value={formData.inGameName}
              onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
            />
            <Input
              label="Character ID (In-Game ID)"
              placeholder="511223344"
              value={formData.inGameId}
              onChange={(e) => setFormData({ ...formData, inGameId: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Competitive Platform Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: opt.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === opt.id
                      ? "bg-amber-500/10 border-amber-500/60 shadow-sm"
                      : "bg-[#090c10] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <span className={`font-bold text-xs block ${formData.role === opt.id ? "text-amber-400" : "text-white"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-4 font-bold tracking-wide" isLoading={loading}>
            Create Esports Profile
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Sign In to your Account
          </Link>
        </p>
      </div>
    </div>
  );
}
