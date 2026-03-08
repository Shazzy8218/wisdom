// Analytics Engine — studies user patterns to generate proactive suggestions
// Uses ONLY internal app data: progress, goals, chats, mastery, profile

import { loadCachedProgress, type UserProgress } from "@/lib/progress";
import { loadChatThreads, type ChatThread } from "@/lib/chat-history";
import { CATEGORY_TRACKS } from "@/lib/categories";

const ANALYTICS_CACHE_KEY = "wisdom-analytics-cache";
const WEEKLY_REVIEW_KEY = "wisdom-weekly-review-cache";

// --- Types ---

export interface Suggestion {
  id: string;
  type: "next-move" | "focus-today" | "avoiding" | "slowing-down" | "recommended";
  title: string;
  body: string;
  reason?: string; // "Recommended because…"
  action?: { label: string; to: string };
  priority: number; // 0-100
}

export interface WeeklyReview {
  generatedAt: number;
  weekOf: string;
  strengths: string[];
  weaknesses: string[];
  topicsCovered: string[];
  streakSummary: string;
  tokensSummary: string;
  goalDrift: string | null;
  nextFocus: string;
  lessonsCompleted: number;
}

export interface PatternInsight {
  type: "strength" | "weakness" | "drift" | "habit" | "opportunity";
  title: string;
  body: string;
  icon: string;
}

export interface AnalyticsSnapshot {
  generatedAt: number;
  suggestions: Suggestion[];
  insights: PatternInsight[];
  weeklyReview: WeeklyReview | null;
  strongestCategories: { id: string; name: string; score: number }[];
  weakestCategories: { id: string; name: string; score: number }[];
  recurringTopics: string[];
  timeSpentEstimate: Record<string, number>; // category -> estimated minutes
}

// --- Helpers ---

function getCategoryName(id: string): string {
  return CATEGORY_TRACKS.find(c => c.id === id)?.name || id;
}

function getTopicFrequency(threads: ChatThread[]): Record<string, number> {
  const freq: Record<string, number> = {};
  const recent = threads.slice(0, 30);
  for (const t of recent) {
    for (const msg of t.messages.filter(m => m.role === "user")) {
      const words = msg.content.toLowerCase().split(/\s+/);
      for (const cat of CATEGORY_TRACKS) {
        const keywords = [cat.id, ...cat.name.toLowerCase().split(/\s+/)];
        for (const kw of keywords) {
          if (words.some(w => w.includes(kw) && kw.length > 3)) {
            freq[cat.id] = (freq[cat.id] || 0) + 1;
          }
        }
      }
    }
  }
  return freq;
}

function estimateTimeSpent(progress: UserProgress): Record<string, number> {
  const time: Record<string, number> = {};
  for (const lessonId of progress.completedLessons) {
    const catId = lessonId.split(":")[0];
    if (catId) time[catId] = (time[catId] || 0) + 5; // ~5 min per lesson
  }
  return time;
}

