import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CalibrationData {
  goalMode: "income" | "impact";
  outputMode: "blueprints" | "components";
  primaryDesire: string;
  answerTone: string;
  learningStyle: string;
  intensity: string;
  calibrationDone: boolean;
}

const DEFAULT: CalibrationData = {
  goalMode: "income",
  outputMode: "blueprints",
  primaryDesire: "",
  answerTone: "",
  learningStyle: "",
  intensity: "normal",
  calibrationDone: false,
};

export function useCalibration() {
  const { user } = useAuth();
  const [data, setData] = useState<CalibrationData>(() => {
    const cached = localStorage.getItem("wisdom-calibration-cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // If cached says calibration is done, trust it immediately to avoid flash
        if (parsed.calibrationDone) return { ...DEFAULT, ...parsed };
      } catch { /* ignore */ }
    }
    return DEFAULT;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("goal_mode, output_mode, calibration_done, primary_desire, answer_tone, learning_style, intensity")
      .eq("id", user.id)
      .single()
      .then(({ data: row, error }) => {
        if (row && !error) {
          const r = row as any;
          const d: CalibrationData = {
            goalMode: (r.goal_mode || "income") as any,
            outputMode: (r.output_mode || "blueprints") as any,
            primaryDesire: r.primary_desire || "",
            answerTone: r.answer_tone || "",
            learningStyle: r.learning_style || "visual",
            intensity: r.intensity || "normal",
            calibrationDone: r.calibration_done || false,
          };
          setData(d);
          localStorage.setItem("wisdom-calibration-cache", JSON.stringify(d));
        }
        setLoading(false);
      });
  }, [user]);

  const completeCalibration = useCallback(
    async (answers: {
      goalMode: string;
      outputMode: string;
      primaryDesire: string;
      answerTone: string;
      learningStyle: string;
      intensity: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        goal_mode: answers.goalMode,
        output_mode: answers.outputMode,
        primary_desire: answers.primaryDesire,
        answer_tone: answers.answerTone,
        learning_style: answers.learningStyle,
        intensity: answers.intensity,
        calibration_done: true,
      } as any;

      // Always set local state first so UI unblocks even if DB is slow
      const newData: CalibrationData = {
        goalMode: answers.goalMode as any,
        outputMode: answers.outputMode as any,
        primaryDesire: answers.primaryDesire,
        answerTone: answers.answerTone,
        learningStyle: answers.learningStyle,
        intensity: answers.intensity,
        calibrationDone: true,
      };
      localStorage.setItem("wisdom-calibration-cache", JSON.stringify(newData));

      // Try update first (profile should exist via trigger)
      const { error: updateError, count } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (updateError) {
        // Fallback: try insert
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || "",
          display_name: user.email?.split("@")[0] || "Learner",
          ...payload,
        } as any);
        if (insertError) {
          console.error("Calibration insert also failed:", insertError);
          // Still set local state so user isn't stuck
        }
      }

      // Set React state last to trigger parent re-render & unmount calibration
      setData(newData);
    },
    [user]
  );

  const updateCalibration = useCallback(
    async (updates: Partial<Pick<CalibrationData, "goalMode" | "outputMode" | "primaryDesire" | "answerTone" | "learningStyle" | "intensity">>) => {
      if (!user) return;
      const dbUpdates: any = {};
      if (updates.goalMode) dbUpdates.goal_mode = updates.goalMode;
      if (updates.outputMode) dbUpdates.output_mode = updates.outputMode;
      if (updates.primaryDesire) dbUpdates.primary_desire = updates.primaryDesire;
      if (updates.answerTone) dbUpdates.answer_tone = updates.answerTone;
      if (updates.learningStyle) dbUpdates.learning_style = updates.learningStyle;
      if (updates.intensity) dbUpdates.intensity = updates.intensity;
      await supabase.from("profiles").update(dbUpdates).eq("id", user.id);
      setData((prev) => ({ ...prev, ...updates }));
    },
    [user]
  );

  return { calibration: data, loading, completeCalibration, updateCalibration };
}
