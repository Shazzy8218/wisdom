// HUMAN-CENTRIC LEARNING & APPLICATION OPTIMIZER
// Pillar I  — ACL-M: Adaptive Cognitive Load Manager
// Pillar II — RS:    Retrieval Strengthener (SM-2-lite spaced repetition)
// Pillar III— CTA:   Contextual Transfer Accelerator (helpers)
// Pillar IV — DRO:   Dynamic Relevance Optimizer (helpers)
//
// Persistence: localStorage-first (fire-and-forget). No migration required.

import { loadCachedProgress } from "@/lib/progress";
import type { FlagshipModule } from "@/lib/nexus-flagship";

// ──────────────────────────────────────────────────────────────────────
// ACL-M — Scaffolding tier
// ──────────────────────────────────────────────────────────────────────

export type ScaffoldTier = "novice" | "operator" | "expert";

export interface ScaffoldDecision {
  tier: ScaffoldTier;
  label: string;
  guidance: string;       // one-liner Shazzy delivers
  showOperatorMoves: boolean;
  showFullDoctrines: boolean;
  recommendChunking: boolean;
}

export function decideScaffold(mod: FlagshipModule): ScaffoldDecision {
  const p = loadCachedProgress();
  const total = (p.completedLessons || []).length;
  const flagshipsDone = (p.completedLessons || []).filter(l => l.startsWith("nexus:")).length;
  const pillarMastery = p.masteryScores?.[mod.pillar] || 0;

  // Heuristic — fast, deterministic
  let tier: ScaffoldTier = "operator";
  if (total < 3 || (flagshipsDone === 0 && pillarMastery < 10)) tier = "novice";
  else if (flagshipsDone >= 5 || pillarMastery >= 60) tier = "expert";

  const map: Record<ScaffoldTier, Omit<ScaffoldDecision, "tier">> = {
    novice: {
      label: "Scaffolded delivery",
      guidance: "First pass on this domain. I'll surface the core principle before the operator moves — anchor it before you wield it.",
      showOperatorMoves: false,
      showFullDoctrines: false,
      recommendChunking: true,
    },
    operator: {
      label: "Operator depth",
      guidance: "You have the base. Read the doctrines, then go straight to the operator moves. One application beats three readings.",
      showOperatorMoves: true,
      showFullDoctrines: true,
      recommendChunking: false,
    },
    expert: {
      label: "Compressed brief",
      guidance: "You don't need the framing. Skim sections, lock the operator moves, then deploy in the Arena.",
      showOperatorMoves: true,
      showFullDoctrines: true,
      recommendChunking: false,
    },
  };

  return { tier, ...map[tier] };
}

// ──────────────────────────────────────────────────────────────────────
// RS — Spaced Repetition (SM-2-lite)
// ──────────────────────────────────────────────────────────────────────

const RS_KEY = "wisdom-cae-review-items-v1";

export interface ReviewItem {
  id: string;                 // unique id (e.g. moduleId:section:i or moduleId:concept)
  moduleId: string;
  moduleTitle: string;
  prompt: string;             // active recall prompt
  ideal: string;              // reference / ideal answer for self-grading hint
  ease: number;               // SM-2 ease factor, default 2.5
  intervalDays: number;       // current interval in days
  reps: number;               // successful reps in a row
  dueAt: number;              // ms epoch
  createdAt: number;
  lastGrade?: 0 | 1 | 2 | 3;  // last self-grade
}

