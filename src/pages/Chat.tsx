import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, RotateCcw, ChevronDown, Plus, History, Pencil, Trash2, Bookmark, Mic, FolderOpen, Zap, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
import CanvasPanel, { type CanvasIntent } from "@/components/canvas/CanvasPanel";
import ProjectsPanel from "@/components/ProjectsPanel";
import { detectIntent, detectResponseIntent } from "@/lib/canvas-parser";
import type { Project } from "@/lib/projects";

const TUTOR_MODES = [
  { id: "default", label: "Teach Me", icon: "📖" },
  { id: "explain-10", label: "ELI10", icon: "🧒" },
  { id: "fast-answer", label: "Fast", icon: "⚡" },
  { id: "deep-dive", label: "Deep Dive", icon: "🔬" },
  { id: "socratic", label: "Socratic", icon: "🤔" },
  { id: "drills", label: "Drills", icon: "💪" },
  { id: "workflow", label: "Workflow", icon: "🔗" },
  { id: "fix-prompt", label: "Fix Prompt", icon: "🔧" },
  { id: "task", label: "Task Mode", icon: "🎯" },
  { id: "quote-teach", label: "Quotes", icon: "💎" },
];

const QUICK_ACTIONS = [
  { label: "Write / Rewrite", prompt: "Help me write or rewrite: ", icon: "✍️" },
  { label: "Plan", prompt: "Help me create a plan for: ", icon: "📋" },
  { label: "Fix / Improve", prompt: "Help me fix or improve: ", icon: "🔧" },
  { label: "Learn this", prompt: "Teach me about: ", icon: "📖" },
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
  microChallenge?: string;
  challengeDone?: boolean;
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
  const [showProjects, setShowProjects] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [savedQuote, setSavedQuote] = useState(false);
  const [canvasIntent, setCanvasIntent] = useState<CanvasIntent>(null);
  const [canvasContent, setCanvasContent] = useState("");
  const [isRanting, setIsRanting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSentRef = useRef(false);

  const clock = useLiveClock();
  const { profile } = useUserProfile();
  const { progress, update } = useProgress();
  const [dailyQuote] = useState(() => getDailyQuote());

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  useEffect(() => { setThreads(loadChatThreads()); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (contextParam && autoSendParam === "true" && !autoSentRef.current) {
      autoSentRef.current = true;
      const decoded = decodeURIComponent(contextParam);
      setInput("");
      const thread = createThread("Lesson Q&A", lessonIdParam || undefined);
      setCurrentThreadId(thread.id);
      setTimeout(() => sendMessage(decoded, thread.id), 500);
    }
  }, [contextParam, autoSendParam]);

  const sendMessage = useCallback(async (text: string, threadId?: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Detect intent from user message for canvas
    const intent = detectIntent(text);
    setCanvasIntent(intent);
    setCanvasContent(""); // skeleton state

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

    // Add micro-challenge instruction to context
    const context = {
      ...getUserProfileForAI(),
      canvas_intent: intent,
      instruction_suffix: "ALWAYS end your response with a '## 🎯 Next Move' section containing: 1) one specific micro-action (5-15 min), 2) a time-box estimate. Keep it actionable.",
    };

    await streamChat({
      messages: newMessages.map(({ role, content }) => ({ role, content })),
      mode,
      context,
      onDelta: (chunk) => {
        assistantContent += chunk;
        // Update canvas in real-time
        setCanvasContent(assistantContent);
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
        // Detect best canvas from response
        if (assistantContent) {
          const responseIntent = detectResponseIntent(assistantContent);
          setCanvasIntent(responseIntent);
          setCanvasContent(assistantContent);
        }
        // Extract micro-challenge
        const challengeMatch = assistantContent.match(/##\s*🎯\s*Next Move[\s\S]*$/i);
        if (challengeMatch) {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant"
              ? { ...m, microChallenge: challengeMatch[0], challengeDone: false }
              : m
          ));
        }
        if (assistantContent && tid) {
          addMessageToThread(tid, "assistant", assistantContent);
          setThreads(loadChatThreads());
          if (mode === "task") {
            const lastUserMsg = newMessages.filter(m => m.role === "user").pop();
            parseAndSaveWisdomPack(assistantContent, lastUserMsg?.content || text);
          }
        }
      },
      onError: (err) => toast({ title: "AI Error", description: err, variant: "destructive" }),
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
    setCanvasContent("");
    const lastUserMsg = trimmed[trimmed.length - 1];
    if (lastUserMsg) {
      const intent = detectIntent(lastUserMsg.content);
      setCanvasIntent(intent);
    }
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
        setCanvasContent(assistantContent);
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
        if (assistantContent) {
          setCanvasIntent(detectResponseIntent(assistantContent));
        }
      },
      onError: (err) => toast({ title: "AI Error", description: err, variant: "destructive" }),
      signal: controller.signal,
    });
  }, [isStreaming, messages, mode]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentThreadId(null);
    setShowHistory(false);
    setCanvasIntent(null);
    setCanvasContent("");
    autoSentRef.current = false;
  };

  const handleOpenThread = (thread: ChatThread) => {
    setCurrentThreadId(thread.id);
    setMessages(thread.messages.map(m => ({ id: m.id, role: m.role, content: m.content })));
    setShowHistory(false);
    // Show canvas for last assistant message
    const lastAssistant = [...thread.messages].reverse().find(m => m.role === "assistant");
    if (lastAssistant) {
      setCanvasIntent(detectResponseIntent(lastAssistant.content));
      setCanvasContent(lastAssistant.content);
    }
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
      toast({ title: "Quote saved!" });
    }
  };

  const handleRantMode = () => {
    setIsRanting(true);
    setInput("");
    toast({ title: "🎙 Rant Mode", description: "Type your rant (voice coming soon). Owl will structure it into an action plan." });
  };

  const handleRantSubmit = () => {
    if (!input.trim()) return;
    setIsRanting(false);
    const rantPrompt = `RANT MODE: The user just brain-dumped the following. Parse it and return EXACTLY:

1) **ACTION TABLE** in markdown table format: | Action | Deadline | Priority | Status |
2) **LOGIC FLOW** — a simple decision/process flow with numbered steps
3) **💎 WISDOM LINE** — one memorable quote takeaway
4) **🎯 MICRO-CHALLENGE** — one doable next move (5-15 min)

Here is the rant:
"${input}"`;
    setMode("task");
    sendMessage(rantPrompt);
  };

  const handleChallengeDone = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, challengeDone: true } : m
    ));
    // Award tokens + update streak
    update(p => ({
      ...p,
      tokens: p.tokens + 5,
      xp: p.xp + 10,
    }));
    toast({ title: "✅ Challenge complete!", description: "+5 tokens, +10 XP" });
  };

  const handleConvertToBlueprint = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return;
    sendMessage(`Convert this into a structured blueprint with clear steps, KPIs, and deadlines:\n\n${lastAssistant.content.slice(0, 1500)}`);
  };

  const handleProjectInsert = (project: Project) => {
    setShowProjects(false);
    setInput(`Help me with my project "${project.name}". Goal: ${project.goal}. What should I do next?`);
  };

  const currentMode = TUTOR_MODES.find(m => m.id === mode) || TUTOR_MODES[0];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen relative">
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <OwlIcon size={20} />
          <span className="font-display text-lg font-bold text-foreground">Owl</span>
          {canvasIntent && (
            <span className="text-micro bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
              Canvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <OwlHuntTracker />
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <span>✦ {progress.tokens}</span>
            <span>·</span>
            <span>🔥 {progress.streak}</span>
          </div>
          <button onClick={() => setShowProjects(!showProjects)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => { setThreads(loadChatThreads()); setShowHistory(!showHistory); }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chat History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card shrink-0">
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

      {/* Conversation Thread (compact) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 hide-scrollbar min-h-0">
        {/* Empty state = Chat Home */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center min-h-[55vh]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-5">
              <p className="font-display text-xl font-bold text-foreground">{displayGreeting}</p>
              <p className="text-micro text-muted-foreground mt-1">{clock.dateStr} · {clock.timeStr}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="w-full max-w-sm mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-caption italic text-muted-foreground leading-relaxed">"{dailyQuote}"</p>
                <button onClick={handleSaveQuote}
                  className={`mt-2 text-micro font-medium transition-colors ${savedQuote ? "text-accent-gold" : "text-text-tertiary hover:text-muted-foreground"}`}>
                  <Bookmark className="h-3 w-3 inline mr-1" />{savedQuote ? "Saved" : "Save"}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-2 w-full max-w-sm mb-3">
              {QUICK_ACTIONS.map(action => (
                <button key={action.label} onClick={() => setInput(action.prompt)}
                  className="glass-card p-3 text-caption font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all text-left flex items-center gap-2">
                  <span>{action.icon}</span> {action.label}
                </button>
              ))}
            </motion.div>

            {/* Rant + Blueprint buttons */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="flex gap-2 w-full max-w-sm mb-4">
              <button onClick={handleRantMode}
                className="flex-1 glass-card p-2.5 text-micro font-medium text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Rant Mode
              </button>
              <button onClick={() => setShowProjects(true)}
                className="flex-1 glass-card p-2.5 text-micro font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" /> Projects
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button onClick={() => setShowModes(!showModes)}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
                <span>{currentMode.icon}</span>
                <span>{currentMode.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showModes ? "rotate-180" : ""}`} />
              </button>
            </motion.div>

            <AnimatePresence>
              {showModes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2">
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
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
        )}

        {/* Active Chat Messages — compact thread */}
        {hasMessages && (
          <>
            {!showModes && (
              <div className="flex justify-center mb-1">
                <button onClick={() => setShowModes(!showModes)}
                  className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
                  <span>{currentMode.icon}</span> <span>{currentMode.label}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            <AnimatePresence>
              {showModes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-2">
                  <div className="flex flex-wrap gap-1.5 justify-center">
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

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                      <OwlIcon size={14} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-caption leading-relaxed ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-2.5 [&_pre]:rounded-xl [&_strong]:text-foreground [&_table]:text-micro [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_blockquote]:border-l-primary [&_blockquote]:text-primary/80">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-caption">{msg.content}</p>
                    )}
                    {/* Micro-Challenge Done button */}
                    {msg.microChallenge && !msg.challengeDone && (
                      <button onClick={() => handleChallengeDone(msg.id)}
                        className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 px-3 py-1.5 text-micro font-medium text-accent-green hover:bg-accent-green/20 transition-colors">
                        <CheckCircle className="h-3 w-3" /> Done — claim reward
                      </button>
                    )}
                    {msg.challengeDone && (
                      <p className="mt-2 text-micro text-accent-green flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Completed +5 ✦
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                  <OwlIcon size={14} />
                </div>
                <div className="bg-card border border-border rounded-2xl px-3.5 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Dynamic Canvas Panel */}
      {hasMessages && (
        <CanvasPanel
          intent={canvasIntent}
          content={canvasContent}
          onClose={() => setCanvasIntent(null)}
        />
      )}

      {/* Action bar for active chat */}
      {!isStreaming && hasMessages && messages[messages.length - 1]?.role === "assistant" && (
        <div className="flex justify-center gap-2 py-1.5 shrink-0">
          <button onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </button>
          <button onClick={handleConvertToBlueprint}
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-micro text-primary hover:bg-primary/10 transition-colors">
            <Zap className="h-3 w-3" /> Blueprint
          </button>
        </div>
      )}

      {isStreaming && (
        <div className="flex justify-center py-1.5 shrink-0">
          <button onClick={handleStop}
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
            <Square className="h-3 w-3" /> Stop
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-5 py-3 pb-24 bg-background shrink-0">
        {isRanting ? (
          <div className="space-y-2">
            <p className="text-micro text-primary font-medium">🎙 Rant Mode — brain dump everything, Owl will structure it</p>
            <div className="flex items-end gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Just dump everything on your mind…"
                rows={3}
                className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none resize-none" autoFocus />
              <button onClick={handleRantSubmit} disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setIsRanting(false)} className="text-micro text-muted-foreground hover:text-foreground transition-colors">
              Cancel rant mode
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <button onClick={handleRantMode}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
              <Mic className="h-3.5 w-3.5 text-primary" />
            </button>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Tell Owl what you want done…"
              className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
            <button onClick={handleSend} disabled={!input.trim() || isStreaming}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity">
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Projects Panel (overlay) */}
      <ProjectsPanel open={showProjects} onClose={() => setShowProjects(false)} onInsertProject={handleProjectInsert} />
    </div>
  );
}
