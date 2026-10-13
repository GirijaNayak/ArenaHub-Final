"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle, ArrowRight } from "lucide-react";
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

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg font-mono">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white font-mono">
              ARENA<span className="text-indigo-400">HUB</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">Join ArenaHub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create an account to compete in tournaments or host competitions.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0f1420] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 mb-6 shadow-2xl">
          <Input
            label="Full Name"
            required
            placeholder="Marcus Vance"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Username (Gamer Tag)"
            required
            placeholder="apex_striker"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="player@example.com"
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Primary Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "PLAYER" })}
                className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                  formData.role === "PLAYER"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-900 border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                🎮 Player / Competitor
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "ORGANIZER" })}
                className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                  formData.role === "ORGANIZER"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-900 border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                🎯 Tournament Organizer
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={loading}>
            Create ArenaHub Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
