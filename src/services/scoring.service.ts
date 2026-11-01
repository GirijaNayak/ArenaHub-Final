export interface ScoringConfig {
  placementPoints: { [placement: string]: number };
  killPointMultiplier: number;
}

export const DEFAULT_BGMI_SCORING: ScoringConfig = {
  placementPoints: {
    "1": 15,
    "2": 12,
    "3": 10,
    "4": 8,
    "5": 6,
    "6": 4,
    "7": 2,
    "8": 1,
    "9": 1,
    "10": 1,
  },
  killPointMultiplier: 1,
};

export class ScoringService {
  /**
   * Parse scoring configuration from string or object or return default
   */
  static parseConfig(rawConfig?: string | any | null): ScoringConfig {
    if (!rawConfig) return DEFAULT_BGMI_SCORING;
    try {
      const parsed = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
      const rawPlacements = parsed.placementPoints || DEFAULT_BGMI_SCORING.placementPoints;
      const normalizedPlacements: Record<string, number> = {};
      for (const [k, v] of Object.entries(rawPlacements)) {
        normalizedPlacements[String(k)] = Number(v);
      }

      const mult =
        typeof parsed.killPointMultiplier === "number"
          ? parsed.killPointMultiplier
          : typeof parsed.killMultiplier === "number"
          ? parsed.killMultiplier
          : DEFAULT_BGMI_SCORING.killPointMultiplier;

      return {
        placementPoints: normalizedPlacements,
        killPointMultiplier: mult,
      };
    } catch {
      return DEFAULT_BGMI_SCORING;
    }
  }

  /**
   * Compute Battle-Royale points for a single match result
   */
  static calculatePoints(
    placement: number,
    kills: number,
    configInput?: ScoringConfig | string | any
  ): {
    placementPoints: number;
    killPoints: number;
    totalPoints: number;
  } {
    if (placement < 1) throw new Error("Placement must be at least 1");
    if (kills < 0) throw new Error("Kills cannot be negative");

    const config = this.parseConfig(configInput);

    const placementKey = String(placement);
    const placementPoints = config.placementPoints[placementKey] || 0;
    const killPoints = Math.round(kills * config.killPointMultiplier);
    const totalPoints = placementPoints + killPoints;

    return {
      placementPoints,
      killPoints,
      totalPoints,
    };
  }
}
