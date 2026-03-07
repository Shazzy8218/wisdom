import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, Square, RotateCcw, ChevronDown, Plus, History, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  loadChatThreads, createThread, addMessageToThread, renameThread, deleteThread, getThread,
  type ChatThread,
} from "@/lib/chat-history";
import { getUserProfileForAI } from "@/hooks/useUserProfile";

const TUTOR_MODES = [
  { id: "default", label: "Teach Me", icon: "📖" },
  { id: "explain-10", label: "Explain Like I'm 10", icon: "🧒" },
  { id: "fast-answer", label: "Fast Answer", icon: "⚡" },
  { id: "deep-dive", label: "Deep Dive", icon: "🔬" },
  { id: "socratic", label: "Socratic Coach", icon: "🤔" },
  { id: "drills", label: "Give Drills", icon: "💪" },
  { id: "workflow", label: "Build Workflow", icon: "🔗" },
  { id: "fix-prompt", label: "Fix My Prompt", icon: "🔧" },
];

interface ChatMessage extends Msg {
  id: string;
}

export default function Chat() {
  const [search] = useSearchParams();
  const contextParam = search.get("context");
  const lessonIdParam = search.get("lessonId");
  const autoSendParam = search.get("autoSend");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "Welcome to **Wisdom AI Coach**. I'm your personal AI tutor — ask me anything about AI, prompting, workflows, or any topic you're learning.\n\n**What would you like to learn today?**" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState("default");
  const [showModes, setShowModes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    setThreads(loadChatThreads());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-send lesson context when navigating from "Ask AI about this lesson"
  useEffect(() => {
    if (contextParam && autoSendParam === "true" && !autoSentRef.current) {
      autoSentRef.current = true;
      const decoded = decodeURIComponent(contextParam);
      setInput("");
      // Create thread linked to lesson
      const thread = createThread("Lesson Q&A", lessonIdParam || undefined);
      setCurrentThreadId(thread.id);
      // Auto-send
      setTimeout(() => {
        sendMessage(decoded, thread.id);
      }, 500);
    }
  }, [contextParam, autoSendParam]);

  const sendMessage = useCallback(async (text: string, threadId?: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Persist
    let tid = threadId || currentThreadId;
    if (!tid) {
      const thread = createThread("New Chat");
      tid = thread.id;
      setCurrentThreadId(tid);
    }
    addMessageToThread(tid, "user", text);

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    await streamChat({
      messages: newMessages.map(({ role, content }) => ({ role, content })),
      mode,
      context: getUserProfileForAI(),
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => {
        setIsStreaming(false);
        abortRef.current = null;
        if (assistantContent && tid) {
          addMessageToThread(tid, "assistant", assistantContent);
          setThreads(loadChatThreads());
        }
      },
      onError: (err) => {
        toast({ title: "AI Error", description: err, variant: "destructive" });
      },
      signal: controller.signal,
    });
  }, [isStreaming, messages, mode, currentThreadId]);

  const handleSend = useCallback(() => sendMessage(input), [sendMessage, input]);
  const handleStop = () => abortRef.current?.abort();

  const handleRegenerate = useCallback(async () => {
    if (isStreaming) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const trimmed = messages.slice(0, idx + 1);
    setMessages(trimmed);
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    await streamChat({
      messages: trimmed.map(({ role, content }) => ({ role, content })),
      mode,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => { setIsStreaming(false); abortRef.current = null; },
      onError: (err) => toast({ title: "AI Error", description: err, variant: "destructive" }),
      signal: controller.signal,
    });
  }, [isStreaming, messages, mode]);

  const handleNewChat = () => {
    setMessages([{ id: "welcome", role: "assistant", content: "Welcome to **Wisdom AI Coach**. What would you like to learn?" }]);
    setCurrentThreadId(null);
    setShowHistory(false);
    autoSentRef.current = false;
  };

  const handleOpenThread = (thread: ChatThread) => {
    setCurrentThreadId(thread.id);
    setMessages([
      { id: "welcome", role: "assistant", content: "*(Continued conversation)*" },
      ...thread.messages.map(m => ({ id: m.id, role: m.role, content: m.content })),
    ]);
    setShowHistory(false);
  };

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      renameThread(id, renameValue.trim());
      setThreads(loadChatThreads());
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    setThreads(loadChatThreads());
    if (currentThreadId === id) handleNewChat();
  };

  const currentMode = TUTOR_MODES.find(m => m.id === mode) || TUTOR_MODES[0];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="section-label text-primary">AI Coach</p>
            <h1 className="font-display text-h3 text-foreground">Wisdom Tutor</h1>
          </div>
          <button onClick={() => { setThreads(loadChatThreads()); setShowHistory(!showHistory); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <History className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={handleNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {/* Mode selector */}
        <button onClick={() => setShowModes(!showModes)} className="mt-3 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
          <span>{currentMode.icon}</span>
          <span>{currentMode.label}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${showModes ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showModes && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
                {TUTOR_MODES.map((m) => (
                  <button key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }}
                    className={`rounded-xl px-3 py-1.5 text-micro font-medium transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card">
            <div className="px-5 py-3 max-h-64 overflow-y-auto hide-scrollbar">
              <p className="section-label mb-2">Chat History</p>
              {threads.length === 0 ? (
                <p className="text-caption text-muted-foreground py-4 text-center">No saved chats yet.</p>
              ) : (
                <div className="space-y-1">
                  {threads.slice(0, 20).map(t => (
                    <div key={t.id} className={`rounded-xl p-3 flex items-center gap-2 transition-all cursor-pointer ${
                      currentThreadId === t.id ? "bg-primary/10 border border-primary/20" : "bg-surface-2 hover:bg-surface-hover"
                    }`}>
                      {renamingId === t.id ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(t.id)} onKeyDown={e => e.key === "Enter" && handleRename(t.id)}
                          className="flex-1 bg-transparent text-caption text-foreground outline-none" autoFocus />
                      ) : (
                        <button onClick={() => handleOpenThread(t)} className="flex-1 text-left min-w-0">
                          <p className="text-caption font-medium text-foreground truncate">{t.title}</p>
                          <p className="text-micro text-muted-foreground">{t.messages.length} msgs · {new Date(t.updatedAt).toLocaleDateString()}</p>
                        </button>
                      )}
                      <button onClick={() => { setRenamingId(t.id); setRenameValue(t.title); }}
                        className="shrink-0 p-1 rounded-lg hover:bg-surface-hover"><Pencil className="h-3 w-3 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(t.id)}
                        className="shrink-0 p-1 rounded-lg hover:bg-destructive/10"><Trash2 className="h-3 w-3 text-text-tertiary" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-body leading-relaxed ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:rounded-xl [&_strong]:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-5 py-4">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {isStreaming && (
        <div className="flex justify-center pb-2">
          <button onClick={handleStop} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <Square className="h-3 w-3" /> Stop generating
          </button>
        </div>
      )}
      {!isStreaming && messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && (
        <div className="flex justify-center pb-2">
          <button onClick={handleRegenerate} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-5 py-4 pb-24 bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask your AI Coach..." className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
