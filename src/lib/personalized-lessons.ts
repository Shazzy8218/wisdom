// Personalized lesson tracking - extracts topics from chat and generates custom lessons

import { loadChatThreads } from "@/lib/chat-history";

const PERSONALIZED_KEY = "wisdom-personalized-lessons";
const TOPICS_KEY = "wisdom-chat-topics";

export interface PersonalizedLesson {
  id: string;
  title: string;
  hook: string;
  content: string;
  tryPrompt: string;
  source: string; // "From chat: <thread title>"
  sourceThreadId?: string;
  generatedAt: number;
  completed: boolean;
}

export function loadPersonalizedLessons(): PersonalizedLesson[] {
  try { return JSON.parse(localStorage.getItem(PERSONALIZED_KEY) || "[]"); } catch { return []; }
}

export function savePersonalizedLesson(lesson: PersonalizedLesson) {
  const lessons = loadPersonalizedLessons();
  if (!lessons.find(l => l.id === lesson.id)) {
    lessons.unshift(lesson);
    localStorage.setItem(PERSONALIZED_KEY, JSON.stringify(lessons.slice(0, 50)));
  }
}

export function markPersonalizedLessonComplete(id: string) {
  const lessons = loadPersonalizedLessons();
  const updated = lessons.map(l => l.id === id ? { ...l, completed: true } : l);
  localStorage.setItem(PERSONALIZED_KEY, JSON.stringify(updated));
}

export function deletePersonalizedLesson(id: string) {
  const lessons = loadPersonalizedLessons().filter(l => l.id !== id);
  localStorage.setItem(PERSONALIZED_KEY, JSON.stringify(lessons));
}

// Extract topics from recent chat threads for AI to use
export function extractChatTopics(): string[] {
  const threads = loadChatThreads();
  const topics: string[] = [];
  const recent = threads.slice(0, 10);
  for (const thread of recent) {
    const userMsgs = thread.messages.filter(m => m.role === "user");
    for (const msg of userMsgs.slice(0, 3)) {
      // Extract key phrases (simple heuristic)
      const words = msg.content.toLowerCase();
      if (words.length > 10) {
        topics.push(msg.content.slice(0, 100));
      }
    }
  }
  return [...new Set(topics)].slice(0, 10);
}

export function getUncompletedPersonalizedLessons(): PersonalizedLesson[] {
  return loadPersonalizedLessons().filter(l => !l.completed);
}