function loadGoalsCache(): any[] {
  try {
    const raw = localStorage.getItem("wisdom-user-goals-cache");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadProfile(): any {
  try {
    const raw = localStorage.getItem("wisdom-user-profile");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function loadCalibration(): any {
  try {
    const raw = localStorage.getItem("wisdom-calibration-cache");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// --- Core Analysis ---

export function generateAnalytics(): AnalyticsSnapshot {
  const progress = loadCachedProgress();
  const threads = loadChatThreads();
  const goals = loadGoalsCache();
  const profile = loadProfile();
  const calibration = loadCalibration();

  const scores = progress.masteryScores || {};
  const entries = Object.entries(scores)
    .map(([id, score]) => ({ id, name: getCategoryName(id), score: score as number }))
    .sort((a, b) => b.score - a.score);

  const strongest = entries.slice(0, 3);
  const weakest = entries.filter(e => e.score < 50).slice(-3).reverse();
  const topicFreq = getTopicFrequency(threads);
  const timeSpent = estimateTimeSpent(progress);
  const recurringTopics = Object.entries(topicFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => getCategoryName(id));

  const suggestions = generateSuggestions(progress, goals, threads, weakest, strongest, topicFreq, calibration, profile);
  const insights = generateInsights(progress, goals, strongest, weakest, topicFreq, timeSpent);
  const weeklyReview = generateWeeklyReview(progress, threads, goals, strongest, weakest, recurringTopics);

  const snapshot: AnalyticsSnapshot = {
    generatedAt: Date.now(),
    suggestions,
    insights,
    weeklyReview,
    strongestCategories: strongest,
    weakestCategories: weakest,
    recurringTopics,
    timeSpentEstimate: timeSpent,
  };

  // Cache
  try { localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(snapshot)); } catch {}

  return snapshot;
}

export function loadCachedAnalytics(): AnalyticsSnapshot | null {
  try {
    const raw = localStorage.getItem(ANALYTICS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Refresh if older than 30 min
    if (Date.now() - parsed.generatedAt > 30 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
}

export function getAnalytics(): AnalyticsSnapshot {
  return loadCachedAnalytics() || generateAnalytics();
}

// --- Suggestions ---

function generateSuggestions(
  progress: UserProgress,
  goals: any[],
  threads: ChatThread[],
  weakest: { id: string; name: string; score: number }[],
  strongest: { id: string; name: string; score: number }[],
  topicFreq: Record<string, number>,
  calibration: any,
  profile: any,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const activeGoal = goals.find((g: any) => !g.completed);

  // 1. Next Move — based on weakest mastery + goal
  if (weakest.length > 0) {
    const focus = weakest[0];
    const goalContext = activeGoal ? ` (aligns with your goal: "${activeGoal.title}")` : "";
    suggestions.push({
      id: "next-move",
      type: "next-move",
      title: `Focus on ${focus.name}`,
      body: `Your ${focus.name} mastery is at ${focus.score}%. A quick lesson here will have the biggest impact${goalContext}.`,
      reason: `Recommended because ${focus.name} is your lowest mastery area.`,
      action: { label: "Start Lesson", to: `/category/${focus.id}` },
      priority: 90,
    });
  }

  // 2. Focus Today
  if (progress.lessonsToday === 0) {
    suggestions.push({
      id: "focus-today",
      type: "focus-today",
      title: "Complete your first lesson today",
      body: progress.streak > 0
        ? `You have a ${progress.streak}-day streak. Don't break it — one lesson keeps you on track.`
        : "Start building momentum. One lesson a day compounds fast.",
      action: { label: "Go to Learn", to: "/learn" },
      priority: 85,
    });
  } else {
    suggestions.push({
      id: "focus-today",
      type: "focus-today",
      title: `${progress.lessonsToday} lesson${progress.lessonsToday > 1 ? "s" : ""} done today`,
      body: "Great progress! Try a drill or explore a new category to keep growing.",
      action: { label: "Try a Drill", to: "/drills" },
      priority: 40,
    });
  }

  // 3. What you're avoiding — categories with 0 mastery that exist
  const untouched = CATEGORY_TRACKS
    .filter(c => !progress.masteryScores[c.id] || progress.masteryScores[c.id] === 0)
    .slice(0, 3);
  if (untouched.length > 0 && Object.keys(progress.masteryScores).length > 2) {
    suggestions.push({
      id: "avoiding",
      type: "avoiding",
      title: `You haven't touched ${untouched[0].name}`,
      body: `${untouched.length} categor${untouched.length > 1 ? "ies" : "y"} still at 0%. Even one lesson gives you a foundation.`,
      reason: `You've been active in other areas but haven't started ${untouched[0].name} yet.`,
      action: { label: `Start ${untouched[0].name}`, to: `/category/${untouched[0].id}` },
      priority: 60,
    });
  }

  // 4. Streak warning
  if (progress.streak > 3 && progress.lessonsToday === 0) {
    suggestions.push({
      id: "streak-warning",
      type: "slowing-down",
      title: `${progress.streak}-day streak at risk`,
      body: "Complete any lesson to keep your streak alive.",
      action: { label: "Quick Lesson", to: "/learn" },
      priority: 95,
    });
  }

  // 5. Goal-aligned recommendation
  if (activeGoal) {
    const goalMetric = activeGoal.target_metric || activeGoal.targetMetric;
    if (goalMetric === "mastery" && weakest.length > 0) {
      suggestions.push({
        id: "goal-rec",
        type: "recommended",
        title: `Boost mastery for "${activeGoal.title}"`,
        body: `Your weakest area (${weakest[0].name} at ${weakest[0].score}%) is holding back your overall mastery goal.`,
        reason: `Recommended because your goal targets mastery and ${weakest[0].name} needs work.`,
        action: { label: "Go to Category", to: `/category/${weakest[0].id}` },
        priority: 80,
      });
    }
  }

  // 6. Inactivity nudge
  if (progress.lastActiveDate) {
    const last = new Date(progress.lastActiveDate);
    const daysAgo = Math.floor((Date.now() - last.getTime()) / 86400000);
    if (daysAgo >= 3) {
      suggestions.push({
        id: "inactivity",
        type: "slowing-down",
        title: `${daysAgo} days since your last session`,
        body: "Pick up where you left off. Even 5 minutes matters.",
        action: { label: "Resume", to: "/learn" },
        priority: 88,
      });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

// --- Pattern Insights ---

function generateInsights(
  progress: UserProgress,
  goals: any[],
  strongest: { id: string; name: string; score: number }[],
  weakest: { id: string; name: string; score: number }[],
  topicFreq: Record<string, number>,
  timeSpent: Record<string, number>,
): PatternInsight[] {
  const insights: PatternInsight[] = [];

  if (strongest.length > 0) {
    insights.push({
      type: "strength",
      title: `You're strongest in ${strongest[0].name}`,
      body: `${strongest[0].score}% mastery — keep pushing to expert level.`,
      icon: "💪",
    });
  }

  if (weakest.length > 0) {
    insights.push({
      type: "weakness",
      title: `${weakest[0].name} needs attention`,
      body: `Only ${weakest[0].score}% mastery. One focused session could move the needle.`,
      icon: "🎯",
    });
  }

  // Goal drift detection
  const activeGoal = goals.find((g: any) => !g.completed);
  if (activeGoal && Object.keys(topicFreq).length > 0) {
    const goalTitle = (activeGoal.title || "").toLowerCase();
    const topTopic = Object.entries(topicFreq).sort(([, a], [, b]) => b - a)[0];
    if (topTopic) {
      const topName = getCategoryName(topTopic[0]).toLowerCase();
      if (!goalTitle.includes(topName) && topTopic[1] > 3) {
        insights.push({
          type: "drift",
          title: "Possible goal drift",
          body: `You keep spending time on ${getCategoryName(topTopic[0])}, but your stated goal is "${activeGoal.title}". Consider realigning.`,
          icon: "⚠️",
        });
      }
    }
  }

  // Time pattern
  const timeEntries = Object.entries(timeSpent).sort(([, a], [, b]) => b - a);
  if (timeEntries.length > 0) {
    const topTime = timeEntries[0];
    insights.push({
      type: "habit",
      title: `Most time spent on ${getCategoryName(topTime[0])}`,
      body: `~${topTime[1]} minutes estimated. ${timeEntries.length > 3 ? "You're exploring broadly." : "Consider branching out."}`,
      icon: "⏱️",
    });
  }

  // Opportunity
  const completedCount = progress.completedLessons.length;
  if (completedCount > 5 && completedCount < 50) {
    insights.push({
      type: "opportunity",
      title: `${completedCount} lessons completed`,
      body: "You're building a solid foundation. Try a Live Fire Drill to test your knowledge under pressure.",
      icon: "🚀",
    });
  }

  return insights;
}

// --- Weekly Review ---

function generateWeeklyReview(
  progress: UserProgress,
  threads: ChatThread[],
  goals: any[],
  strongest: { id: string; name: string; score: number }[],
  weakest: { id: string; name: string; score: number }[],
  recurringTopics: string[],
): WeeklyReview | null {
  // Check if we already generated this week
  try {
    const cached = localStorage.getItem(WEEKLY_REVIEW_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (parsed.generatedAt > weekAgo) return parsed;
    }
  } catch {}

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekOf = `${weekStart.toLocaleDateString()} – ${now.toLocaleDateString()}`;

  // Count recent lessons
  const recentLessons = progress.completedLessons.filter(l => {
    // We don't have timestamps on lessons, so estimate from thread activity
    return true; // Count all
  });

  const activeGoal = goals.find((g: any) => !g.completed);
  let goalDrift: string | null = null;
  if (activeGoal && recurringTopics.length > 0) {
    const goalTitle = (activeGoal.title || "").toLowerCase();
    if (!recurringTopics.some(t => goalTitle.includes(t.toLowerCase()))) {
      goalDrift = `Your recent activity focuses on ${recurringTopics[0]}, but your goal is "${activeGoal.title}". Consider realigning.`;
    }
  }

  const review: WeeklyReview = {
    generatedAt: Date.now(),
    weekOf,
    strengths: strongest.slice(0, 3).map(s => `${s.name} (${s.score}%)`),
    weaknesses: weakest.slice(0, 3).map(w => `${w.name} (${w.score}%)`),
    topicsCovered: recurringTopics.slice(0, 5),
    streakSummary: progress.streak > 0
      ? `${progress.streak}-day streak — ${progress.streak >= 7 ? "incredible consistency!" : "keep building!"}`
      : "No active streak. Start one today!",
    tokensSummary: `${progress.tokens} tokens earned total.`,
    goalDrift,
    nextFocus: weakest.length > 0
      ? `Focus on ${weakest[0].name} to raise your overall mastery.`
      : "Explore a new category to broaden your skills.",
    lessonsCompleted: progress.completedLessons.length,
  };

  try { localStorage.setItem(WEEKLY_REVIEW_KEY, JSON.stringify(review)); } catch {}
  return review;
}

// --- Recommendation context for AI ---

export function getRecommendationContext(): string {
  const analytics = getAnalytics();
  const parts: string[] = [];

  if (analytics.suggestions.length > 0) {
    const top = analytics.suggestions[0];
    parts.push(`Top suggestion: ${top.title} — ${top.body}`);
  }
  if (analytics.strongestCategories.length > 0) {
    parts.push(`Strongest: ${analytics.strongestCategories.map(s => `${s.name} ${s.score}%`).join(", ")}`);
  }
  if (analytics.weakestCategories.length > 0) {
    parts.push(`Weakest: ${analytics.weakestCategories.map(w => `${w.name} ${w.score}%`).join(", ")}`);
  }
  if (analytics.recurringTopics.length > 0) {
    parts.push(`Recurring topics: ${analytics.recurringTopics.join(", ")}`);
  }
  if (analytics.insights.some(i => i.type === "drift")) {
    const drift = analytics.insights.find(i => i.type === "drift");
    parts.push(`Goal drift warning: ${drift?.body}`);
  }

  return parts.join(". ");
}
