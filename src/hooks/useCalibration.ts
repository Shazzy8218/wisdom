import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CalibrationData {
  goalMode: "income" | "impact";
  outputMode: "blueprints" | "components";
  calibrationDone: boolean;
}

const DEFAULT: CalibrationData = { goalMode: "income", outputMode: "blueprints", calibrationDone: false };

export function useCalibration() {
  const { user } = useAuth();
  const [data, setData] = useState<CalibrationData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("profiles").select("goal_mode, output_mode, calibration_done").eq("id", user.id).single()
      .then(({ data: row, error }) => {
        if (row && !error) {
          const d: CalibrationData = {
            goalMode: ((row as any).goal_mode || "income") as any,
            outputMode: ((row as any).output_mode || "blueprints") as any,
            calibrationDone: (row as any).calibration_done || false,
          };
          setData(d);
          localStorage.setItem("wisdom-calibration-cache", JSON.stringify(d));
        }
        setLoading(false);
      });
  }, [user]);

  const completeCalibration = useCallback(async (goalMode: string, outputMode: string) => {
    if (!user) throw new Error("Not authenticated");
    
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      goal_mode: goalMode,
      output_mode: outputMode,
      calibration_done: true,
      email: user.email || "",
      display_name: user.email?.split("@")[0] || "Learner",
    } as any, { onConflict: "id" });
    
    if (error) throw error;
    
    const newData: CalibrationData = { goalMode: goalMode as any, outputMode: outputMode as any, calibrationDone: true };
    setData(newData);
    localStorage.setItem("wisdom-calibration-cache", JSON.stringify(newData));
  }, [user]);

  const updateCalibration = useCallback(async (updates: Partial<Pick<CalibrationData, "goalMode" | "outputMode">>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.goalMode) dbUpdates.goal_mode = updates.goalMode;
    if (updates.outputMode) dbUpdates.output_mode = updates.outputMode;
    await supabase.from("profiles").update(dbUpdates).eq("id", user.id);
    setData(prev => ({
      ...prev,
      ...(updates.goalMode ? { goalMode: updates.goalMode } : {}),
      ...(updates.outputMode ? { outputMode: updates.outputMode } : {}),
    }));
  }, [user]);

  return { calibration: data, loading, completeCalibration, updateCalibration };
}
