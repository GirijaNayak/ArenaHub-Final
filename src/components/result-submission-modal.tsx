"use client";

import React, { useState } from "react";
import { X, Award, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ResultSubmissionModalProps {
  isOpen: boolean;
  lobbyId: string;
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResultSubmissionModal({
  isOpen,
  lobbyId,
  teamId,
  onClose,
  onSuccess,
}: ResultSubmissionModalProps) {
  const [placement, setPlacement] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Estimated point calculation preview
  const placementPointsMap: { [key: number]: number } = {
    1: 15,
    2: 12,
    3: 10,
    4: 8,
    5: 6,
    6: 4,
    7: 2,
    8: 1,
    9: 1,
    10: 1,
  };
  const previewPlacementPts = placementPointsMap[placement] || 0;
  const previewTotal = previewPlacementPts + Number(kills || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/lobbies/${lobbyId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId,
          teamId,
          placement: Number(placement),
          kills: Number(kills),
          screenshotUrl: screenshotUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit result");

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
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-amber-400 font-bold mb-1">
            <Award className="w-4 h-4" /> Official Match Score Submission
          </div>
          <h3 className="text-base font-bold text-white">Report Battle-Royale Match Result</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit your squad's placement finish and total frags for referee verification.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Squad Placement (1-25)"
              type="number"
              min="1"
              max="25"
              value={placement}
              onChange={(e) => setPlacement(parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Total Squad Kills"
              type="number"
              min="0"
              value={kills}
              onChange={(e) => setKills(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <Input
            label="Proof Screenshot URL (Optional)"
            placeholder="https://..."
            value={screenshotUrl}
            onChange={(e) => setScreenshotUrl(e.target.value)}
          />

          {/* Points Preview Box */}
          <div className="p-3 bg-[#131c28] border border-amber-500/20 rounded text-xs font-mono flex items-center justify-between">
            <span className="text-slate-400">Estimated Total Points:</span>
            <span className="font-bold text-amber-400 text-sm">
              {previewPlacementPts} (Rank) + {kills} (Kills) = {previewTotal} Pts
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="flex-1" isLoading={isSubmitting}>
              Submit Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
