export interface LoaRoadmapStep {
  step: string;
  done: boolean;
}

export interface LoaGoalDraft {
  id?: string;
  title: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  deadline: string | null;
  why: string;
  roadmap: LoaRoadmapStep[];
}

interface PersistLoaGoalsResponse {
  createdCount: number;
  goals: Array<{ id: string; title: string }>;
}

const EXACT_MARKER_REGEX = /===GOALS_START===\s*([\s\S]*?)\s*===GOALS_END===/;
const RELAXED_MARKER_REGEX = /GOALS_START[=\s]*([\s\S]*?)[=\s]*GOALS_END/;

export function hasLoaGoalPayload(content: string): boolean {
  return /GOALS_START/.test(content) && /GOALS_END/.test(content);
}

export function extractGoalsFromLoaMessage(content: string): LoaGoalDraft[] {
  const jsonBlock = extractJsonBlock(content);

  if (!jsonBlock) {
    throw new Error("No goal payload found in the advisor response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(jsonBlock));
  } catch {
    throw new Error("The advisor returned an unreadable goal payload.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("The advisor returned an invalid goal list.");
  }

  const goals = parsed
    .map(normalizeGoal)
    .filter((goal): goal is LoaGoalDraft => goal !== null);

  if (goals.length === 0) {
    throw new Error("No valid goals were found in the advisor response.");
  }

  return goals;
}

export async function persistLoaGoalsFromMessage(
  assistantContent: string,
  accessToken: string,
  threadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PersistLoaGoalsResponse> {
  const goals = extractGoalsFromLoaMessage(assistantContent).map((goal, index) => ({
    ...goal,
    id: goal.id ?? generateGoalId(threadId, index),
  }));

  return persistLoaGoals(goals, accessToken, fetchImpl);
}

async function persistLoaGoals(
  goals: LoaGoalDraft[],
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<PersistLoaGoalsResponse> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loa-save-goals`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ goals }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          createdCount: Number(payload.createdCount) || goals.length,
          goals: Array.isArray(payload.goals) ? payload.goals : [],
        };
      }

      lastError = new Error(payload.error || `Goal persistence failed (${response.status}).`);

      if (response.status >= 500 && attempt === 0) {
        continue;
      }

      throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Goal persistence failed.");

      if (attempt === 0) {
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("Goal persistence failed.");
}

function extractJsonBlock(content: string): string | null {
  const exactMatch = content.match(EXACT_MARKER_REGEX);
  if (exactMatch) return exactMatch[1].trim();

  const relaxedMatch = content.match(RELAXED_MARKER_REGEX);
  return relaxedMatch?.[1].trim() ?? null;
}

function stripCodeFences(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function normalizeGoal(rawGoal: unknown): LoaGoalDraft | null {
  if (!rawGoal || typeof rawGoal !== "object") return null;

  const source = rawGoal as Record<string, unknown>;
  const title = String(source.title ?? "").trim();
  if (!title) return null;

  const baselineValue = coerceNumber(source.baselineValue ?? source.baseline_value, 0);
  const currentValue = coerceNumber(source.currentValue ?? source.current_value, baselineValue);
  const targetValue = coerceNumber(source.targetValue ?? source.target_value, Math.max(1, baselineValue + 1));

  return {
    title,
    targetMetric: String(source.targetMetric ?? source.target_metric ?? "custom").trim() || "custom",
    targetValue,
    currentValue,
    baselineValue,
    deadline: normalizeDeadline(source.deadline),
    why: String(source.why ?? "").trim(),
    roadmap: normalizeRoadmap(source.roadmap),
  };
}

function normalizeRoadmap(rawRoadmap: unknown): LoaRoadmapStep[] {
  if (!Array.isArray(rawRoadmap)) return [];

  return rawRoadmap
    .map((entry) => {
      if (typeof entry === "string") {
        const step = entry.trim();
        return step ? { step, done: false } : null;
      }

      if (!entry || typeof entry !== "object") return null;

      const source = entry as Record<string, unknown>;
      const step = String(source.step ?? source.task ?? "").trim();
      if (!step) return null;

      return {
        step,
        done: source.done === true,
      };
    })
    .filter((entry): entry is LoaRoadmapStep => entry !== null);
}

function normalizeDeadline(deadline: unknown): string | null {
  if (typeof deadline !== "string") return null;

  const trimmed = deadline.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function coerceNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function generateGoalId(threadId: string, index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${threadId}-${index}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}