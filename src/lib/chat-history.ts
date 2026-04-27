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

supabase.auth.onAuthStateChange((_event, session) => {
  _userId = session?.user?.id ?? null;
});

// --- localStorage helpers ---

// Titles to hide from chat history (legacy flows that no longer belong here)
const HIDDEN_THREAD_TITLES = new Set(["Life Optimization Session"]);

function isHiddenThread(t: ChatThread): boolean {
  return HIDDEN_THREAD_TITLES.has(t.title);
}

function loadLocal(): ChatThread[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    const parsed: ChatThread[] = stored ? JSON.parse(stored) : [];
    return parsed.filter(t => !isHiddenThread(t));
  } catch {
    return [];
  }
}

function saveLocal(threads: ChatThread[]): void {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
}

// --- Cloud fire-and-forget helpers ---

function cloudUpsertThread(thread: ChatThread): void {
  getUserId().then(userId => {
    if (!userId) return;
    supabase.from("chat_threads").upsert({
      id: thread.id,
      user_id: userId,
      title: thread.title,
      lesson_id: thread.lessonId || null,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
      archived: false,
    }, { onConflict: "id,user_id" }).then(() => {});
  }).catch(() => {});
}

function cloudInsertMessage(threadId: string, msg: ChatThread["messages"][0]): void {
  getUserId().then(userId => {
    if (!userId) return;
    supabase.from("chat_messages").upsert({
      id: msg.id,
      thread_id: threadId,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }, { onConflict: "id,user_id" }).then(() => {});
  }).catch(() => {});
}

// --- Sync on login: push local → cloud, then fetch cloud ---

let _cloudSynced = false;

export async function syncChatHistoryToCloud(): Promise<ChatThread[]> {
  const userId = await getUserId();
  if (!userId) return loadLocal();

  if (!_cloudSynced) {
    // Push local threads to cloud
    const local = loadLocal();
    for (const thread of local) {
      cloudUpsertThread(thread);
      for (const msg of thread.messages) {
        cloudInsertMessage(thread.id, msg);
      }
    }
    _cloudSynced = true;
  }

  // Fetch cloud threads
  const { data: threads } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (!threads || threads.length === 0) return loadLocal();

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

  const cloudThreads: ChatThread[] = threads
    .map(t => ({
      id: t.id,
      title: t.title,
      lessonId: t.lesson_id || undefined,
      messages: msgsByThread[t.id] || [],
      createdAt: Number(t.created_at),
      updatedAt: Number(t.updated_at),
    }))
    .filter(t => !isHiddenThread(t));

  // Merge: keep any local threads not in cloud
  const localThreads = loadLocal();
  const cloudIds = new Set(cloudThreads.map(t => t.id));
  const merged = [...cloudThreads];
  for (const lt of localThreads) {
    if (!cloudIds.has(lt.id)) {
      merged.push(lt);
      cloudUpsertThread(lt);
      for (const msg of lt.messages) cloudInsertMessage(lt.id, msg);
    }
  }

  saveLocal(merged);
  return merged;
}

export function resetChatCloudCache() {
  _cloudSynced = false;
}

// --- Public API (synchronous, with fire-and-forget cloud writes) ---

export function loadChatThreads(): ChatThread[] {
  return loadLocal();
}

export function saveChatThreads(threads: ChatThread[]): void {
  saveLocal(threads);
}

export function createThread(title: string, lessonId?: string): ChatThread {
  const thread: ChatThread = {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    lessonId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const threads = loadLocal();
  threads.unshift(thread);
  saveLocal(threads);
  cloudUpsertThread(thread);
  return thread;
}

export function addMessageToThread(threadId: string, role: "user" | "assistant", content: string): void {
  const msg = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, role: role as "user" | "assistant", content, timestamp: Date.now() };
  const threads = loadLocal();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.messages.push(msg);
    thread.updatedAt = Date.now();
    if (!thread.title || thread.title === "New Chat") {
      const firstUser = thread.messages.find(m => m.role === "user");
      if (firstUser) thread.title = firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "");
    }
    saveLocal(threads);
    cloudInsertMessage(threadId, msg);
    cloudUpsertThread(thread);
  }
}

export function renameThread(threadId: string, newTitle: string): void {
  const threads = loadLocal();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.title = newTitle;
    saveLocal(threads);
    cloudUpsertThread(thread);
  }
}

export function deleteThread(threadId: string): void {
  const threads = loadLocal().filter(t => t.id !== threadId);
  saveLocal(threads);
  getUserId().then(userId => {
    if (!userId) return;
    supabase.from("chat_messages").delete().eq("thread_id", threadId).eq("user_id", userId).then(() => {
      supabase.from("chat_threads").delete().eq("id", threadId).eq("user_id", userId);
    });
  }).catch(() => {});
}

export function getThreadByLessonId(lessonId: string): ChatThread | undefined {
  return loadLocal().find(t => t.lessonId === lessonId);
}

export function getThread(threadId: string): ChatThread | undefined {
  return loadLocal().find(t => t.id === threadId);
}
