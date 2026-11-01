"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  Shield,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: string;
  orgMemberships?: Array<{ organization: { name: string; slug: string } }>;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  };

  const navLinks = [
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
    { label: "Squads", href: "/teams", icon: Users },
    { label: "Leaderboards", href: "/leaderboards", icon: Shield },
  ];

  if (user) {
    navLinks.push({ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Disputes", href: "/disputes", icon: AlertTriangle });

    if (user.role === "PLATFORM_ADMIN") {
      navLinks.push({ label: "Platform Admin", href: "/admin", icon: Shield });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090c10]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center font-black text-black text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform font-mono">
            A
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white font-mono">
            ARENA<span className="text-amber-400">HUB</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
                >
                  <div className="w-7 h-7 rounded bg-[#161d28] border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400 uppercase font-mono">
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">
                      {user.username}
                    </span>
                    <span className="text-[9px] text-amber-400/90 font-mono uppercase">
                      {user.role}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationBell />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c1017] px-4 pt-2 pb-5 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-slate-200 hover:bg-white/[0.04]"
            >
              <link.icon className="w-4 h-4 text-amber-400" />
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                  <Badge variant="gold">{user.role}</Badge>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-red-400"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
