import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, RotateCcw, Plus, History, Pencil, Trash2, Bookmark, ChevronDown, Mic, Zap, Shield, PanelRight } from "lucide-react";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { parseAndSaveWisdomPack } from "@/lib/wisdom-packs";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  loadChatThreads, createThread, addMessageToThread, renameThread, deleteThread,
  type ChatThread,
} from "@/lib/chat-history";
import { getUserProfileForAI } from "@/hooks/useUserProfile";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgress } from "@/hooks/useProgress";
import { QUOTES } from "@/lib/data";
import OwlIcon from "@/components/OwlIcon";
import OwlHuntTracker from "@/components/OwlHuntTracker";
import BlueprintRenderer from "@/components/BlueprintRenderer";
import VaultSidebar from "@/components/VaultSidebar";

const TUTOR_MODES = [
  { id: "default", label: "Command", icon: "⚡" },
  { id: "task", label: "Task", icon: "🎯" },
  { id: "deep-dive", label: "Deep Dive", icon: "🔬" },
  { id: "fast-answer", label: "Fast", icon: "⚡" },
  { id: "fix-prompt", label: "Fix Prompt", icon: "🔧" },
  { id: "socratic", label: "Socratic", icon: "🤔" },
  { id: "drills", label: "Drills", icon: "💪" },
  { id: "workflow", label: "Workflow", icon: "🔗" },
  { id: "quote-teach", label: "Quotes", icon: "💎" },
];

const QUOTE_SEEN_KEY = "wisdom-daily-quote-key";

function getDailyQuote(): string {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(QUOTE_SEEN_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.quote;
    } catch {}
  }
  const seenIds = JSON.parse(localStorage.getItem("wisdom-seen-quotes-v2") || "[]") as number[];
  const available = QUOTES.map((_, i) => i).filter(i => !seenIds.includes(i));
  const pick = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : Math.floor(Math.random() * QUOTES.length);
  const quote = QUOTES[pick];
  localStorage.setItem(QUOTE_SEEN_KEY, JSON.stringify({ date: today, quote }));
  if (!seenIds.includes(pick)) {
    localStorage.setItem("wisdom-seen-quotes-v2", JSON.stringify([...seenIds, pick]));
  }
  return quote;
}

interface ChatMessage extends Msg {
  id: string;
}

