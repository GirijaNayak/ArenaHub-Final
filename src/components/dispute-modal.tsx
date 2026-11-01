"use client";

import React, { useState } from "react";
import { X, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DisputeModalProps {
  isOpen: boolean;
  tournamentId: string;
  lobbyId: string;
  teamId: string;
  resultId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeModal({
  isOpen,
  tournamentId,
  lobbyId,
  teamId,
  resultId,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState<
    "INCORRECT_KILLS" | "INCORRECT_PLACEMENT" | "UNAUTHORIZED_PLAYER" | "ROOM_TIMING_ISSUE" | "OTHER"
  >("INCORRECT_PLACEMENT");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          lobbyId,
          teamId,
          resultId: resultId || undefined,
          reason,
          description,
          evidenceUrl: evidenceUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit dispute");

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
      <div className="relative w-full max-w-md surface-panel border border-white/10 p-6 rounded-lg shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-red-400 font-bold mb-1">
            <AlertTriangle className="w-4 h-4" /> Official Dispute Filing
          </div>
          <h3 className="text-base font-bold text-white">Contest Match Outcome</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit formal dispute for review by assigned tournament referees.
          </p>
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
              Dispute Category
            </label>
            <select
              value={reason}
              onChange={(e: any) => setReason(e.target.value)}
              className="w-full bg-[#141a27] border border-white/10 rounded-md p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="INCORRECT_PLACEMENT">Incorrect Placement Finish</option>
              <option value="INCORRECT_KILLS">Incorrect Frag / Kill Count</option>
              <option value="UNAUTHORIZED_PLAYER">Ringer / Unauthorized Roster Player</option>
              <option value="ROOM_TIMING_ISSUE">Room Timing / Credential Delay</option>
              <option value="OTHER">Other Rules Infraction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Incident Description & Timestamp
            </label>
            <textarea
              rows={3}
              required
              placeholder="Explain the discrepancy clearly (e.g., our team was 4th with 6 kills, but verified as 7th)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#141a27] border border-white/10 rounded-md p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <Input
            label="Proof / Screenshot Evidence URL"
            placeholder="https://..."
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" className="flex-1" isLoading={isSubmitting}>
              Submit Dispute
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
