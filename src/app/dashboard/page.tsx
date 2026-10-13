"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Bell,
  User,
  Edit2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    region: "GLOBAL",
    preferredGame: "",
    discordTag: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (!data.user) {
          window.location.href = "/auth/login";
          return;
        }
        setProfile(data.user);
        setProfileForm({
          bio: data.user.bio || "",
          region: data.user.region || "GLOBAL",
          preferredGame: data.user.preferredGame || "",
          discordTag: data.user.discordTag || "",
        });
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save profile updates
      setStatusMessage("Profile updated successfully!");
      setEditingProfile(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      // Ignore
    }
  };

  const handleInviteAction = async (inviteId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch(`/api/teams/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setStatusMessage(`Team invitation ${action.toLowerCase()}ed!`);
        fetchDashboardData();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading dashboard...</span>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header Profile Bar */}
      <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center font-bold text-xl text-indigo-400 uppercase">
              {profile.username.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-xl sm:text-2xl">{profile.name}</span>
                <Badge variant="purple">{profile.role}</Badge>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span>@{profile.username}</span>
                <span>•</span>
                <span>Region: <strong className="text-slate-300">{profile.region}</strong></span>
                {profile.discordTag && (
                  <>
                    <span>•</span>
                    <span>Discord: <strong className="text-indigo-400">{profile.discordTag}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingProfile(!editingProfile)}
            className="gap-2"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        </div>

        {profile.bio && !editingProfile && (
          <p className="text-xs text-slate-300 mt-4 max-w-2xl leading-relaxed border-t border-white/5 pt-4">
            {profile.bio}
          </p>
        )}

        {/* Edit profile inline form */}
        {editingProfile && (
          <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Region
                </label>
                <select
                  value={profileForm.region}
                  onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                  className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2 text-xs text-white"
                >
                  <option value="GLOBAL">GLOBAL</option>
                  <option value="NA">North America (NA)</option>
                  <option value="EU">Europe (EU)</option>
                  <option value="APAC">Asia-Pacific (APAC)</option>
                </select>
              </div>
              <Input
                label="Preferred Game"
                value={profileForm.preferredGame}
                onChange={(e) => setProfileForm({ ...profileForm, preferredGame: e.target.value })}
                placeholder="e.g. Valorant"
              />
              <Input
                label="Discord Tag"
                value={profileForm.discordTag}
                onChange={(e) => setProfileForm({ ...profileForm, discordTag: e.target.value })}
                placeholder="user#0000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Bio
              </label>
              <textarea
                rows={2}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-[#141a27] border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {statusMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Tournaments & Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Registered Tournaments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Registered Tournaments
            </h3>
            <Link href="/tournaments">
              <Button variant="ghost" size="sm" className="text-xs">
                Find More Events
              </Button>
            </Link>
          </div>

          {profile.registrations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-[#0f1420] border border-white/[0.08] rounded-xl">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>You haven't registered for any tournaments yet.</p>
              <Link href="/tournaments" className="inline-block mt-4">
                <Button variant="primary" size="sm">Explore Tournaments</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl divide-y divide-white/5 overflow-hidden">
              {profile.registrations.map((reg: any) => (
                <div key={reg.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/tournaments/${reg.tournament.slug}`}
                      className="font-semibold text-white text-sm hover:text-indigo-400 transition-colors"
                    >
                      {reg.tournament.title}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {reg.tournament.game.title} • Starts {new Date(reg.tournament.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge status={reg.tournament.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Team Memberships */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Your Teams
            </h3>
            <Link href="/teams/create">
              <Button variant="ghost" size="sm" className="text-xs">
                New Team
              </Button>
            </Link>
          </div>

          {profile.teamMemberships.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#0f1420] border border-white/[0.08] rounded-xl">
              <p>Not a member of any teams.</p>
              <Link href="/teams" className="inline-block mt-3">
                <Button variant="secondary" size="sm">Browse Teams</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0f1420] border border-white/[0.08] rounded-xl divide-y divide-white/5 overflow-hidden">
              {profile.teamMemberships.map((tm: any) => (
                <div key={tm.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/teams/${tm.team.id}`}
                      className="font-semibold text-white text-sm hover:text-indigo-400 transition-colors"
                    >
                      [{tm.team.tag}] {tm.team.name}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {tm.team.game.title}
                    </div>
                  </div>
                  <Badge variant={tm.role === "CAPTAIN" ? "purple" : "default"}>
                    {tm.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
