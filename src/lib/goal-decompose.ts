// Goal Decomposition Engine — calls the AI to break goals into pillars/milestones/tasks

export interface DecomposedTask {
  task: string;
  type: "learn" | "practice" | "execute" | "review";
  done?: boolean;
}

export interface DecomposedMilestone {
  title: string;
  definitionOfDone: string;
  tasks: DecomposedTask[];
}

export interface DecomposedPillar {
  name: string;
  description: string;
  milestones: DecomposedMilestone[];
}

export interface GoalDecomposition {
  formalizedGoal: string;
  pillars: DecomposedPillar[];
  nextMove: {
    task: string;
    why: string;
    linkedTo: string;
  };
  estimatedWeeks: number;
  requiredSkills: string[];
}

export async function decomposeGoal(
  goal: { title: string; targetMetric: string; targetValue: number; baselineValue: number; why: string; deadline: string | null },
  context: { currentMastery?: number; streak?: number; completedLessons?: number }
): Promise<GoalDecomposition> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/goal-decompose`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ goal, context }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Decomposition failed");
  }

  return res.json();
}

/** Convert a decomposition into a flat roadmap for storage */
export function decompositionToRoadmap(decomp: GoalDecomposition): { step: string; done: boolean }[] {
  const steps: { step: string; done: boolean }[] = [];
  for (const pillar of decomp.pillars) {
    steps.push({ step: `📌 ${pillar.name}`, done: false });
    for (const milestone of pillar.milestones) {
      for (const task of milestone.tasks) {
        steps.push({ step: task.task, done: task.done || false });
      }
    }
  }
  return steps;
}
