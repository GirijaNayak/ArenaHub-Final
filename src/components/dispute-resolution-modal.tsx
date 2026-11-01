"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DisputeResolutionModalProps {
  isOpen: boolean;
  disputeId: string;
  teamTag: string;
  teamName: string;
  reason: string;
  description: string;
  evidenceUrl?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeResolutionModal({
  isOpen,
  disputeId,
  teamTag,
  teamName,
  reason,
  description,
  evidenceUrl,
  onClose,
  onSuccess,
}: DisputeResolutionModalProps) {
  const [status, setStatus] = useState<"RESOLVED" | "REJECTED">("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [applyCorrection, setApplyCorrection] = useState(false);
  const [correctedPlacement, setCorrectedPlacement] = useState<number>(1);
  const [correctedKills, setCorrectedKills] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        disputeId,
        status,
        resolutionNotes,
      };

      if (applyCorrection && status === "RESOLVED") {
        payload.correctedPlacement = Number(correctedPlacement);
        payload.correctedKills = Number(correctedKills);
      }

      const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve dispute");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg surface-panel border border-white/10 p-6 rounded-lg shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-amber-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" /> Referee Official Adjudication
          </div>
          <h3 className="text-base font-bold text-white">
            Resolve Dispute: [{teamTag}] {teamName}
          </h3>
        </div>

        {/* Dispute Details Summary */}
        <div className="p-3 bg-[#131b26] border border-white/5 rounded text-xs space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
            <span>Category: <strong className="text-white">{reason}</strong></span>
          </div>
          <p className="text-slate-300 leading-relaxed italic">
            "{description}"
          </p>
          {evidenceUrl && (
            <div className="pt-1">
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline font-mono text-[11px]"
              >
                View Provided Evidence ↗
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Referee Ruling
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("RESOLVED")}
                className={`p-2.5 rounded border text-xs font-mono font-bold transition-colors ${
                  status === "RESOLVED"
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-slate-900 border-white/10 text-slate-400"
                }`}
              >
                Uphold / Resolve (Correction)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("REJECTED");
                  setApplyCorrection(false);
                }}
                className={`p-2.5 rounded border text-xs font-mono font-bold transition-colors ${
                  status === "REJECTED"
                    ? "bg-red-950/60 border-red-500/50 text-red-300"
                    : "bg-slate-900 border-white/10 text-slate-400"
                }`}
              >
                Dismiss / Reject
              </button>
            </div>
          </div>

          {status === "RESOLVED" && (
            <div className="p-3 bg-[#111722] border border-white/5 rounded space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyCorrection}
                  onChange={(e) => setApplyCorrection(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="font-semibold">Apply Official Match Score Correction</span>
              </label>

              {applyCorrection && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <Input
                    label="Corrected Placement (1-25)"
                    type="number"
                    min="1"
                    max="25"
                    value={correctedPlacement}
                    onChange={(e) => setCorrectedPlacement(parseInt(e.target.value) || 1)}
                    required
                  />
                  <Input
                    label="Corrected Kills"
                    type="number"
                    min="0"
                    value={correctedKills}
                    onChange={(e) => setCorrectedKills(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Official Resolution Notes (Required for Audit Trail)
            </label>
            <textarea
              rows={3}
              required
              placeholder="State the findings of your investigation and justification for the ruling..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-[#141a27] border border-white/10 rounded-md p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="flex-1" isLoading={isSubmitting}>
              Record Official Decision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
