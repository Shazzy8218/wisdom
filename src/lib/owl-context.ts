// Rich context builder for Wisdom Owl — gathers all user data for AI personalization

import { loadCachedProgress } from "@/lib/progress";
import { loadChatThreads } from "@/lib/chat-history";
import { CATEGORY_TRACKS } from "@/lib/categories";

const SETTINGS_KEY = "wisdom-settings";

function loadSettings(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch { return {}; }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem("wisdom-user-profile");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function loadCalibration() {
  try {
    const raw = localStorage.getItem("wisdom-calibration-cache");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export interface OwlContext {
  // Profile
  user_name: string;
  user_plan: string;
  learning_style: string;
  goal_mode: string;
  output_mode: string;
  // Stats
  streak: string;
  mastery: string;
  tokens: string;
  xp: string;
  lessons_completed: string;
  lessons_today: string;
  // Goals
  learning_goal: string;
  // Mastery breakdown
  mastery_breakdown: string;
  // Favorites & activity
  favorites_count: string;
  // Chat summary
  recent_topics: string;
  // Behavioral hints
  behavioral_hints: string;
  // Tools used
  tools_used: string;
  // Screen context
  screen?: string;
  lessonTitle?: string;
  selectedText?: string;
  cardId?: string;
  // Image
  has_image?: string;
  // Analytics
  recommendation_context?: string;
}

export function buildOwlContext(extras?: Record<string, string>): Record<string, string> {
  const settings = loadSettings();
  const profile = loadProfile();
  const calibration = loadCalibration();
  const progress = loadCachedProgress();

  const ctx: Record<string, string> = {};

  // Always send basic identity
  ctx.user_name = profile.displayName || "";
  ctx.user_plan = profile.plan || "free";
  ctx.learning_style = profile.learningStyle || "visual";
  ctx.goal_mode = calibration.goalMode || "income";
  ctx.output_mode = calibration.outputMode || "blueprints";
  
  // Tone preference
  try {
    ctx.tone_preference = (localStorage.getItem("wisdom-tone-preference")) || "ruthless";
  } catch { ctx.tone_preference = "ruthless"; }

  // Local device time context
  const now = new Date();
  ctx.local_time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  ctx.local_date = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Time-of-day signal for persona modulation
  const hour = now.getHours();
  ctx.time_of_day = hour < 6 ? "late-night" : hour < 9 ? "early-morning" : hour < 12 ? "morning" : hour < 14 ? "midday" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

  ctx.streak = String(progress.streak || 0);
  ctx.tokens = String(progress.tokens || 0);
  ctx.xp = String(progress.xp || 0);
  ctx.lessons_completed = String(progress.completedLessons?.length || 0);
  ctx.lessons_today = String(progress.lessonsToday || 0);

  // Mastery
  const scores = progress.masteryScores || {};
  const vals = Object.values(scores) as number[];
  ctx.mastery = vals.length ? String(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)) : "0";

  // Session duration hint
  try {
    const sessionStart = sessionStorage.getItem("wisdom-session-start");
    if (sessionStart) {
      const mins = Math.round((Date.now() - parseInt(sessionStart, 10)) / 60000);
      ctx.session_duration_mins = String(mins);
    } else {
      sessionStorage.setItem("wisdom-session-start", String(Date.now()));
      ctx.session_duration_mins = "0";
    }
  } catch { ctx.session_duration_mins = "0"; }

  // Consent-based: activity personalization
  if (settings.useActivity !== false) {
    // Mastery breakdown (top 5 + bottom 5)
    const entries = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));
    if (entries.length > 0) {
      const top = entries.slice(0, 5).map(([k, v]) => {
        const cat = CATEGORY_TRACKS.find(c => c.id === k);
        return `${cat?.name || k}: ${v}%`;
      });
      const bottom = entries.slice(-3).map(([k, v]) => {
        const cat = CATEGORY_TRACKS.find(c => c.id === k);
        return `${cat?.name || k}: ${v}%`;
      });
      ctx.mastery_breakdown = `Strongest: ${top.join(", ")}. Weakest: ${bottom.join(", ")}`;
    }

    // Favorites count
    ctx.favorites_count = String(progress.favorites?.length || 0);
  }

  // Consent-based: chat history context
  if (settings.useChatHistory !== false) {
    const threads = loadChatThreads();
    const recent = threads.slice(0, 5);
    if (recent.length > 0) {
      ctx.recent_topics = recent.map(t => t.title).join("; ");
    }
  }

  // Learning goal
  try {
    const goals = localStorage.getItem("wisdom-user-goals-cache");
    if (goals) {
      const parsed = JSON.parse(goals);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const active = parsed.find((g: any) => !g.completed) || parsed[0];
        ctx.learning_goal = active.title || "";
      }
    }
  } catch {}

  // Behavioral hints (consent-based)
  if (settings.useActivity !== false) {
    const hints: string[] = [];
    if (progress.completedLessons?.length === 0) hints.push("Brand new user, no lessons completed yet");
    if (progress.streak >= 7) hints.push(`Strong streak (${progress.streak} days)`);
    if (progress.streak === 0) hints.push("No active streak");
    if (vals.length > 0) {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      if (avg < 20) hints.push("Still early in learning journey");
      else if (avg > 70) hints.push("Advanced learner");
    }
    if (hints.length > 0) ctx.behavioral_hints = hints.join(". ");
  }

  // Merge extras (screen, lessonTitle, widget_mode, persona_hint, etc.)
  if (extras) Object.assign(ctx, extras);

  return ctx;
}

// For detecting which tools Owl used
export type ToolUsed = "memory" | "profile" | "chart" | "vision" | "goals" | "mastery";

export function detectToolsUsed(context: Record<string, string>, hasImage?: boolean): ToolUsed[] {
  const tools: ToolUsed[] = [];
  if (context.user_name) tools.push("profile");
  if (context.mastery_breakdown) tools.push("mastery");
  if (context.learning_goal) tools.push("goals");
  if (context.recent_topics || context.behavioral_hints) tools.push("memory");
  if (hasImage) tools.push("vision");
  return tools;
}
