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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-xs text-slate-400 font-mono">Loading administrative console...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Admin Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Platform Administration Console
          </h1>
          <p className="text-xs text-slate-400">
            System overview, role assignments, tournament oversight, and audit logs.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-xl bg-[#0f1420] border border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalUsers}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0f1420] border border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tournaments</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalTournaments}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              {metrics.activeTournaments} Currently Active
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#0f1420] border border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Matches</span>
              <Swords className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalMatches}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0f1420] border border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Teams</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics.totalTeams}
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> User & Role Management
            </h3>
            <p className="text-xs text-slate-400">
              Assign roles with least-privilege administrative controls.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search username or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="bg-[#141b2a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#141b2a] text-slate-400 uppercase font-mono tracking-wider">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Region</th>
                <th className="p-3 text-right">Assign Role</th>
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
                  <td className="p-3">
                    <Badge variant={u.role === "ADMIN" ? "purple" : u.role === "ORGANIZER" ? "warning" : "default"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400 font-mono">{u.region}</td>
                  <td className="p-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="PLAYER">PLAYER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit History Stream */}
      <div className="bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Platform Audit Trail
          </h3>
          <p className="text-xs text-slate-400">
            Immutable log of sensitive administrative actions and competitive match reports.
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No audit records logged yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">
                      {log.action}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-medium">
                      Target: {log.targetType} [{log.targetId}]
                    </span>
                  </div>
                  {log.metadata && (
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5 truncate max-w-xl">
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
