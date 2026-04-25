import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Derive a friendly display name from an email address.
// "jane.doe@example.com" -> "Jane Doe"
function deriveNameFromEmail(email: string | null | undefined): string {
  const raw = (email || "").split("@")[0]?.trim() || "";
  if (!raw) return "";
  return raw
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, "")
    .trim()
    .split(/\s+/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : ""))
    .join(" ");
}

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
const NAME_LOCK_KEY = "wisdom-user-name-locked";

function isNameLocked(): boolean {
  try { return localStorage.getItem(NAME_LOCK_KEY) === "1"; } catch { return false; }
}
function setNameLocked() {
  try { localStorage.setItem(NAME_LOCK_KEY, "1"); } catch {}
}

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

  // Hydrate displayName + email from the authenticated user / cloud profile.
  // Priority: existing local name > profiles.display_name > auth metadata > email-derived.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const email = user.email || "";
        const metaName = (user.user_metadata?.display_name as string | undefined) || "";

        let cloudName = "";
        try {
          const { data: row } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle();
          cloudName = (row?.display_name || "").trim();
        } catch {}

        const fallback = deriveNameFromEmail(email);
        const resolved = cloudName || metaName.trim() || fallback;

        setProfile((prev) => {
          const nextName = (prev.displayName && prev.displayName.trim())
            ? prev.displayName
            : resolved;
          const next = { ...prev, displayName: nextName, email: email || prev.email };
          saveProfile(next);

          // If cloud profile has no name yet, write the resolved one back so it persists.
          if (!cloudName && resolved) {
            void supabase
              .from("profiles")
              .update({ display_name: resolved })
              .eq("id", user.id);
          }
          return next;
        });
      } catch {}
    };

    void hydrate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void hydrate();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Wrap updateProfile so changes to displayName also persist to the cloud profile.
  const updateProfileWithSync = useCallback((updates: Partial<UserProfile>) => {
    updateProfile(updates);
    if (typeof updates.displayName === "string") {
      const newName = updates.displayName.trim();
      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase
            .from("profiles")
            .update({ display_name: newName })
            .eq("id", user.id);
        } catch {}
      })();
    }
  }, [updateProfile]);

  return { profile, updateProfile: updateProfileWithSync };
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
