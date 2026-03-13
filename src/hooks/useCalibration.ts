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
  // Business context fields
  businessType?: string;
  revenueStage?: string;
  biggestChallenge?: string;
  teamSize?: string;
  role?: string;
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
      .select("goal_mode, output_mode, calibration_done, primary_desire, answer_tone, learning_style, intensity, business_type, revenue_stage, biggest_challenge, team_size, role")
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
            businessType: r.business_type || "",
            revenueStage: r.revenue_stage || "",
            biggestChallenge: r.biggest_challenge || "",
            teamSize: r.team_size || "",
            role: r.role || "",
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
      businessType?: string;
      revenueStage?: string;
      biggestChallenge?: string;
      teamSize?: string;
      role?: string;
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
        // Business context — stored as text columns (add migration if needed)
        business_type: answers.businessType || "",
        revenue_stage: answers.revenueStage || "",
        biggest_challenge: answers.biggestChallenge || "",
        team_size: answers.teamSize || "",
        role: answers.role || "",
      } as any;

      const newData: CalibrationData = {
        goalMode: answers.goalMode as any,
        outputMode: answers.outputMode as any,
        primaryDesire: answers.primaryDesire,
        answerTone: answers.answerTone,
        learningStyle: answers.learningStyle,
        intensity: answers.intensity,
        calibrationDone: true,
        businessType: answers.businessType,
        revenueStage: answers.revenueStage,
        biggestChallenge: answers.biggestChallenge,
        teamSize: answers.teamSize,
        role: answers.role,
      };
      localStorage.setItem("wisdom-calibration-cache", JSON.stringify(newData));

      const { error: updateError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (updateError) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || "",
          display_name: user.email?.split("@")[0] || "Learner",
          ...payload,
        } as any);
        if (insertError) {
          console.error("Calibration insert also failed:", insertError);
        }
      }

      setData(newData);
    },
    [user]
  );

  const updateCalibration = useCallback(
    async (updates: Partial<CalibrationData>) => {
      if (!user) return;
      const dbUpdates: any = {};
      if (updates.goalMode) dbUpdates.goal_mode = updates.goalMode;
      if (updates.outputMode) dbUpdates.output_mode = updates.outputMode;
      if (updates.primaryDesire) dbUpdates.primary_desire = updates.primaryDesire;
      if (updates.answerTone) dbUpdates.answer_tone = updates.answerTone;
      if (updates.learningStyle) dbUpdates.learning_style = updates.learningStyle;
      if (updates.intensity) dbUpdates.intensity = updates.intensity;
      if (updates.businessType !== undefined) dbUpdates.business_type = updates.businessType;
      if (updates.revenueStage !== undefined) dbUpdates.revenue_stage = updates.revenueStage;
      if (updates.biggestChallenge !== undefined) dbUpdates.biggest_challenge = updates.biggestChallenge;
      if (updates.teamSize !== undefined) dbUpdates.team_size = updates.teamSize;
      await supabase.from("profiles").update(dbUpdates).eq("id", user.id);
      setData((prev) => ({ ...prev, ...updates }));
    },
    [user]
  );

  return { calibration: data, loading, completeCalibration, updateCalibration };
}
