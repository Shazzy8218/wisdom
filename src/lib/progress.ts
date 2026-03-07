// Progress tracking system using localStorage

export interface UserProgress {
  completedLessons: string[]; // lesson IDs
  completedModules: string[]; // "categoryId:level:moduleIndex"
  masteryScores: Record<string, number>; // categoryId → 0-100
  tokens: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  lessonsToday: number;
  quizScores: Record<string, number>; // lessonId → score
  savedNotes: Record<string, string>; // lessonId → note
  generatedLessonIds: string[]; // IDs of AI-generated lessons already seen
}

const STORAGE_KEY = "wisdom-ai-progress";

function getDefaultProgress(): UserProgress {
  return {
    completedLessons: [],
    completedModules: [],
    masteryScores: {},
    tokens: 142,
    xp: 550,
    streak: 7,
    lastActiveDate: new Date().toISOString().split("T")[0],
    lessonsToday: 0,
    quizScores: {},
    savedNotes: {},
    generatedLessonIds: [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultProgress();
    const parsed = JSON.parse(stored);
    return { ...getDefaultProgress(), ...parsed };
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function completeLesson(lessonId: string, categoryId: string, tokensEarned: number, xpEarned: number): UserProgress {
  const p = loadProgress();
  if (!p.completedLessons.includes(lessonId)) {
    p.completedLessons.push(lessonId);
    p.tokens += tokensEarned;
    p.xp += xpEarned;
    p.lessonsToday += 1;
    
    // Update mastery for category
    updateMastery(p, categoryId);
  }
  // Update streak
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
  const p = loadProgress();
  p.quizScores[lessonId] = Math.max(p.quizScores[lessonId] || 0, score);
  saveProgress(p);
  return p;
}

export function markGeneratedLessonSeen(lessonId: string): void {
  const p = loadProgress();
  if (!p.generatedLessonIds.includes(lessonId)) {
    p.generatedLessonIds.push(lessonId);
    saveProgress(p);
  }
}

function updateMastery(p: UserProgress, categoryId: string): void {
  // Calculate mastery based on completed lessons in this category
  // Simple: each completed lesson adds roughly 2% mastery, capped at 100
  const categoryLessons = p.completedLessons.filter(id => {
    // Check if lesson belongs to this category (for generated lessons, we store category in ID)
    return id.startsWith(`${categoryId}:`) || p.completedLessons.includes(id);
  });
  const current = p.masteryScores[categoryId] || 0;
  p.masteryScores[categoryId] = Math.min(100, current + 2);
}

export function isLessonCompleted(lessonId: string): boolean {
  return loadProgress().completedLessons.includes(lessonId);
}

export function getCategoryMastery(categoryId: string): number {
  return loadProgress().masteryScores[categoryId] || 0;
}

export function getModuleLessonKey(categoryId: string, level: string, moduleIndex: number, lessonIndex: number): string {
  return `${categoryId}:${level}:${moduleIndex}:${lessonIndex}`;
}

export function completeModuleLesson(categoryId: string, level: string, moduleIndex: number, lessonIndex: number, tokensEarned: number, xpEarned: number): UserProgress {
  const lessonId = getModuleLessonKey(categoryId, level, moduleIndex, lessonIndex);
  return completeLesson(lessonId, categoryId, tokensEarned, xpEarned);
}
