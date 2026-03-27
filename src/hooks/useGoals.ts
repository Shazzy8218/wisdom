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
    if (!user) { setGoals([]); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) { console.error("[Goals] fetch error:", error); setLoading(false); return; }
      if (data) {
        setGoals(data.map(rowToGoal));
      }
    } catch (e) {
      console.error("[Goals] fetch exception:", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = useCallback(async (goal: Omit<UserGoal, "id" | "completed" | "createdAt">) => {
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase.from("user_goals").insert({
      user_id: user.id,
      title: goal.title,
      target_metric: goal.targetMetric,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      baseline_value: goal.baselineValue,
      deadline: goal.deadline,
      why: goal.why,
      roadmap: goal.roadmap as any,
    }).select().maybeSingle();
    if (error) { console.error("[Goals] create error:", error); throw error; }
    if (data) setGoals(prev => [rowToGoal(data), ...prev]);
    return data;
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<UserGoal>) => {
    if (!user) return;
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
    if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.roadmap !== undefined) dbUpdates.roadmap = updates.roadmap;
    if (updates.why !== undefined) dbUpdates.why = updates.why;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.baselineValue !== undefined) dbUpdates.baseline_value = updates.baselineValue;
    if (updates.targetMetric !== undefined) dbUpdates.target_metric = updates.targetMetric;
    
    const { error } = await supabase.from("user_goals").update(dbUpdates).eq("id", id);
    if (error) { console.error("[Goals] update error:", error); throw error; }
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_goals").delete().eq("id", id);
    if (error) { console.error("[Goals] delete error:", error); throw error; }
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [user]);

  const toggleComplete = useCallback(async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    await updateGoal(id, { completed: !goal.completed });
  }, [goals, updateGoal]);

  const primaryGoal = goals.find(g => !g.completed) || goals[0] || null;

  return { goals, primaryGoal, loading, createGoal, updateGoal, deleteGoal, toggleComplete, refetch: fetchGoals };
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
    roadmap: (Array.isArray(row.roadmap) ? row.roadmap : []) as { step: string; done: boolean }[],
    completed: row.completed,
    createdAt: row.created_at,
  };
}
