"use client";

import React from "react";
import Link from "next/link";
import { Trophy, ShieldCheck, Terminal, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#07090e] border-t border-white/[0.08] mt-24 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                A
              </div>
              <span className="font-bold text-base text-white tracking-wider font-mono">
                ARENA<span className="text-indigo-400">HUB</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The premier platform for competitive esports tournaments, automated single-elimination brackets, and team coordination.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Competitions
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tournaments" className="hover:text-indigo-400 transition-colors">
                  Find Tournaments
                </Link>
              </li>
              <li>
                <Link href="/tournaments/create" className="hover:text-indigo-400 transition-colors">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link href="/leaderboards" className="hover:text-indigo-400 transition-colors">
                  Global Leaderboards
                </Link>
              </li>
            </ul>
          </div>

          {/* Teams & Community */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Community
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/teams" className="hover:text-indigo-400 transition-colors">
                  Browse Teams
                </Link>
              </li>
              <li>
                <Link href="/teams/create" className="hover:text-indigo-400 transition-colors">
                  Form a Roster
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Player Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Infrastructure
            </h4>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-2 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Deterministic seeding • Sub-second bracket propagation • Strict anti-cheat verified
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ArenaHub Gaming Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500 flex items-center gap-1">
              Built with Next.js 15 & Prisma
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
