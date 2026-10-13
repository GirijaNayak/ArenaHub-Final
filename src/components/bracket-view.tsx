"use client";

import React, { useState } from "react";
import { Trophy, CheckCircle2, Swords, Edit3 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  participant1Id: string | null;
  participant1Name: string | null;
  participant2Id: string | null;
  participant2Name: string | null;
  score1: number;
  score2: number;
  winnerId: string | null;
  status: string; // SCHEDULED, IN_PROGRESS, COMPLETED
}

interface BracketViewProps {
  matches: BracketMatch[];
  canReportResult?: boolean;
  onReportMatch?: (match: BracketMatch) => void;
}

export function BracketView({ matches, canReportResult, onReportMatch }: BracketViewProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-[#0f1420] border border-white/10 rounded-xl p-12 text-center">
        <Swords className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white mb-1">Bracket Not Generated Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          The tournament bracket will be seeded automatically once the organizer locks registration and initiates the competition.
        </p>
      </div>
    );
  }

  // Group matches by round
  const maxRound = Math.max(...matches.map((m) => m.round));
  const rounds: { [key: number]: BracketMatch[] } = {};

  for (let r = 1; r <= maxRound; r++) {
    rounds[r] = matches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const getRoundTitle = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Grand Final";
    if (round === totalRounds - 1) return "Semi-Finals";
    if (round === totalRounds - 2) return "Quarter-Finals";
    return `Round ${round}`;
  };

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="flex items-stretch gap-12 min-w-max px-2">
        {Object.keys(rounds).map((roundKey) => {
          const roundNum = parseInt(roundKey, 10);
          const roundMatches = rounds[roundNum];
          const roundTitle = getRoundTitle(roundNum, maxRound);
          const isGrandFinal = roundNum === maxRound;

          return (
            <div key={roundNum} className="flex flex-col w-72 flex-shrink-0">
              {/* Round Header */}
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-white/10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  {isGrandFinal && <Trophy className="w-4 h-4 text-amber-400" />}
                  {roundTitle}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {roundMatches.length} {roundMatches.length === 1 ? "Match" : "Matches"}
                </span>
              </div>

              {/* Match Cards in Column */}
              <div className="flex flex-col justify-around flex-grow gap-8">
                {roundMatches.map((match) => {
                  const isCompleted = match.status === "COMPLETED";
                  const isP1Winner = isCompleted && match.winnerId === match.participant1Id;
                  const isP2Winner = isCompleted && match.winnerId === match.participant2Id;

                  return (
                    <div
                      key={match.id}
                      className={`relative bg-[#121824] border rounded-xl overflow-hidden shadow-lg transition-all ${
                        isCompleted
                          ? "border-white/10"
                          : match.status === "IN_PROGRESS"
                          ? "border-indigo-500/50 shadow-indigo-950/30"
                          : "border-white/5"
                      }`}
                    >
                      {/* Match Status bar */}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0d15] border-b border-white/5 text-[10px] font-mono">
                        <span className="text-slate-400 font-medium">M#{match.matchNumber}</span>
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            isCompleted
                              ? "text-slate-400"
                              : match.status === "IN_PROGRESS"
                              ? "text-indigo-400 animate-pulse"
                              : "text-amber-400"
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>

                      {/* Participant 1 */}
                      <div
                        className={`flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.04] ${
                          isP1Winner ? "bg-indigo-950/25" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isP1Winner && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs truncate font-medium ${
                              match.participant1Name
                                ? isP1Winner
                                  ? "text-white font-bold"
                                  : "text-slate-300"
                                : "text-slate-600 italic"
                            }`}
                          >
                            {match.participant1Name || "TBD"}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${
                            isP1Winner
                              ? "bg-indigo-500/20 text-indigo-300 font-bold"
                              : "text-slate-400 bg-slate-900"
                          }`}
                        >
                          {match.score1}
                        </span>
                      </div>

                      {/* Participant 2 */}
                      <div
                        className={`flex items-center justify-between px-3.5 py-2.5 ${
                          isP2Winner ? "bg-indigo-950/25" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isP2Winner && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs truncate font-medium ${
                              match.participant2Name
                                ? isP2Winner
                                  ? "text-white font-bold"
                                  : "text-slate-300"
                                : "text-slate-600 italic"
                            }`}
                          >
                            {match.participant2Name || "TBD"}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${
                            isP2Winner
                              ? "bg-indigo-500/20 text-indigo-300 font-bold"
                              : "text-slate-400 bg-slate-900"
                          }`}
                        >
                          {match.score2}
                        </span>
                      </div>

                      {/* Reporting button for participants/organizers */}
                      {canReportResult && !isCompleted && match.participant1Name && match.participant2Name && (
                        <div className="p-2 border-t border-white/5 bg-[#0d121c]">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs py-1"
                            onClick={() => onReportMatch && onReportMatch(match)}
                          >
                            <Edit3 className="w-3 h-3 mr-1" /> Report Result
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
