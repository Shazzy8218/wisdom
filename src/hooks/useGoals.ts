import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserGoal {
  id: string;
  title: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  deadline: string | null;
  why: string;
  roadmap: { step: string; done: boolean }[];
  completed: boolean;
  createdAt: string;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_goals" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setGoals((data as any[]).map(rowToGoal));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = useCallback(async (goal: Omit<UserGoal, "id" | "completed" | "createdAt">) => {
    if (!user) return;
    const { data, error } = await supabase.from("user_goals" as any).insert({
      user_id: user.id,
      title: goal.title,
      target_metric: goal.targetMetric,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      baseline_value: goal.baselineValue,
      deadline: goal.deadline,
      why: goal.why,
      roadmap: goal.roadmap,
    } as any).select().maybeSingle();
    if (error) { console.error("Goal create error:", error); throw error; }
    if (data) setGoals(prev => [rowToGoal(data as any), ...prev]);
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<UserGoal>) => {
    if (!user) return;
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
    if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.roadmap !== undefined) dbUpdates.roadmap = updates.roadmap;
    if (updates.why !== undefined) dbUpdates.why = updates.why;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    await supabase.from("user_goals" as any).update(dbUpdates).eq("id", id);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("user_goals" as any).delete().eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [user]);

  const primaryGoal = goals[0] || null;

  return { goals, primaryGoal, loading, createGoal, updateGoal, deleteGoal, refetch: fetchGoals };
}

function rowToGoal(row: any): UserGoal {
  return {
    id: row.id,
    title: row.title,
    targetMetric: row.target_metric,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value),
    baselineValue: Number(row.baseline_value),
    deadline: row.deadline,
    why: row.why || "",
    roadmap: (row.roadmap as any[]) || [],
    completed: row.completed,
    createdAt: row.created_at,
  };
}
