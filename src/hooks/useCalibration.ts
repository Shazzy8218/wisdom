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

export interface CalibrationAnswers {
  goalMode: string;
  outputMode: string;
  primaryDesire: string;
  answerTone: string;
  learningStyle: string;
  intensity: string;
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

const CALIBRATION_CACHE_KEY = "wisdom-calibration-cache";
const CALIBRATION_SAVE_TIMEOUT_MS = 25000;

function getCachedCalibration(): CalibrationData {
  const cached = localStorage.getItem(CALIBRATION_CACHE_KEY);
  if (!cached) return DEFAULT;

  try {
    const parsed = JSON.parse(cached) as Partial<CalibrationData>;
    return {
      ...DEFAULT,
      ...parsed,
      calibrationDone: Boolean(parsed.calibrationDone),
    };
  } catch {
    return DEFAULT;
  }
}

function buildCalibrationFromRow(row: any): CalibrationData {
  return {
    goalMode: (row?.goal_mode || DEFAULT.goalMode) as CalibrationData["goalMode"],
    outputMode: (row?.output_mode || DEFAULT.outputMode) as CalibrationData["outputMode"],
    primaryDesire: row?.primary_desire || "",
    answerTone: row?.answer_tone || "",
    learningStyle: row?.learning_style || "visual",
    intensity: row?.intensity || "normal",
    calibrationDone: Boolean(row?.calibration_done),
  };
}

async function withSaveTimeout<T>(promise: Promise<T>) {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("CALIBRATION_SAVE_TIMEOUT"));
    }, CALIBRATION_SAVE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export function useCalibration() {
  const { user } = useAuth();
  const [data, setData] = useState<CalibrationData>(() => getCachedCalibration());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setData(getCachedCalibration());
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from("profiles")
      .select("goal_mode, output_mode, calibration_done, primary_desire, answer_tone, learning_style, intensity")
      .eq("id", user.id)
      .single()
      .then(({ data: row, error }) => {
        if (cancelled) return;

        if (row && !error) {
          const next = buildCalibrationFromRow(row);
          setData(next);
          localStorage.setItem(CALIBRATION_CACHE_KEY, JSON.stringify(next));
        } else {
          setData(getCachedCalibration());
        }

        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(getCachedCalibration());
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const completeCalibration = useCallback(
    async (answers: CalibrationAnswers) => {
      if (!user) throw new Error("Not authenticated");

      const draftData: CalibrationData = {
        goalMode: answers.goalMode as CalibrationData["goalMode"],
        outputMode: answers.outputMode as CalibrationData["outputMode"],
        primaryDesire: answers.primaryDesire,
        answerTone: answers.answerTone,
        learningStyle: answers.learningStyle,
        intensity: answers.intensity,
        calibrationDone: data.calibrationDone,
      };

      setData(draftData);
      localStorage.setItem(CALIBRATION_CACHE_KEY, JSON.stringify(draftData));

      const { error } = await withSaveTimeout(
        supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            display_name:
              user.user_metadata?.display_name || user.email?.split("@")[0] || "Learner",
            goal_mode: answers.goalMode,
            output_mode: answers.outputMode,
            primary_desire: answers.primaryDesire,
            answer_tone: answers.answerTone,
            learning_style: answers.learningStyle,
            intensity: answers.intensity,
            calibration_done: true,
          } as any,
          { onConflict: "id" }
        )
      );

      if (error) throw error;

      const savedData: CalibrationData = {
        ...draftData,
        calibrationDone: true,
      };

      setData(savedData);
      localStorage.setItem(CALIBRATION_CACHE_KEY, JSON.stringify(savedData));
      localStorage.removeItem("wisdom-calibration-skipped");
    },
    [data.calibrationDone, user]
  );

  const updateCalibration = useCallback(
    async (
      updates: Partial<
        Pick<
          CalibrationData,
          "goalMode" | "outputMode" | "primaryDesire" | "answerTone" | "learningStyle" | "intensity"
        >
      >
    ) => {
      if (!user) return;

      const nextData = { ...data, ...updates };
      setData(nextData);
      localStorage.setItem(CALIBRATION_CACHE_KEY, JSON.stringify(nextData));

      const dbUpdates: Record<string, unknown> = {};
      if ("goalMode" in updates) dbUpdates.goal_mode = updates.goalMode;
      if ("outputMode" in updates) dbUpdates.output_mode = updates.outputMode;
      if ("primaryDesire" in updates) dbUpdates.primary_desire = updates.primaryDesire;
      if ("answerTone" in updates) dbUpdates.answer_tone = updates.answerTone;
      if ("learningStyle" in updates) dbUpdates.learning_style = updates.learningStyle;
      if ("intensity" in updates) dbUpdates.intensity = updates.intensity;

      if (!Object.keys(dbUpdates).length) return;

      const { error } = await withSaveTimeout(
        supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            display_name:
              user.user_metadata?.display_name || user.email?.split("@")[0] || "Learner",
            calibration_done: nextData.calibrationDone,
            ...dbUpdates,
          } as any,
          { onConflict: "id" }
        )
      );

      if (error) {
        console.error("Calibration update failed:", error);
      }
    },
    [data, user]
  );

  return { calibration: data, loading, completeCalibration, updateCalibration };
}
