// Chat history persistence — cloud-first with localStorage fallback

import { supabase } from "@/integrations/supabase/client";

export interface ChatThread {
  id: string;
  title: string;
  lessonId?: string;
  messages: { id: string; role: "user" | "assistant"; content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
}

const CHAT_STORAGE_KEY = "wisdom-ai-chat-history";
let _userId: string | null = null;

async function getUserId(): Promise<string | null> {
  if (_userId) return _userId;
  const { data: { user } } = await supabase.auth.getUser();
  _userId = user?.id ?? null;
  return _userId;
}

// Reset cached userId on auth change
supabase.auth.onAuthStateChange((_event, session) => {
  _userId = session?.user?.id ?? null;
});

// --- localStorage helpers (fallback) ---

function loadLocalThreads(): ChatThread[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalThreads(threads: ChatThread[]): void {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
}

// --- Cloud helpers ---

async function fetchCloudThreads(): Promise<ChatThread[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error || !threads) return [];

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: true });

  const msgsByThread: Record<string, ChatThread["messages"]> = {};
  for (const m of messages || []) {
    if (!msgsByThread[m.thread_id]) msgsByThread[m.thread_id] = [];
    msgsByThread[m.thread_id].push({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: Number(m.timestamp),
    });
  }

  return threads.map(t => ({
    id: t.id,
    title: t.title,
    lessonId: t.lesson_id || undefined,
    messages: msgsByThread[t.id] || [],
    createdAt: Number(t.created_at),
    updatedAt: Number(t.updated_at),
  }));
}

async function upsertCloudThread(thread: ChatThread): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from("chat_threads").upsert({
    id: thread.id,
    user_id: userId,
    title: thread.title,
    lesson_id: thread.lessonId || null,
    created_at: thread.createdAt,
    updated_at: thread.updatedAt,
    archived: false,
  }, { onConflict: "id,user_id" });
}

async function insertCloudMessage(threadId: string, msg: ChatThread["messages"][0]): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from("chat_messages").upsert({
    id: msg.id,
    thread_id: threadId,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }, { onConflict: "id,user_id" });
}

// --- Sync: merge local into cloud on login ---

export async function syncChatHistoryToCloud(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const localThreads = loadLocalThreads();
  if (localThreads.length === 0) return;

  // Batch upsert all local threads + messages to cloud
  for (const thread of localThreads) {
    await upsertCloudThread(thread);
    for (const msg of thread.messages) {
      await insertCloudMessage(thread.id, msg);
    }
  }
}

// --- Public API (used by Chat.tsx and others) ---

let _cloudThreadsCache: ChatThread[] | null = null;
let _cloudLoaded = false;

export async function loadCloudChatThreads(): Promise<ChatThread[]> {
  if (_cloudLoaded && _cloudThreadsCache) return _cloudThreadsCache;
  
  const userId = await getUserId();
  if (!userId) return loadLocalThreads();

  // First time: sync local → cloud, then fetch cloud
  if (!_cloudLoaded) {
    await syncChatHistoryToCloud();
    _cloudLoaded = true;
  }

  const threads = await fetchCloudThreads();
  _cloudThreadsCache = threads;
  // Also update local cache
  saveLocalThreads(threads);
  return threads;
}

export function resetChatCloudCache() {
  _cloudThreadsCache = null;
  _cloudLoaded = false;
}

// Synchronous local-only load (for contexts that can't await)
export function loadChatThreads(): ChatThread[] {
  return loadLocalThreads();
}

export function saveChatThreads(threads: ChatThread[]): void {
  saveLocalThreads(threads);
}

export async function createThread(title: string, lessonId?: string): Promise<ChatThread> {
  const thread: ChatThread = {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    lessonId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Update local
  const threads = loadLocalThreads();
  threads.unshift(thread);
  saveLocalThreads(threads);

  // Update cloud
  upsertCloudThread(thread).catch(() => {});
  _cloudThreadsCache = null; // invalidate cache

  return thread;
}

export async function addMessageToThread(threadId: string, role: "user" | "assistant", content: string): Promise<void> {
  const msg = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, role: role as "user" | "assistant", content, timestamp: Date.now() };

  // Update local
  const threads = loadLocalThreads();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.messages.push(msg);
    thread.updatedAt = Date.now();
    // Auto-title from first user message
    if (!thread.title || thread.title === "New Chat") {
      const firstUser = thread.messages.find(m => m.role === "user");
      if (firstUser) thread.title = firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "");
    }
    saveLocalThreads(threads);

    // Update cloud
    insertCloudMessage(threadId, msg).catch(() => {});
    upsertCloudThread(thread).catch(() => {});
    _cloudThreadsCache = null;
  }
}

export async function renameThread(threadId: string, newTitle: string): Promise<void> {
  const threads = loadLocalThreads();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.title = newTitle;
    saveLocalThreads(threads);
    upsertCloudThread(thread).catch(() => {});
    _cloudThreadsCache = null;
  }
}

export async function deleteThread(threadId: string): Promise<void> {
  const threads = loadLocalThreads().filter(t => t.id !== threadId);
  saveLocalThreads(threads);

  const userId = await getUserId();
  if (userId) {
    // Delete messages first, then thread
    supabase.from("chat_messages").delete().eq("thread_id", threadId).eq("user_id", userId).then(() => {
      supabase.from("chat_threads").delete().eq("id", threadId).eq("user_id", userId);
    });
    _cloudThreadsCache = null;
  }
}

export function getThreadByLessonId(lessonId: string): ChatThread | undefined {
  return loadLocalThreads().find(t => t.lessonId === lessonId);
}

export function getThread(threadId: string): ChatThread | undefined {
  return loadLocalThreads().find(t => t.id === threadId);
}
