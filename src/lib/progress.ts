// Progress tracking system — cloud-first with localStorage cache

import { supabase } from "@/integrations/supabase/client";

export interface UserProgress {
  completedLessons: string[];
  completedModules: string[];
  masteryScores: Record<string, number>;
  tokens: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  lessonsToday: number;
  quizScores: Record<string, number>;
  savedNotes: Record<string, string>;
  generatedLessonIds: string[];
  feedSeen: string[];
  favorites: string[];
  seenQuotes: number[];
  unlockedItems: string[];
  tokenHistory: { action: string; amount: number; date: string }[];
}

const CACHE_KEY = "wisdom-ai-progress-cache";

export function getDefaultProgress(): UserProgress {
  return {
    completedLessons: [],
    completedModules: [],
    masteryScores: {},
    tokens: 0,
    xp: 0,
    streak: 0,
    lastActiveDate: "",
    lessonsToday: 0,
    quizScores: {},
    savedNotes: {},
    generatedLessonIds: [],
    feedSeen: [],
    favorites: [],
    seenQuotes: [],
    unlockedItems: [],
    tokenHistory: [],
  };
}

// --- Local cache helpers ---

export function loadCachedProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return getDefaultProgress();
    return { ...getDefaultProgress(), ...JSON.parse(stored) };
  } catch {
    return getDefaultProgress();
  }
}

export function saveCacheProgress(progress: UserProgress): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(progress));
}

// --- Cloud helpers ---

function progressToRow(p: UserProgress) {
  return {
    completed_lessons: p.completedLessons,
    completed_modules: p.completedModules,
    mastery_scores: p.masteryScores,
    quiz_scores: p.quizScores,
    saved_notes: p.savedNotes,
    generated_lesson_ids: p.generatedLessonIds,
    tokens: p.tokens,
    xp: p.xp,
    streak: p.streak,
    last_active_date: p.lastActiveDate,
    lessons_today: p.lessonsToday,
    feed_seen: p.feedSeen,
    favorites: p.favorites,
    seen_quotes: p.seenQuotes,
    unlocked_items: p.unlockedItems,
    token_history: p.tokenHistory,
    updated_at: new Date().toISOString(),
  };
}

function rowToProgress(row: any): UserProgress {
  return {
    completedLessons: (row.completed_lessons as string[]) || [],
    completedModules: (row.completed_modules as string[]) || [],
    masteryScores: (row.mastery_scores as Record<string, number>) || {},
    quizScores: (row.quiz_scores as Record<string, number>) || {},
    savedNotes: (row.saved_notes as Record<string, string>) || {},
    generatedLessonIds: (row.generated_lesson_ids as string[]) || [],
    tokens: row.tokens ?? 0,
    xp: row.xp ?? 0,
    streak: row.streak ?? 0,
    lastActiveDate: row.last_active_date ?? "",
    lessonsToday: row.lessons_today ?? 0,
    feedSeen: (row.feed_seen as string[]) || [],
    favorites: (row.favorites as string[]) || [],
    seenQuotes: (row.seen_quotes as number[]) || [],
    unlockedItems: (row.unlocked_items as string[]) || [],
    tokenHistory: (row.token_history as any[]) || [],
  };
}

/** Merge two progress objects, keeping the richer data */
function mergeProgress(cloud: UserProgress, local: UserProgress): UserProgress {
  const merged = { ...cloud };
  // Keep whichever has more completed lessons
  if (local.completedLessons.length > cloud.completedLessons.length) {
    merged.completedLessons = [...new Set([...cloud.completedLessons, ...local.completedLessons])];
  }
  if (local.completedModules.length > cloud.completedModules.length) {
    merged.completedModules = [...new Set([...cloud.completedModules, ...local.completedModules])];
  }
  // Keep higher numeric values
  merged.tokens = Math.max(cloud.tokens, local.tokens);
  merged.xp = Math.max(cloud.xp, local.xp);
  merged.streak = Math.max(cloud.streak, local.streak);
  // Merge mastery scores (keep highest per category)
  for (const [k, v] of Object.entries(local.masteryScores)) {
    merged.masteryScores[k] = Math.max(merged.masteryScores[k] || 0, v);
  }
  // Merge quiz scores
  for (const [k, v] of Object.entries(local.quizScores)) {
    merged.quizScores[k] = Math.max(merged.quizScores[k] || 0, v);
  }
  // Merge arrays (union)
  merged.feedSeen = [...new Set([...cloud.feedSeen, ...local.feedSeen])];
  merged.favorites = [...new Set([...cloud.favorites, ...local.favorites])];
  merged.seenQuotes = [...new Set([...cloud.seenQuotes, ...local.seenQuotes])];
  merged.unlockedItems = [...new Set([...cloud.unlockedItems, ...local.unlockedItems])];
  merged.generatedLessonIds = [...new Set([...cloud.generatedLessonIds, ...local.generatedLessonIds])];
  // Merge notes
  merged.savedNotes = { ...cloud.savedNotes, ...local.savedNotes };
  // Keep longer token history
  if (local.tokenHistory.length > cloud.tokenHistory.length) {
    merged.tokenHistory = local.tokenHistory;
  }
  // Keep most recent date info
  if (local.lastActiveDate > cloud.lastActiveDate) {
    merged.lastActiveDate = local.lastActiveDate;
    merged.lessonsToday = local.lessonsToday;
  }
  return merged;
}