function loadAllReviews(): ReviewItem[] {
  try {
    const raw = localStorage.getItem(RS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReviewItem[];
  } catch { return []; }
}

function saveAllReviews(items: ReviewItem[]) {
  try { localStorage.setItem(RS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

/** Seed review items for a module if none exist for it yet. Idempotent. */
export function seedReviewsForModule(mod: FlagshipModule, prompts: { id: string; prompt: string; ideal: string }[]) {
  const all = loadAllReviews();
  const existingIds = new Set(all.filter(r => r.moduleId === mod.id).map(r => r.id));
  const now = Date.now();
  let changed = false;
  for (const p of prompts) {
    if (existingIds.has(p.id)) continue;
    all.push({
      id: p.id,
      moduleId: mod.id,
      moduleTitle: mod.title,
      prompt: p.prompt,
      ideal: p.ideal,
      ease: 2.5,
      intervalDays: 0,
      reps: 0,
      dueAt: now + 60 * 60 * 1000, // first review in 1h
      createdAt: now,
    });
    changed = true;
  }
  if (changed) saveAllReviews(all);
}

export function getDueReviews(now: number = Date.now()): ReviewItem[] {
  return loadAllReviews()
    .filter(r => r.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function getDueReviewsForModule(moduleId: string, now: number = Date.now()): ReviewItem[] {
  return getDueReviews(now).filter(r => r.moduleId === moduleId);
}

export function getDueCount(now: number = Date.now()): number {
  return getDueReviews(now).length;
}

/** Grade a review using SM-2-lite. grade: 0=blank, 1=hard, 2=good, 3=easy. */
export function gradeReview(id: string, grade: 0 | 1 | 2 | 3) {
  const all = loadAllReviews();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return;
  const r = all[idx];

  if (grade === 0) {
    // Blank — restart, due again in 10 min
    r.reps = 0;
    r.intervalDays = 0;
    r.ease = Math.max(1.3, r.ease - 0.2);
    r.dueAt = Date.now() + 10 * 60 * 1000;
  } else {
    r.reps += 1;
    if (r.reps === 1) r.intervalDays = 1;
    else if (r.reps === 2) r.intervalDays = 3;
    else r.intervalDays = Math.round(r.intervalDays * r.ease);
    // Adjust ease
    const q = grade === 1 ? 3 : grade === 2 ? 4 : 5;
    r.ease = Math.max(1.3, r.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    r.dueAt = Date.now() + r.intervalDays * 24 * 60 * 60 * 1000;
  }
  r.lastGrade = grade;
  all[idx] = r;
  saveAllReviews(all);
}

export function dismissReview(id: string) {
  const all = loadAllReviews().filter(r => r.id !== id);
  saveAllReviews(all);
}

/** Deterministic fallback prompts derived from module sections — used if AI generation is skipped. */
export function deriveFallbackPrompts(mod: FlagshipModule): { id: string; prompt: string; ideal: string }[] {
  return mod.sections.slice(0, 4).map((s, i) => ({
    id: `${mod.id}:s${i}`,
    prompt: `In your own words: what is the core principle behind "${s.heading}" and when would you deploy it?`,
    ideal: s.body.slice(0, 240),
  }));
}

// ──────────────────────────────────────────────────────────────────────
// CTA / DRO — small helpers
// ──────────────────────────────────────────────────────────────────────

const RELEVANCE_CACHE = "wisdom-cae-relevance-cache-v1";
const PHENOMENON_CACHE = "wisdom-cae-phenomenon-cache-v1";
const ANALOGY_CACHE = "wisdom-cae-analogy-cache-v1";
const REFLECTION_KEY = "wisdom-cae-reflections-v1";

function readCache<T>(key: string): Record<string, { value: T; ts: number }> {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function writeCache<T>(key: string, data: Record<string, { value: T; ts: number }>) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function getCachedRelevance(moduleId: string, goalId: string | null): string | null {
  const c = readCache<string>(RELEVANCE_CACHE);
  const k = `${moduleId}::${goalId || "no-goal"}`;
  const hit = c[k];
  if (!hit) return null;
  if (Date.now() - hit.ts > 7 * ONE_DAY) return null;
  return hit.value;
}
export function setCachedRelevance(moduleId: string, goalId: string | null, value: string) {
  const c = readCache<string>(RELEVANCE_CACHE);
  c[`${moduleId}::${goalId || "no-goal"}`] = { value, ts: Date.now() };
  writeCache(RELEVANCE_CACHE, c);
}

export function getCachedPhenomenon(moduleId: string): { headline: string; takeaway: string; sourceUrl?: string } | null {
  const c = readCache<{ headline: string; takeaway: string; sourceUrl?: string }>(PHENOMENON_CACHE);
  const hit = c[moduleId];
  if (!hit) return null;
  if (Date.now() - hit.ts > 6 * 60 * 60 * 1000) return null; // 6h freshness
  return hit.value;
}
export function setCachedPhenomenon(moduleId: string, value: { headline: string; takeaway: string; sourceUrl?: string }) {
  const c = readCache<{ headline: string; takeaway: string; sourceUrl?: string }>(PHENOMENON_CACHE);
  c[moduleId] = { value, ts: Date.now() };
  writeCache(PHENOMENON_CACHE, c);
}

export function getCachedAnalogy(moduleId: string, sectionIdx: number): string | null {
  const c = readCache<string>(ANALOGY_CACHE);
  const hit = c[`${moduleId}:${sectionIdx}`];
  if (!hit) return null;
  if (Date.now() - hit.ts > 30 * ONE_DAY) return null;
  return hit.value;
}
export function setCachedAnalogy(moduleId: string, sectionIdx: number, value: string) {
  const c = readCache<string>(ANALOGY_CACHE);
  c[`${moduleId}:${sectionIdx}`] = { value, ts: Date.now() };
  writeCache(ANALOGY_CACHE, c);
}

export interface Reflection {
  moduleId: string;
  text: string;
  actionItem: string;
  ts: number;
}
export function saveReflection(r: Reflection) {
  try {
    const arr: Reflection[] = JSON.parse(localStorage.getItem(REFLECTION_KEY) || "[]");
    arr.push(r);
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}
export function listReflections(): Reflection[] {
  try { return JSON.parse(localStorage.getItem(REFLECTION_KEY) || "[]"); } catch { return []; }
}
