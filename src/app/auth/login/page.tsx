"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-lg font-mono shadow-lg shadow-amber-500/20">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white font-mono">
              ARENA<span className="text-amber-500">HUB</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">Sign In to Platform</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access tournament lobbies, time-locked credentials, and squad rosters.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 mb-6 shadow-2xl">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="captain@arenahub.gg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" size="md" className="w-full mt-2 font-bold tracking-wide" isLoading={loading}>
            Sign In to ArenaHub
          </Button>
        </form>

        {/* 6-Role Instant Demo Sign-In Switcher */}
        <div className="bg-[#0e131b]/80 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-3">
            <KeyRound className="w-3.5 h-3.5" /> 1-Click Demo Profiles (6 Roles)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@arenahub.gg", "ArenaAdmin123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">👑 Platform Admin</span>
              <span className="text-[10px] text-slate-400 font-mono">admin@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("organizer@arenahub.gg", "Organizer123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">🎯 Organizer</span>
              <span className="text-[10px] text-slate-400 font-mono">organizer@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("referee@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">⚖️ Senior Referee</span>
              <span className="text-[10px] text-slate-400 font-mono">referee@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("captain@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">🛡️ Squad Captain</span>
              <span className="text-[10px] text-slate-400 font-mono">captain@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("player@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">⚡ Squad Player</span>
              <span className="text-[10px] text-slate-400 font-mono">player@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("spectator@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-[#090c10] border border-white/10 hover:border-amber-500/50 text-left transition-colors"
            >
              <span className="font-bold text-white block">👁️ Spectator</span>
              <span className="text-[10px] text-slate-400 font-mono">spectator@arenahub.gg</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
