// Chat history persistence using localStorage

export interface ChatThread {
  id: string;
  title: string;
  lessonId?: string; // linked lesson
  messages: { id: string; role: "user" | "assistant"; content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
}

const CHAT_STORAGE_KEY = "wisdom-ai-chat-history";

export function loadChatThreads(): ChatThread[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveChatThreads(threads: ChatThread[]): void {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
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
  const threads = loadChatThreads();
  threads.unshift(thread);
  saveChatThreads(threads);
  return thread;
}

export function addMessageToThread(threadId: string, role: "user" | "assistant", content: string): void {
  const threads = loadChatThreads();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.messages.push({ id: `msg-${Date.now()}`, role, content, timestamp: Date.now() });
    thread.updatedAt = Date.now();
    // Auto-title from first user message
    if (!thread.title || thread.title === "New Chat") {
      const firstUser = thread.messages.find(m => m.role === "user");
      if (firstUser) thread.title = firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "");
    }
    saveChatThreads(threads);
  }
}

export function renameThread(threadId: string, newTitle: string): void {
  const threads = loadChatThreads();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.title = newTitle;
    saveChatThreads(threads);
  }
}

export function deleteThread(threadId: string): void {
  const threads = loadChatThreads().filter(t => t.id !== threadId);
  saveChatThreads(threads);
}

export function getThreadByLessonId(lessonId: string): ChatThread | undefined {
  return loadChatThreads().find(t => t.lessonId === lessonId);
}

export function getThread(threadId: string): ChatThread | undefined {
  return loadChatThreads().find(t => t.id === threadId);
}
