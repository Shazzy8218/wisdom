// Proactive Intelligence — Owl-initiated suggestions based on user state

import { useState, useEffect, useRef, useCallback } from "react";
import { loadCachedProgress } from "@/lib/progress";
import { CATEGORY_TRACKS } from "@/lib/categories";

export interface ProactiveNudge {
  id: string;
  type: "mastery-gap" | "streak" | "goal-drift" | "idle" | "milestone" | "momentum" | "nexus-injection";
  message: string;
  prompt: string; // What to send to Owl if user taps it
  priority: number; // 1 = highest
  deepLink?: string; // optional route to navigate to instead of opening chat
}

const IDLE_THRESHOLD_MS = 90_000; // 90 seconds
const NUDGE_COOLDOWN_MS = 300_000; // 5 minutes between nudges
const NUDGE_STORAGE_KEY = "wisdom-last-nudge-ts";

function getLastNudgeTime(): number {
  try {
    return parseInt(localStorage.getItem(NUDGE_STORAGE_KEY) || "0", 10);
  } catch { return 0; }
}

function setLastNudgeTime() {
  localStorage.setItem(NUDGE_STORAGE_KEY, String(Date.now()));
}

function generateNudges(): ProactiveNudge[] {
  const nudges: ProactiveNudge[] = [];
  const progress = loadCachedProgress();
  const scores = progress.masteryScores || {};
  const vals = Object.values(scores) as number[];
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

  // Mastery gaps — find weakest areas
  const entries = Object.entries(scores).sort(([, a], [, b]) => (a as number) - (b as number));
  if (entries.length > 0) {
    const weakest = entries[0];
    const cat = CATEGORY_TRACKS.find(c => c.id === weakest[0]);
    if ((weakest[1] as number) < 30 && cat) {
      nudges.push({
        id: `gap-${weakest[0]}`,
        type: "mastery-gap",
        message: `Your ${cat.name} mastery is at ${weakest[1]}%. Want a quick lesson?`,
        prompt: `Help me improve my ${cat.name} skills. My mastery is at ${weakest[1]}%. Give me a focused practice plan.`,
        priority: 2,
      });
    }
  }

  // Streak awareness
  if (progress.streak === 0 && progress.completedLessons?.length > 0) {
    nudges.push({
      id: "streak-broken",
      type: "streak",
      message: "Your streak reset. One lesson to restart it 🔥",
      prompt: "I lost my streak. Give me the fastest lesson to get back on track.",
      priority: 1,
    });
  } else if (progress.streak >= 7 && progress.streak % 7 === 0) {
    nudges.push({
      id: `streak-${progress.streak}`,
      type: "milestone",
      message: `${progress.streak}-day streak! Let's level up.`,
      prompt: `I'm on a ${progress.streak}-day streak. What should I focus on next to maximize my progress?`,
      priority: 3,
    });
  }

  // Momentum check
  if (progress.lessonsToday === 0 && progress.completedLessons?.length > 5) {
    nudges.push({
      id: "no-lessons-today",
      type: "momentum",
      message: "No lessons today yet. Quick 5-min session?",
      prompt: "Give me a quick 5-minute lesson to keep my momentum going today.",
      priority: 2,
    });
  }

  // Goal drift — if user has goals but low recent activity
  try {
    const goalsRaw = localStorage.getItem("wisdom-user-goals-cache");
    if (goalsRaw) {
      const goals = JSON.parse(goalsRaw);
      const activeGoals = Array.isArray(goals) ? goals.filter((g: any) => !g.completed) : [];
      if (activeGoals.length > 0 && progress.lessonsToday === 0 && avg > 0) {
        nudges.push({
          id: "goal-drift",
          type: "goal-drift",
          message: `Still working toward "${activeGoals[0].title?.slice(0, 40)}"?`,
          prompt: `Check my progress on my goal: "${activeGoals[0].title}". Am I on track? What should I do today?`,
          priority: 1,
        });
      }
    }
  } catch {}

  // Sort by priority
  nudges.sort((a, b) => a.priority - b.priority);
  return nudges;
}

export function useProactiveOwl(opts?: { enabled?: boolean }) {
  const [nudge, setNudge] = useState<ProactiveNudge | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityRef = useRef(Date.now());

  const enabled = opts?.enabled !== false;

  const checkAndSetNudge = useCallback(() => {
    if (!enabled || dismissed) return;
    const lastNudge = getLastNudgeTime();
    if (Date.now() - lastNudge < NUDGE_COOLDOWN_MS) return;

    const nudges = generateNudges();
    if (nudges.length > 0) {
      setNudge(nudges[0]);
      setLastNudgeTime();
    }
  }, [enabled, dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setNudge(null);
  }, []);

  const resetDismiss = useCallback(() => {
    setDismissed(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      activityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(checkAndSetNudge, IDLE_THRESHOLD_MS);
    };

    // Initial check after a delay
    const initialTimer = setTimeout(checkAndSetNudge, 10_000);

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });

    return () => {
      clearTimeout(initialTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, [enabled, checkAndSetNudge]);

  return { nudge, dismiss, resetDismiss };
}
