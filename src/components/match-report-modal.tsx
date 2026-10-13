"use client";

import React, { useState } from "react";
import { X, Award, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { BracketMatch } from "./bracket-view";

interface MatchReportModalProps {
  match: BracketMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchReportModal({
  match,
  isOpen,
  onClose,
  onSuccess,
}: MatchReportModalProps) {
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !match) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!winnerId) {
      setError("Please designate a declared match winner.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/matches/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          score1: Number(score1),
          score2: Number(score2),
          winnerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record match score");
      }

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
      <div className="relative w-full max-w-md rounded-2xl bg-[#0f1420] border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-indigo-400 font-bold mb-1">
            <Award className="w-4 h-4" />
            Official Score Reporting
          </div>
          <h3 className="text-lg font-bold text-white">
            Round {match.round} Match #{match.matchNumber}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit verified scores to advance the tournament bracket.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-[#141b2b] border border-white/5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-200 truncate">
                {match.participant1Name || "Participant 1"}
              </span>
              <div className="w-24">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={score1}
                  onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                  className="text-center font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-200 truncate">
                {match.participant2Name || "Participant 2"}
              </span>
              <div className="w-24">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={score2}
                  onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                  className="text-center font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Declared Winner
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWinnerId(match.participant1Id || "")}
                className={`p-3 rounded-lg border text-xs font-bold text-center truncate transition-all ${
                  winnerId === match.participant1Id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-900 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                {match.participant1Name}
              </button>
              <button
                type="button"
                onClick={() => setWinnerId(match.participant2Id || "")}
                className={`p-3 rounded-lg border text-xs font-bold text-center truncate transition-all ${
                  winnerId === match.participant2Id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-900 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                {match.participant2Name}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Confirm Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
