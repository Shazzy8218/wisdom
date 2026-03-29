import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Loader2, Brain, Zap, Target, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useGoals } from "@/hooks/useGoals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import { createThread, addMessageToThread } from "@/lib/chat-history";
import { hasLoaGoalPayload, extractGoalsFromLoaMessage } from "@/lib/loa-goals";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const LOA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loa-interview`;

const INTRO_MESSAGE = `**I am the Life Optimization Advisor.**

I'm not here to make you feel good. I'm here to make you *perform*.

I'm going to conduct a thorough diagnostic of your current life trajectory — your goals, your habits, your income, your time allocation, and every excuse you've been telling yourself.

At the end, you'll get a zero-bullshit action plan with specific, measurable goals that will be automatically loaded into your Goals dashboard.

**Let's begin.**

What is your ultimate life goal for the next 12 months? I need specifics — an income target, a lifestyle change, a skill you want to master. Not "be successful." Give me a number.`;

export default function LifeOptimizer() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { progress } = useProgress();
  const { goals } = useGoals();
  const { profile } = useUserProfile();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: INTRO_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [goalsExtracted, setGoalsExtracted] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Create a chat thread on mount to persist the conversation
  useEffect(() => {
    const thread = createThread("Life Optimization Session", "loa-session");
    setThreadId(thread.id);
    addMessageToThread(thread.id, "assistant", INTRO_MESSAGE);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const activateMissionControl = useCallback(async (content: string) => {
    try {
      const drafts = extractGoalsFromLoaMessage(content);
      let createdCount = 0;

      for (const draft of drafts) {
        try {
          await createGoal({
            title: draft.title,
            targetMetric: draft.targetMetric,
            targetValue: draft.targetValue,
            currentValue: draft.currentValue,
            baselineValue: draft.baselineValue,
            deadline: draft.deadline,
            why: draft.why,
            roadmap: draft.roadmap,
          });
          createdCount++;
        } catch (goalErr) {
          console.error("[LOA] Failed to create goal:", draft.title, goalErr);
        }
      }

      if (createdCount === 0) {
        throw new Error("No goals could be saved. Please try again.");
      }

      setGoalsExtracted(true);
      toast({
        title: `🎯 ${createdCount} goal${createdCount > 1 ? "s" : ""} created!`,
        description: "Navigating to Mission Control...",
      });

      setTimeout(() => {
        navigate("/goals", { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error("[LOA] activateMissionControl error:", err);
      throw err;
    }
  }, [navigate, createGoal]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Persist user message
    if (threadId) addMessageToThread(threadId, "user", userMsg.content);

    const masteryScores = (progress as any).masteryScores || {};
    const masteryValues = Object.values(masteryScores).map(Number).filter(Number.isFinite);
    const masteryAvg = masteryValues.length > 0
      ? Math.round(masteryValues.reduce((a: number, b: number) => a + b, 0) / masteryValues.length)
      : 0;

    const userContext = {
      displayName: profile?.displayName || "",
      streak: progress.streak,
      tokens: progress.tokens,
      masteryAvg,
      lessonsCompleted: ((progress as any).completedLessons || []).length,
      learningGoal: "",
      goalMode: "",
      existingGoals: goals.map(g => ({ title: g.title })),
    };

    let assistantContent = "";

    try {
      const resp = await fetch(LOA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
              scrollToBottom();
            }
          } catch {}
        }
      }

      // Persist assistant message
      if (threadId && assistantContent) {
        addMessageToThread(threadId, "assistant", assistantContent);
      }

      if (hasLoaGoalPayload(assistantContent)) {
        try {
          await activateMissionControl(assistantContent);
        } catch (activationError: any) {
          console.error("[LOA] Goal activation error:", activationError);
          toast({
            title: "Mission Control activation failed",
            description: activationError?.message || "Your plan was generated, but the goals could not be activated.",
            variant: "destructive",
          });
        }
      }
    } catch (e: any) {
      console.error("[LOA] Stream error:", e);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ""),
        { role: "assistant", content: "Connection interrupted. Please try sending your message again." },
      ]);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [activateMissionControl, goals, input, messages, profile, progress, scrollToBottom, streaming, threadId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const phase = messages.filter(m => m.role === "user").length;
  const phaseLabel = phase < 2 ? "Vision" : phase < 5 ? "Reality Check" : phase < 8 ? "Deep Dive" : phase < 10 ? "Truth Confrontation" : "Action Plan";
  const phaseProgress = Math.min(100, (phase / 10) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/goals")} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <h1 className="font-display text-sm font-bold text-foreground">Life Optimization Advisor</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{phaseLabel}</span>
              <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${phaseProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
          {goalsExtracted && (
            <button
              onClick={() => navigate("/goals")}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Target className="h-3 w-3" /> View Goals
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5 [&_strong]:text-primary">
                    <ReactMarkdown>
                      {msg.content.replace(/===GOALS_START===[\s\S]*===GOALS_END===/, "").trim() || (streaming && i === messages.length - 1 ? "..." : "")}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-card border border-border px-4 py-3 rounded-bl-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        {goalsExtracted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-sm rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground mb-1">Goals Loaded 🎯</p>
            <p className="text-xs text-muted-foreground mb-3">Your action plan has been imported into your Goals dashboard.</p>
            <button onClick={() => navigate("/goals")}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              View Goals Dashboard
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-lg px-4 py-3">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={goalsExtracted ? "Ask follow-up questions..." : "Be specific. Give me numbers..."}
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40 disabled:opacity-50 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
