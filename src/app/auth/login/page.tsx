"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Shield, AlertCircle, ArrowRight, KeyRound } from "lucide-react";
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
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg font-mono">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white font-mono">
              ARENA<span className="text-indigo-400">HUB</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access registered tournaments and team rosters.
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
            label="Email Address"
            type="email"
            required
            placeholder="player@arenahub.gg"
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

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={loading}>
            Sign In to ArenaHub
          </Button>
        </form>

        {/* Quick Demo Sign-in Helper Box */}
        <div className="bg-[#0c0f18] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 mb-3">
            <KeyRound className="w-3.5 h-3.5" /> Instant Demo Sign-In
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@arenahub.gg", "ArenaAdmin123!")}
              className="p-2.5 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-left transition-colors"
            >
              <span className="font-bold text-white block">👑 Admin</span>
              <span className="text-[10px] text-slate-500 font-mono">admin@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("organizer@arenahub.gg", "Organizer123!")}
              className="p-2.5 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-left transition-colors"
            >
              <span className="font-bold text-white block">🎯 Organizer</span>
              <span className="text-[10px] text-slate-500 font-mono">organizer@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("captain@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-left transition-colors"
            >
              <span className="font-bold text-white block">🛡️ Captain</span>
              <span className="text-[10px] text-slate-500 font-mono">captain@arenahub.gg</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("player@arenahub.gg", "Password123!")}
              className="p-2.5 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-left transition-colors"
            >
              <span className="font-bold text-white block">⚡ Player</span>
              <span className="text-[10px] text-slate-500 font-mono">player@arenahub.gg</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
