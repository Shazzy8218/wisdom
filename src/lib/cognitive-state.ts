// COGNITIVE STATE CALIBRATION — Local heuristics for /nexus entry routing.
// Returns "peak" | "recharge" | "impact" | "ambiguous". The AI edge function
// nexus-calibrate is invoked only when state is ambiguous.

import { loadCachedProgress } from "@/lib/progress";

export type CognitivePath = "peak" | "recharge" | "impact";
export type CalibrationOutcome = CognitivePath | "ambiguous";

export interface CalibrationInput {
  lessonsToday: number;
  streak: number;
  lessonsTotal: number;
  hour: number; // 0-23
  hasActiveGoal: boolean;
  minutesSinceLastCompletion: number | null;
}

export interface CalibrationResult {
  outcome: CalibrationOutcome;
  path?: CognitivePath;
  reason: string;          // operator-grade one-liner shown by Shazzy-Owl
  source: "heuristic" | "ai";
}

const PATH_META: Record<CognitivePath, { label: string; tone: string }> = {
  peak:     { label: "Peak Leverage Trajectory",  tone: "Deep work primed." },
  recharge: { label: "Cognitive Recharge Module", tone: "Reset before re-engagement." },
  impact:   { label: "Immediate Impact Orb",      tone: "30-second edge incoming." },
};

export function getPathMeta(p: CognitivePath) { return PATH_META[p]; }

/** Pull current input snapshot from local progress + active goal cache. */
export function snapshotCalibrationInput(): CalibrationInput {
  const p = loadCachedProgress();
  let hasActiveGoal = false;
  try {
    const raw = localStorage.getItem("wisdom-user-goals-cache");
    if (raw) {
      const arr = JSON.parse(raw);
      hasActiveGoal = Array.isArray(arr) && arr.some((g: any) => !g.completed);
    }
  } catch { /* ignore */ }

  // last-completion timestamp lives in tokenHistory tail — best effort
  let lastTs: number | null = null;
  const hist = p.tokenHistory || [];
  if (hist.length > 0) {
    const t = Date.parse(hist[hist.length - 1].date);
    if (!Number.isNaN(t)) lastTs = t;
  }
  const minutesSinceLastCompletion = lastTs ? Math.floor((Date.now() - lastTs) / 60_000) : null;

  return {
    lessonsToday: p.lessonsToday || 0,
    streak: p.streak || 0,
    lessonsTotal: (p.completedLessons || []).length,
    hour: new Date().getHours(),
    hasActiveGoal,
    minutesSinceLastCompletion,
  };
}

/** Pure heuristic — no network. Returns "ambiguous" when no rule clearly fires. */
export function calibrateLocal(input: CalibrationInput): CalibrationResult {
  const { lessonsToday, streak, hour, hasActiveGoal, lessonsTotal } = input;
  const lateNight = hour >= 22 || hour < 6;
  const morning = hour >= 6 && hour < 12;

  // Heavy late-night load → recharge
  if (lessonsToday >= 3 && lateNight) {
    return {
      outcome: "recharge", path: "recharge", source: "heuristic",
      reason: "Three lessons logged after midnight — your edge sharpens with a reset, not another module.",
    };
  }
  // Fresh morning + active goal + nothing done yet → peak
  if (hasActiveGoal && morning && lessonsToday === 0) {
    return {
      outcome: "peak", path: "peak", source: "heuristic",
      reason: "Fresh mind, clear goal, day untouched. Drop into the highest-leverage move.",
    };
  }
  // No streak + has done work before → impact (quick win to reignite)
  if (streak === 0 && lessonsTotal > 0) {
    return {
      outcome: "impact", path: "impact", source: "heuristic",
      reason: "Streak reset detected. A 30-second insight is the fastest path back into rhythm.",
    };
  }
  // Brand new user, no signal → impact (light entry)
  if (lessonsTotal === 0 && !hasActiveGoal) {
    return {
      outcome: "impact", path: "impact", source: "heuristic",
      reason: "First touch. Start with a compressed insight — depth follows momentum.",
    };
  }

  return { outcome: "ambiguous", source: "heuristic", reason: "" };
}
