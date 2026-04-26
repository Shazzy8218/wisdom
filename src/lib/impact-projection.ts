// IMPACT PROJECTION MATRIX — Deterministic computation for non-active-goal modules.
// AI-computed projections (for active goal) are produced by the nexus-impact edge fn.

import type { FlagshipModule, FlagshipPillar } from "@/lib/nexus-flagship";
import type { UserGoal } from "@/hooks/useGoals";

export interface ImpactProjection {
  /** % probability lift toward the goal if module is mastered. */
  goalContributionPct: number;
  /** Quantified skill amplification (composite 0-100). */
  skillAmplification: number;
  /** Opportunity cost dollars/units of inaction. */
  opportunityCost: number;
  /** Display unit for opportunity cost. */
  opportunityCostUnit: string;
  /** Brief, one-line rationale. */
  rationale: string;
  /** "ai" if computed by the edge function for the user's active goal; "deterministic" otherwise. */
  source: "ai" | "deterministic";
}

const PILLAR_BASE_LIFT: Record<FlagshipPillar, number> = {
  "ethical-finance": 14,
  "unwritten-playbooks": 12,
  "system-interrogation": 10,
  "human-ai-symbiosis": 13,
  "black-swan": 11,
};

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  Strategist: 1.0,
  Operator: 1.15,
  Architect: 1.35,
};

const METRIC_TO_UNIT: Record<string, string> = {
  income: "$ / yr",
  revenue: "$ / yr",
  savings: "$",
  mastery: "mastery pts",
  hours: "hrs / mo",
  customers: "customers",
};

/** Compute deterministic projection. Used when no AI projection is available
 *  or for goals that aren't the user's active primary goal. */
export function computeImpactProjection(args: {
  module: Pick<FlagshipModule, "pillar" | "difficulty" | "tags" | "title">;
  goal?: Pick<UserGoal, "title" | "targetMetric" | "targetValue" | "currentValue"> | null;
}): ImpactProjection {
  const { module: m, goal } = args;
  const base = PILLAR_BASE_LIFT[m.pillar] ?? 10;
  const diffMult = DIFFICULTY_MULTIPLIER[m.difficulty] ?? 1.0;

  // Tag overlap bump: if module tags hint at the goal metric, lift higher
  const goalTokens = (goal?.title || "").toLowerCase().split(/\s+/).concat(goal?.targetMetric?.toLowerCase() || "");
  const tagBump = m.tags.reduce((acc, t) => acc + (goalTokens.some(g => g && t.toLowerCase().includes(g)) ? 3 : 0), 0);

  const goalContributionPct = Math.min(45, Math.round((base + tagBump) * diffMult));
  const skillAmplification = Math.min(95, Math.round(40 + base * diffMult));

  // Opportunity cost: % of remaining goal value the user risks leaving on the table
  const remaining = goal && goal.targetValue > goal.currentValue ? goal.targetValue - goal.currentValue : 0;
  const oppPct = (goalContributionPct / 100) * 0.6;
  const opportunityCost = Math.round(remaining * oppPct);

  const unit = METRIC_TO_UNIT[goal?.targetMetric ?? "mastery"] || goal?.targetMetric || "units";

  return {
    goalContributionPct,
    skillAmplification,
    opportunityCost,
    opportunityCostUnit: unit,
    rationale: goal
      ? `Tag-overlap with "${goal.title.slice(0, 40)}" + ${m.difficulty}-tier depth.`
      : `${m.difficulty}-tier flagship in ${m.pillar.replace(/-/g, " ")}.`,
    source: "deterministic",
  };
}

export function formatOppCost(value: number, unit: string): string {
  if (!value || value <= 0) return "—";
  if (unit.startsWith("$")) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M ${unit.slice(1).trim()}`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K ${unit.slice(1).trim()}`;
    return `$${value} ${unit.slice(1).trim()}`;
  }
  return `${value} ${unit}`;
}
