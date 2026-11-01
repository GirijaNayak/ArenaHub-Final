"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Trophy,
  Swords,
  Activity,
  History,
  AlertTriangle,
  CheckCircle,
  Building,
  Gavel,
  Check,
  Ban,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [mRes, uRes, aRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch(`/api/admin/users?search=${userSearch}`),
        fetch("/api/admin/audit"),
      ]);

      if (mRes.ok) {
        const m = await mRes.json();
        setMetrics(m.metrics);
      }
      if (uRes.ok) {
        const u = await uRes.json();
        setUsers(u.users || []);
      }
      if (aRes.ok) {
        const a = await aRes.json();
        setAuditLogs(a.logs || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userSearch]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setActionMessage("User role updated and audit log recorded!");
      fetchData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to change this organization's status to ${newStatus}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change organization status");

      setActionMessage(`Organization status changed to ${newStatus}`);
      fetchData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading platform administration console...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Admin Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Platform Administration Console
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Multi-tenant oversight, organization status, role assignments, and platform audit logs.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Organizations</span>
              <Building className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalOrganizations}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block font-mono">
              {metrics.activeOrganizations} Active • {metrics.suspendedOrganizations} Suspended
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e131b] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Tournaments</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalTournaments}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Across all tenants
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e131b] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">BR Lobbies</span>
              <Swords className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalLobbies}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Shared match rooms
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e131b] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Disputes</span>
              <Gavel className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalDisputes}
            </div>
            <span className="text-[10px] text-amber-400 mt-1 block font-mono">
              {metrics.pendingDisputes} Pending Adjudication
            </span>
          </div>
        </div>
      )}

      {/* Multi-Tenant Organizations Oversight */}
      {metrics?.recentOrganizations && (
        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 mb-10 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Building className="w-4 h-4 text-amber-500" /> Multi-Tenant Organizations
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Inspect independent tenant organizations and enforce platform suspensions when required.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#090c10] text-slate-400 uppercase font-mono tracking-wider">
                  <th className="p-3">Organization</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Tournaments</th>
                  <th className="p-3">Staff</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.recentOrganizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-white">
                      {org.name}
                      <span className="block text-[10px] text-slate-500 font-mono">
                        /{org.slug}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-mono">@{org.owner?.username}</td>
                    <td className="p-3 text-slate-300 font-mono">{org._count.tournaments}</td>
                    <td className="p-3 text-slate-300 font-mono">{org._count.members}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          org.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleOrgStatus(org.id, org.status)}
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded transition-colors ${
                          org.status === "ACTIVE"
                            ? "bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900"
                            : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                        }`}
                      >
                        {org.status === "ACTIVE" ? "Suspend Tenant" : "Reactivate Tenant"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 mb-10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Users className="w-4 h-4 text-amber-500" /> Platform User Directory & Roles
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Assign roles across the 6 platform access tiers.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search username or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="bg-[#090c10] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64 font-mono"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#090c10] text-slate-400 uppercase font-mono tracking-wider">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">In-Game ID</th>
                <th className="p-3">Current Role</th>
                <th className="p-3 text-right">Assign Platform Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    {u.name}
                    <span className="block text-[11px] text-slate-500 font-mono">
                      @{u.username}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-mono">{u.email}</td>
                  <td className="p-3 text-slate-400 font-mono">{u.inGameId || "—"}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-white/5">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-[#090c10] border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-mono"
                    >
                      <option value="PLAYER">PLAYER</option>
                      <option value="TEAM_CAPTAIN">TEAM_CAPTAIN</option>
                      <option value="TOURNAMENT_ORGANIZER">TOURNAMENT_ORGANIZER</option>
                      <option value="REFEREE">REFEREE</option>
                      <option value="SPECTATOR">SPECTATOR</option>
                      <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit History Stream */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-500" /> Platform Security & Operations Audit Trail
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Immutable log of sensitive administrative actions, match reports, and dispute rulings.
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No audit records logged yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-amber-400">
                      {log.action}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Entity: {log.entityType} [{log.entityId}]
                    </span>
                    {log.organization && (
                      <span className="text-slate-500">
                        • Org: {log.organization.name}
                      </span>
                    )}
                  </div>
                  {log.metadata && (
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate max-w-xl">
                      {log.metadata}
                    </span>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
