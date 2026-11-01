import React from "react";
import { Trophy, Crosshair, Award } from "lucide-react";
import { TeamStanding } from "@/services/standings.service";

interface StandingsTableProps {
  standings: TeamStanding[];
}

export function BattleRoyaleStandings({ standings }: StandingsTableProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className="surface-panel p-10 text-center rounded-lg">
        <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-white mb-1">No Standings Available</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Standings will be automatically calculated and ranked as match lobbies conclude and results are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-lg overflow-hidden border border-white/[0.08]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#141b26] border-b border-white/[0.06] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <th className="p-3 w-14 text-center">Rank</th>
              <th className="p-3">Squad / Team</th>
              <th className="p-3 text-center">Matches</th>
              <th className="p-3 text-center">WWCD 🏆</th>
              <th className="p-3 text-center">Kills 🎯</th>
              <th className="p-3 text-center">Placement Pts</th>
              <th className="p-3 text-center">Kill Pts</th>
              <th className="p-3 text-right font-bold text-amber-400">Total Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {standings.map((team) => {
              const isTop3 = team.rank <= 3;
              const rankColor =
                team.rank === 1
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : team.rank === 2
                  ? "bg-slate-300/20 text-slate-200 border-slate-300/30"
                  : team.rank === 3
                  ? "bg-amber-800/20 text-amber-500 border-amber-800/30"
                  : "bg-slate-800/50 text-slate-400 border-white/5";

              return (
                <tr
                  key={team.teamId}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    team.rank === 1 ? "bg-amber-500/[0.02]" : ""
                  }`}
                >
                  <td className="p-3 text-center font-mono">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold border ${rankColor}`}
                    >
                      {team.rank}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#192231] border border-white/10 flex items-center justify-center font-bold text-[10px] text-amber-400 font-mono">
                        {team.teamTag}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">
                          [{team.teamTag}] {team.teamName}
                        </span>
                        {team.bestPlacement > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Best: #{team.bestPlacement}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center font-mono text-slate-300">
                    {team.matchesPlayed}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-amber-300">
                    {team.wins}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-300">
                    {team.kills}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-400">
                    {team.placementPoints}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-400">
                    {team.killPoints}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-sm text-amber-400">
                    {team.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-[#0a0d14] border-t border-white/[0.04] flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Scoring: Official Tournament Matrix • 1 Kill = 1 Pt</span>
        <span>Tie-breakers: 1. Total Points • 2. Kill Points • 3. WWCD • 4. Best Placement</span>
      </div>
    </div>
  );
}
