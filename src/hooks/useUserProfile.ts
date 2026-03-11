import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  displayName: string;
  email: string;
  plan: "free" | "pro";
  learningStyle: "visual" | "reader" | "hands-on";
  streak: number;
  mastery: number;
  tokens: number;
}

const STORAGE_KEY = "wisdom-user-profile";

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  email: "",
  plan: "free",
  learningStyle: "visual",
  streak: 0,
  mastery: 0,
  tokens: 0,
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

function saveProfile(p: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      saveProfile(next);
      return next;
    });
  }, []);

  // Sync live stats from progress
  useEffect(() => {
    const sync = () => {
      try {
        const prog = JSON.parse(localStorage.getItem("wisdom-progress") || "{}");
        const masteryScores = prog.masteryScores || {};
        const vals = Object.values(masteryScores) as number[];
        const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        setProfile((prev) => {
          const next = { ...prev, streak: prog.streak || 0, mastery: avg, tokens: prog.tokens || 0 };
          saveProfile(next);
          return next;
        });
      } catch {}
    };
    sync();
    const id = setInterval(sync, 5000);
    return () => clearInterval(id);
  }, []);

  return { profile, updateProfile };
}

export function getUserProfileForAI(): Record<string, string> {
  const p = loadProfile();
  let goalMode = "income";
  let outputMode = "blueprints";
  let primaryDesire = "";
  let answerTone = "calm";
  let intensity = "normal";
  try {
    const cached = localStorage.getItem("wisdom-calibration-cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      goalMode = parsed.goalMode || "income";
      outputMode = parsed.outputMode || "blueprints";
      primaryDesire = parsed.primaryDesire || "";
      answerTone = parsed.answerTone || "calm";
      intensity = parsed.intensity || "normal";
    }
  } catch {}
  return {
    user_name: p.displayName || "",
    user_plan: p.plan,
    learning_style: p.learningStyle,
    streak: String(p.streak),
    mastery: String(p.mastery),
    tokens: String(p.tokens),
    goal_mode: goalMode,
    output_mode: outputMode,
    primary_desire: primaryDesire,
    answer_tone: answerTone,
    intensity: intensity,
  };
}
