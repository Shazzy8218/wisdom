// Personalized lesson tracking — cloud-first with localStorage fallback

import { supabase } from "@/integrations/supabase/client";
import { loadChatThreads } from "@/lib/chat-history";

const PERSONALIZED_KEY = "wisdom-personalized-lessons";

export interface PersonalizedLesson {
  id: string;
  title: string;
  hook: string;
  content: string;
  tryPrompt: string;
  source: string;
  sourceThreadId?: string;
  generatedAt: number;
  completed: boolean;
}

// --- Local helpers ---

function loadLocal(): PersonalizedLesson[] {
  try { return JSON.parse(localStorage.getItem(PERSONALIZED_KEY) || "[]"); } catch { return []; }
}

function saveLocal(lessons: PersonalizedLesson[]) {
  localStorage.setItem(PERSONALIZED_KEY, JSON.stringify(lessons));
}

// --- Cloud fire-and-forget ---

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function cloudUpsert(lesson: PersonalizedLesson): void {
  getUserId().then(userId => {
    if (!userId) return;
    supabase.from("personalized_lessons").upsert({
      id: lesson.id,
      user_id: userId,
      title: lesson.title,
      hook: lesson.hook,
      content: lesson.content,
      try_prompt: lesson.tryPrompt,
      source: lesson.source,
      source_thread_id: lesson.sourceThreadId || null,
      generated_at: lesson.generatedAt,
      completed: lesson.completed,
    }, { onConflict: "id,user_id" }).then(() => {});
  }).catch(() => {});
}

// --- Sync on login ---

let _synced = false;

export async function syncPersonalizedLessons(): Promise<PersonalizedLesson[]> {
  const userId = await getUserId();
  if (!userId) return loadLocal();

  if (!_synced) {
    const local = loadLocal();
    for (const l of local) cloudUpsert(l);
    _synced = true;
  }

  const { data } = await supabase
    .from("personalized_lessons")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false });

  if (!data || data.length === 0) return loadLocal();

  const cloud: PersonalizedLesson[] = data.map((r: any) => ({
    id: r.id,
    title: r.title,
    hook: r.hook,
    content: r.content,
    tryPrompt: r.try_prompt,
    source: r.source,
    sourceThreadId: r.source_thread_id || undefined,
    generatedAt: Number(r.generated_at),
    completed: r.completed,
  }));

  // Merge local-only items
  const local = loadLocal();
  const cloudIds = new Set(cloud.map(l => l.id));
  for (const l of local) {
    if (!cloudIds.has(l.id)) {
      cloud.push(l);
      cloudUpsert(l);
    }
  }

  saveLocal(cloud);
  return cloud;
}

export function resetPersonalizedLessonsSync() {
  _synced = false;
}

// --- Public API (synchronous) ---

export function loadPersonalizedLessons(): PersonalizedLesson[] {
  return loadLocal();
}

export function savePersonalizedLesson(lesson: PersonalizedLesson) {
  const lessons = loadLocal();
  if (!lessons.find(l => l.id === lesson.id)) {
    lessons.unshift(lesson);
    saveLocal(lessons.slice(0, 50));
  }
  cloudUpsert(lesson);
}

export function markPersonalizedLessonComplete(id: string) {
  const lessons = loadLocal();
  const updated = lessons.map(l => l.id === id ? { ...l, completed: true } : l);
  saveLocal(updated);
  const lesson = updated.find(l => l.id === id);
  if (lesson) cloudUpsert(lesson);
}

export function deletePersonalizedLesson(id: string) {
  const lessons = loadLocal().filter(l => l.id !== id);
  saveLocal(lessons);
  getUserId().then(userId => {
    if (userId) {
      supabase.from("personalized_lessons").delete().eq("id", id).eq("user_id", userId).then(() => {});
    }
  }).catch(() => {});
}

export function extractChatTopics(): string[] {
  const threads = loadChatThreads();
  const topics: string[] = [];
  const recent = threads.slice(0, 10);
  for (const thread of recent) {
    const userMsgs = thread.messages.filter(m => m.role === "user");
    for (const msg of userMsgs.slice(0, 3)) {
      const words = msg.content.toLowerCase();
      if (words.length > 10) {
        topics.push(msg.content.slice(0, 100));
      }
    }
  }
  return [...new Set(topics)].slice(0, 10);
}

export function getUncompletedPersonalizedLessons(): PersonalizedLesson[] {
  return loadLocal().filter(l => !l.completed);
}