export default function Chat() {
  const [search] = useSearchParams();
  const contextParam = search.get("context");
  const lessonIdParam = search.get("lessonId");
  const autoSendParam = search.get("autoSend");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState("default");
  const [showModes, setShowModes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [savedQuote, setSavedQuote] = useState(false);
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSentRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clock = useLiveClock();
  const { profile } = useUserProfile();
  const { progress } = useProgress();
  const [dailyQuote] = useState(() => getDailyQuote());

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  useEffect(() => { setThreads(loadChatThreads()); }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    blueprintRef.current?.scrollTo({ top: blueprintRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (contextParam && autoSendParam === "true" && !autoSentRef.current) {
      autoSentRef.current = true;
      setInput("");
      const thread = createThread("Lesson Q&A", lessonIdParam || undefined);
      setCurrentThreadId(thread.id);
      setTimeout(() => sendMessage(decodeURIComponent(contextParam), thread.id), 500);
    }
  }, [contextParam, autoSendParam]);

  const sendMessage = useCallback(async (text: string, threadId?: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

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
          if (mode === "task") {
            const lastUserMsg = newMessages.filter(m => m.role === "user").pop();
            parseAndSaveWisdomPack(assistantContent, lastUserMsg?.content || text);
          }
        }
      },
      onError: (err) => toast({ title: "System Error", description: err, variant: "destructive" }),
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
      onDone: () => { setIsStreaming(false); abortRef.current = null; },
      onError: (err) => toast({ title: "System Error", description: err, variant: "destructive" }),
      signal: controller.signal,
    });
  }, [isStreaming, messages, mode]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentThreadId(null);
    setShowHistory(false);
    autoSentRef.current = false;
  };

  const handleOpenThread = (thread: ChatThread) => {
    setCurrentThreadId(thread.id);
    setMessages(thread.messages.map(m => ({ id: m.id, role: m.role, content: m.content })));
    setShowHistory(false);
  };

  const handleRename = (id: string) => {
    if (renameValue.trim()) { renameThread(id, renameValue.trim()); setThreads(loadChatThreads()); }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    setThreads(loadChatThreads());
    if (currentThreadId === id) handleNewChat();
  };

  const handleSaveQuote = () => {
    const saved = JSON.parse(localStorage.getItem("wisdom-saved-quotes") || "[]");
    if (!saved.includes(dailyQuote)) {
      saved.push(dailyQuote);
      localStorage.setItem("wisdom-saved-quotes", JSON.stringify(saved));
      setSavedQuote(true);
      toast({ title: "Intel saved." });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const currentMode = TUTOR_MODES.find(m => m.id === mode) || TUTOR_MODES[0];
  const hasMessages = messages.length > 0;
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");

  return (
    <div className="flex flex-col h-screen">
      {/* Command Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <OwlIcon size={18} />
          <span className="font-display text-sm font-bold text-primary tracking-wider">WISDOM OWL</span>
          <span className="text-[9px] font-mono text-muted-foreground tracking-widest ml-1">OS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <OwlHuntTracker />
          <span className="text-[10px] font-mono text-muted-foreground">
            {progress.tokens}<span className="text-primary ml-0.5">WT</span>
          </span>
          <span className="text-border">·</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            🔥{progress.streak}
          </span>
          <button onClick={() => { setThreads(loadChatThreads()); setShowHistory(!showHistory); }}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 hover:bg-surface-hover transition-colors ml-1">
            <History className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={() => setShowVault(!showVault)}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 hover:bg-surface-hover transition-colors">
            <PanelRight className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={handleNewChat}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 hover:bg-surface-hover transition-colors">
            <Plus className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card">
            <div className="px-4 py-3 max-h-56 overflow-y-auto hide-scrollbar">
              <p className="section-label mb-2">MISSION LOG</p>
              {threads.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground/50 py-4 text-center">No operations logged.</p>
              ) : (
                <div className="space-y-1">
                  {threads.slice(0, 20).map(t => (
                    <div key={t.id} className={`rounded p-2.5 flex items-center gap-2 transition-all cursor-pointer ${
                      currentThreadId === t.id ? "bg-primary/5 border border-primary/20" : "bg-surface-2 hover:bg-surface-hover border border-transparent"
                    }`}>
                      {renamingId === t.id ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(t.id)} onKeyDown={e => e.key === "Enter" && handleRename(t.id)}
                          className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none" autoFocus />
                      ) : (
                        <button onClick={() => handleOpenThread(t)} className="flex-1 text-left min-w-0">
                          <p className="text-xs font-mono text-foreground truncate">{t.title}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{t.messages.length} msgs</p>
                        </button>
                      )}
                      <button onClick={() => { setRenamingId(t.id); setRenameValue(t.title); }}
                        className="shrink-0 p-1 rounded hover:bg-surface-hover"><Pencil className="h-2.5 w-2.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(t.id)}
                        className="shrink-0 p-1 rounded hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5 text-muted-foreground" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Command Input + Thread */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Mode Bar */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
            <button onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 rounded bg-surface-2 px-2.5 py-1 text-[10px] font-mono text-muted-foreground hover:bg-surface-hover transition-colors">
              <span>{currentMode.icon}</span>
              <span className="uppercase tracking-wider">{currentMode.label}</span>
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showModes ? "rotate-180" : ""}`} />
            </button>
            {/* Kill/Scale Toggle */}
            <button onClick={() => setAggressiveMode(!aggressiveMode)}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-mono transition-all ${
                aggressiveMode
                  ? "bg-accent-red/10 text-accent-red border border-accent-red/20"
                  : "bg-surface-2 text-muted-foreground hover:bg-surface-hover border border-transparent"
              }`}>
              {aggressiveMode ? <Zap className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
              <span className="uppercase tracking-wider">{aggressiveMode ? "KILL" : "SCALE"}</span>
            </button>
          </div>

          <AnimatePresence>
            {showModes && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border/50">
                <div className="flex flex-wrap gap-1 p-3">
                  {TUTOR_MODES.map(m => (
                    <button key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }}
                      className={`rounded px-2.5 py-1 text-[10px] font-mono transition-all ${
                        mode === m.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
                      }`}>
                      {m.icon} {m.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Thread */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar">
            {!hasMessages && (
              <div className="flex flex-col items-start justify-center min-h-[50vh] pt-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="font-display text-lg font-bold text-foreground">{displayGreeting}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider">
                    {clock.dateStr} · {clock.timeStr}
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="mt-6 w-full max-w-md">
                  <div className="neon-border-gold rounded-lg p-4 bg-primary/[0.02]">
                    <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-1">DAILY INTEL</p>
                    <p className="text-sm font-mono italic text-muted-foreground leading-relaxed">"{dailyQuote}"</p>
                    <button onClick={handleSaveQuote}
                      className={`mt-2 text-[10px] font-mono transition-colors ${savedQuote ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      <Bookmark className="h-2.5 w-2.5 inline mr-1" />{savedQuote ? "SAVED" : "SAVE"}
                    </button>
                  </div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-[10px] font-mono text-muted-foreground/30 mt-6 tracking-wider">
                  AWAITING ORDERS_
                </motion.p>
              </div>
            )}

            {hasMessages && (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={msg.role === "user" ? "flex justify-end" : ""}>
                    {msg.role === "user" ? (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 bg-primary/10 border border-primary/20">
                        <p className="text-sm font-mono text-foreground">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 mt-1">
                          <OwlIcon size={12} />
                        </div>
                        <div className="flex-1 text-sm text-foreground/90 lg:hidden">
                          <BlueprintRenderer content={msg.content} aggressiveMode={aggressiveMode} />
                        </div>
                        {/* On desktop, assistant messages show only a summary; full render is on the right pane */}
                        <div className="flex-1 hidden lg:block">
                          <p className="text-xs font-mono text-muted-foreground">
                            Blueprint rendered →
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 mt-1">
                  <OwlIcon size={12} />
                </div>
                <div className="flex gap-1.5 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {isStreaming && (
            <div className="flex justify-center py-1.5 border-t border-border/50">
              <button onClick={handleStop} className="flex items-center gap-1.5 rounded bg-surface-2 px-3 py-1 text-[10px] font-mono text-muted-foreground hover:bg-surface-hover transition-colors">
                <Square className="h-2.5 w-2.5" /> ABORT
              </button>
            </div>
          )}
          {!isStreaming && hasMessages && messages[messages.length - 1]?.role === "assistant" && (
            <div className="flex justify-center py-1.5 border-t border-border/50">
              <button onClick={handleRegenerate} className="flex items-center gap-1.5 rounded bg-surface-2 px-3 py-1 text-[10px] font-mono text-muted-foreground hover:bg-surface-hover transition-colors">
                <RotateCcw className="h-2.5 w-2.5" /> REGENERATE
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3 pb-20 lg:pb-3 bg-card/50 shrink-0">
            <div className="flex items-end gap-2 rounded-lg border border-border bg-surface-2 p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Submit your plan for a stress test..."
                rows={1}
                className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 outline-none resize-none min-h-[36px] max-h-[120px] py-1.5 px-2"
                style={{ caretColor: "hsl(45, 90%, 55%)" }}
              />
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded bg-surface-hover hover:bg-muted transition-colors"
                  title="Voice input (coming soon)">
                  <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                  className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground disabled:opacity-20 transition-all hover:glow-gold">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Dynamic Blueprint Canvas (desktop only) */}
        <div className="hidden lg:flex lg:flex-col lg:w-[45%] xl:w-[50%] bg-background">
          <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">BLUEPRINT CANVAS</span>
            {lastAssistant && (
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                aggressiveMode ? "bg-accent-red/10 text-accent-red" : "bg-primary/10 text-primary"
              }`}>
                {aggressiveMode ? "AGGRESSIVE" : "STRATEGIC"}
              </span>
            )}
          </div>
          <div ref={blueprintRef} className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {lastAssistant ? (
              <BlueprintRenderer content={lastAssistant.content} aggressiveMode={aggressiveMode} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <OwlIcon size={32} className="opacity-10 mb-3" />
                <p className="text-xs font-mono text-muted-foreground/20 tracking-widest">NO ACTIVE BLUEPRINT</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vault Sidebar */}
      <VaultSidebar open={showVault} onClose={() => setShowVault(false)} />
    </div>
  );
}
