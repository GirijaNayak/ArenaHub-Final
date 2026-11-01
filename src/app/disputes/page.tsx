"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Gavel, AlertCircle, CheckCircle, Clock, ExternalLink, ShieldCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisputeResolutionModal } from "@/components/dispute-resolution-modal";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = statusFilter === "ALL" ? "/api/disputes" : `/api/disputes?status=${statusFilter}`;
      const [disputesRes, authRes] = await Promise.all([
        fetch(url),
        fetch("/api/auth/me"),
      ]);

      if (disputesRes.ok) {
        const data = await disputesRes.json();
        setDisputes(data.disputes || []);
      }
      if (authRes.ok) {
        const uData = await authRes.json();
        setCurrentUser(uData.user || null);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const canResolve =
    currentUser &&
    (currentUser.role === "REFEREE" ||
      currentUser.role === "PLATFORM_ADMIN" ||
      currentUser.role === "TOURNAMENT_ORGANIZER");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
              Official Tournament Adjudication
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Dispute Resolution Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official arbitrations, score corrections, and audit-logged decisions by tournament referees.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e131b] border border-white/10 text-xs font-mono">
          {["ALL", "OPEN", "RESOLVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                statusFilter === s
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          <span className="text-xs text-slate-400 font-mono">Loading disputes stream...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e131b] border border-white/10 rounded-2xl shadow-xl">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">No Active Disputes</p>
          <p className="text-slate-400">All lobby placements and scores are currently verified and clear.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-[#0e131b] border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:border-amber-500/40"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-white/5">
                      {d.tournament.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      • {d.lobby.title} ({d.lobby.mapName})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    [{d.team.tag}] {d.team.name} — <span className="text-amber-400">{d.reason.replace(/_/g, " ")}</span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    Raised by Captain @{d.raisedBy.username} ({d.raisedBy.name}) •{" "}
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge status={d.status} />
                  {canResolve && d.status === "OPEN" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedDispute(d)}
                      className="font-mono text-xs font-bold gap-1.5"
                    >
                      <Gavel className="w-3.5 h-3.5" /> Adjudicate
                    </Button>
                  )}
                </div>
              </div>

              {/* Dispute Body */}
              <div className="p-4 rounded-xl bg-[#090c10] border border-white/5 text-xs text-slate-300 leading-relaxed mb-4">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                  Captain Statement & Claim
                </span>
                "{d.description}"
                {d.evidenceUrl && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/5">
                    <a
                      href={d.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-mono text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Review Screenshot / Video Evidence
                    </a>
                  </div>
                )}
              </div>

              {/* Resolution Notes if Resolved/Rejected */}
              {d.resolutionNotes && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <div className="flex items-center gap-2 mb-1 text-slate-400 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Official Ruling by Referee{" "}
                      <strong className="text-white">@{d.referee?.username || "Referee"}</strong> on{" "}
                      {d.resolvedAt ? new Date(d.resolvedAt).toLocaleString() : "Recently"}
                    </span>
                  </div>
                  <p className="text-slate-200 italic font-sans pl-5">
                    "{d.resolutionNotes}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <DisputeResolutionModal
          isOpen={true}
          disputeId={selectedDispute.id}
          teamTag={selectedDispute.team.tag}
          teamName={selectedDispute.team.name}
          reason={selectedDispute.reason}
          description={selectedDispute.description}
          evidenceUrl={selectedDispute.evidenceUrl}
          onClose={() => setSelectedDispute(null)}
          onSuccess={() => {
            setSelectedDispute(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