export async function fetchCloudProgress(): Promise<UserProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  
  // If no row exists, create one (handles users created before trigger existed)
  if (!data) {
    const defaults = getDefaultProgress();
    defaults.lastActiveDate = new Date().toISOString().split("T")[0];
    const row = { user_id: user.id, ...progressToRow(defaults) };
    const { data: inserted, error: insertErr } = await supabase
      .from("user_progress")
      .insert(row)
      .select()
      .single();
    if (insertErr || !inserted) return defaults;
    const p = rowToProgress(inserted);
    saveCacheProgress(p);
    return p;
  }

  const cloudProgress = rowToProgress(data);
  const localProgress = loadCachedProgress();
  
  // Merge: if local has richer data (user was using app before cloud sync), merge it
  const hasLocalData = localProgress.completedLessons.length > 0 || localProgress.tokens > 0 || localProgress.xp > 0;
  if (hasLocalData) {
    const merged = mergeProgress(cloudProgress, localProgress);
    saveCacheProgress(merged);
    // Save merged back to cloud
    await supabase
      .from("user_progress")
      .update(progressToRow(merged))
      .eq("user_id", user.id);
    return merged;
  }
  
  saveCacheProgress(cloudProgress);
  return cloudProgress;
}

export async function saveCloudProgress(progress: UserProgress): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  saveCacheProgress(progress);

  // Use upsert to handle missing rows
  await supabase
    .from("user_progress")
    .upsert({ user_id: user.id, ...progressToRow(progress) }, { onConflict: "user_id" })
    .select();
}

export async function resetCloudProgress(): Promise<UserProgress> {
  const fresh = getDefaultProgress();
  fresh.lastActiveDate = new Date().toISOString().split("T")[0];
  
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("user_progress")
      .update(progressToRow(fresh))
      .eq("user_id", user.id);
  }
  saveCacheProgress(fresh);
  return fresh;
}

// Legacy compat helpers used by other files
export function loadProgress(): UserProgress {
  return loadCachedProgress();
}

export function saveProgress(progress: UserProgress): void {
  saveCacheProgress(progress);
  // Fire-and-forget cloud save
  saveCloudProgress(progress).catch(() => {});
}

export function completeLesson(lessonId: string, categoryId: string, tokensEarned: number, xpEarned: number): UserProgress {
  const p = loadCachedProgress();
  if (!p.completedLessons.includes(lessonId)) {
    p.completedLessons.push(lessonId);
    p.tokens += tokensEarned;
    p.xp += xpEarned;
    p.lessonsToday += 1;
    p.tokenHistory.push({ action: `Lesson: ${lessonId}`, amount: tokensEarned, date: new Date().toISOString() });
    updateMastery(p, categoryId);
  }
  const today = new Date().toISOString().split("T")[0];
  if (p.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    p.streak = p.lastActiveDate === yesterday ? p.streak + 1 : 1;
    p.lastActiveDate = today;
    p.lessonsToday = 0;
  }
  saveProgress(p);
  return p;
}

export function saveQuizScore(lessonId: string, score: number): UserProgress {
  const p = loadCachedProgress();
  p.quizScores[lessonId] = Math.max(p.quizScores[lessonId] || 0, score);
  saveProgress(p);
  return p;
}

export function markGeneratedLessonSeen(lessonId: string): void {
  const p = loadCachedProgress();
  if (!p.generatedLessonIds.includes(lessonId)) {
    p.generatedLessonIds.push(lessonId);
    saveProgress(p);
  }
}

function updateMastery(p: UserProgress, categoryId: string): void {
  const current = p.masteryScores[categoryId] || 0;
  p.masteryScores[categoryId] = Math.min(100, current + 2);
}

export function isLessonCompleted(lessonId: string): boolean {
  return loadCachedProgress().completedLessons.includes(lessonId);
}

export function getCategoryMastery(categoryId: string): number {
  return loadCachedProgress().masteryScores[categoryId] || 0;
}

export function getModuleLessonKey(categoryId: string, level: string, moduleIndex: number, lessonIndex: number): string {
  return `${categoryId}:${level}:${moduleIndex}:${lessonIndex}`;
}

export function completeModuleLesson(categoryId: string, level: string, moduleIndex: number, lessonIndex: number, tokensEarned: number, xpEarned: number): UserProgress {
  const lessonId = getModuleLessonKey(categoryId, level, moduleIndex, lessonIndex);
  return completeLesson(lessonId, categoryId, tokensEarned, xpEarned);
}
