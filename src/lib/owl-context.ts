// Rich context builder for Wisdom Owl — gathers all user data for AI personalization
// ALPHA-ACCURACY: Enhanced with deeper signals for contextual mastery

import { loadCachedProgress } from "@/lib/progress";
import { loadChatThreads } from "@/lib/chat-history";
import { CATEGORY_TRACKS } from "@/lib/categories";

const SETTINGS_KEY = "wisdom-settings";
const FEEDBACK_KEY = "wisdom-owl-feedback";

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

function loadFeedbackHistory(): { positive: number; negative: number; themes: string[] } {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return { positive: 0, negative: 0, themes: [] };
    const items: FeedbackEntry[] = JSON.parse(raw);
    const positive = items.filter(f => f.rating === "up").length;
    const negative = items.filter(f => f.rating === "down").length;
    // Extract recent negative feedback themes
    const themes = items
      .filter(f => f.rating === "down" && f.comment)
      .slice(-5)
      .map(f => f.comment!);
    return { positive, negative, themes };
  } catch { return { positive: 0, negative: 0, themes: [] }; }
}

function loadArenaHistory(): string {
  try {
    const raw = localStorage.getItem("wisdom-arena-results");
    if (!raw) return "";
    const results = JSON.parse(raw);
    if (!Array.isArray(results) || results.length === 0) return "";
    const recent = results.slice(-5);
    return recent.map((r: any) =>
      `${r.scenario || "drill"}: ${r.outcome || "completed"} (${r.score || "N/A"})`
    ).join("; ");
  } catch { return ""; }
}

function loadGameScores(): string {
  try {
    const progress = loadCachedProgress();
    const scores = progress.quizScores || {};
    const entries = Object.entries(scores);
    if (entries.length === 0) return "";
    return entries.slice(0, 5).map(([game, score]) => `${game}: ${score}`).join(", ");
  } catch { return ""; }
}

function loadActiveCourse(): string {
  try {
    const raw = localStorage.getItem("wisdom-active-track");
    return raw || "";
  } catch { return ""; }
}

function loadCourseProgress(): string {
  try {
    const progress = loadCachedProgress();
    const modules = progress.completedModules || [];
    const lessons = progress.completedLessons || [];
    if (lessons.length === 0) return "";
    return `${lessons.length} lessons, ${modules.length} modules completed`;
  } catch { return ""; }
}

export interface FeedbackEntry {
  messageId: string;
  rating: "up" | "down";
  comment?: string;
  timestamp: number;
}

export function saveFeedback(entry: FeedbackEntry) {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const items: FeedbackEntry[] = raw ? JSON.parse(raw) : [];
    items.push(entry);
    // Keep last 100
    const trimmed = items.slice(-100);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
  } catch {}
}

export interface OwlContext {
  user_name: string;
  user_plan: string;
  learning_style: string;
  goal_mode: string;
  output_mode: string;
  streak: string;
  mastery: string;
  tokens: string;
  xp: string;
  lessons_completed: string;
  lessons_today: string;
  learning_goal: string;
  mastery_breakdown: string;
  favorites_count: string;
  recent_topics: string;
  behavioral_hints: string;
  tools_used: string;
  screen?: string;
  lessonTitle?: string;
  selectedText?: string;
  cardId?: string;
  has_image?: string;
  recommendation_context?: string;
  // ALPHA-ACCURACY additions
  arena_history?: string;
  game_scores?: string;
  active_course?: string;
  course_progress?: string;
  feedback_summary?: string;
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

  // Time-of-day signal
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

  // Session duration
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

  // ═══ ALPHA-ACCURACY: Deeper context signals ═══

  // Arena history
  const arenaHist = loadArenaHistory();
  if (arenaHist) ctx.arena_history = arenaHist;

  // Game scores
  const gameScores = loadGameScores();
  if (gameScores) ctx.game_scores = gameScores;

  // Active course & progress
  const activeCourse = loadActiveCourse();
  if (activeCourse) ctx.active_course = activeCourse;
  const courseProgress = loadCourseProgress();
  if (courseProgress) ctx.course_progress = courseProgress;

  // Feedback history (Negative Feedback Loop Analyzer)
  if (settings.useActivity !== false) {
    const feedback = loadFeedbackHistory();
    if (feedback.negative > 0 || feedback.positive > 0) {
      let summary = `${feedback.positive} positive, ${feedback.negative} negative ratings`;
      if (feedback.themes.length > 0) {
        summary += `. Recent issues: ${feedback.themes.join("; ")}`;
      }
      ctx.feedback_summary = summary;
    }
  }

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

    ctx.favorites_count = String(progress.favorites?.length || 0);
  }

  // Chat history context
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
    // Session depth hint
    const sessionMins = parseInt(ctx.session_duration_mins || "0", 10);
    if (sessionMins > 30) hints.push(`Deep session (${sessionMins}min) — user is engaged`);
    
    if (hints.length > 0) ctx.behavioral_hints = hints.join(". ");
  }

  // Merge extras
  if (extras) Object.assign(ctx, extras);

  return ctx;
}

// For detecting which tools Owl used
export type ToolUsed = "memory" | "profile" | "chart" | "vision" | "goals" | "mastery" | "arena" | "feedback";

export function detectToolsUsed(context: Record<string, string>, hasImage?: boolean): ToolUsed[] {
  const tools: ToolUsed[] = [];
  if (context.user_name) tools.push("profile");
  if (context.mastery_breakdown) tools.push("mastery");
  if (context.learning_goal) tools.push("goals");
  if (context.recent_topics || context.behavioral_hints) tools.push("memory");
  if (context.arena_history) tools.push("arena");
  if (context.feedback_summary) tools.push("feedback");
  if (hasImage) tools.push("vision");
  return tools;
}
