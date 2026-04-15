import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import ThoughtAura from "@/components/ThoughtAura";
import FeedbackBurst from "@/components/FeedbackBurst";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { buildOwlContext, saveFeedback } from "@/lib/owl-context";
import { resolvePersona, personaToSystemHint } from "@/lib/owl-persona";
import { getRecommendationContext } from "@/lib/analytics-engine";
import { useProactiveOwl } from "@/hooks/useProactiveOwl";
import { getSpeechRecognitionCtor } from "@/lib/owl-voice";
import { loadCachedProgress } from "@/lib/progress";
import OwlIcon from "@/components/OwlIcon";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback?: "up" | "down";
  feedbackAnim?: "positive" | "negative" | null;
}

export default function OwlWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isOnChatPage = location.pathname === "/" || location.pathname === "/chat";
  const { nudge, dismiss } = useProactiveOwl({ enabled: !isOpen && !isOnChatPage });

  const handleFeedback = useCallback((messageId: string, rating: "up" | "down") => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: rating, feedbackAnim: rating === "up" ? "positive" : "negative" } : m
    ));
    saveFeedback({ messageId, rating, timestamp: Date.now() });
    // Clear anim after burst
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedbackAnim: null } : m));
    }, 1000);
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: WidgetMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const progress = loadCachedProgress();
    const scores = progress.masteryScores || {};
    const vals = Object.values(scores) as number[];
    const masteryAvg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    // Check for recent negative feedback
    const hasNegativeFeedback = messages.some(m => m.feedback === "down");
    const sessionMins = parseInt(sessionStorage.getItem("wisdom-session-start") || "0", 10);
    const sessionDurationMins = sessionMins ? Math.round((Date.now() - sessionMins) / 60000) : 0;

    const owlContext = buildOwlContext({ screen: location.pathname, widget_mode: "true" });
    owlContext.recommendation_context = getRecommendationContext();
    const persona = resolvePersona({
      screen: location.pathname, masteryAvg, streak: progress.streak,
      hasActiveGoal: !!owlContext.learning_goal, lessonsToday: progress.lessonsToday,
      messageCount: messages.length, hasNegativeFeedback, sessionDurationMins,
    });
    owlContext.persona_hint = personaToSystemHint(persona);

    const chatHistory: Msg[] = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    chatHistory.push({ role: "user", content: text });

    await streamChat({
      messages: chatHistory, mode: "default", context: owlContext, signal: controller.signal,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("w-stream-"))
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          return [...prev, { id: `w-stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => { setIsStreaming(false); abortRef.current = null; },
      onError: (err) => {
        setMessages(prev => [...prev, { id: `w-err-${Date.now()}`, role: "assistant", content: `Error: ${err}` }]);
      },
    });
  }, [isStreaming, messages, location.pathname]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (isOnChatPage) return null;

  const handleOpen = () => { setIsOpen(true); dismiss(); setTimeout(() => inputRef.current?.focus(), 200); };
  const handleOpenFull = () => { setIsOpen(false); navigate("/"); };
  const handleNudgeTap = () => { if (!nudge) return; setIsOpen(true); dismiss(); setTimeout(() => sendMessage(nudge.prompt), 100); };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
            <div className="relative">
              {nudge && (
                <motion.button initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  onClick={handleNudgeTap}
                  className="absolute bottom-full right-0 mb-2 max-w-[240px] rounded-2xl border border-primary/20 bg-card px-3 py-2.5 text-left shadow-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{nudge.message}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(); }}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.button>
              )}
              <button onClick={handleOpen}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <ThoughtAura state={isListening ? "listening" : "idle"} size={56} className="absolute inset-0" />
                <OwlIcon size={24} className="relative z-10" />
              </button>
              {nudge && <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-destructive border-2 border-background animate-pulse" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-50 w-[340px] md:w-[380px] max-h-[70vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <ThoughtAura state={isStreaming ? "thinking" : isListening ? "listening" : "idle"} size={28} className="absolute -inset-0.5" />
                  <OwlIcon size={18} className="relative z-10" />
                </div>
                <span className="font-display text-sm font-bold text-foreground">Owl</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {location.pathname.slice(1) || "home"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleOpenFull} className="h-7 w-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors" title="Open full chat">
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => setIsOpen(false)} className="h-7 w-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px] max-h-[50vh]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <OwlIcon size={32} />
                  <p className="mt-3 text-sm text-muted-foreground">Ask me anything about what you're working on.</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <OwlIcon size={12} />
                    </div>
                  )}
                    <div className="relative flex flex-col gap-1 max-w-[85%]">
                     <FeedbackBurst type={msg.feedbackAnim ?? null} />
                     <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-xs dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : <span>{msg.content}</span>}
                    </div>
                    {/* Feedback buttons for assistant messages */}
                    {msg.role === "assistant" && !msg.id.startsWith("w-err-") && !isStreaming && (
                      <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                        <button
                          onClick={() => handleFeedback(msg.id, "up")}
                          className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                            msg.feedback === "up" ? "text-primary bg-primary/15 scale-110" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                          }`}
                          title="Good response">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "down")}
                          className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                            msg.feedback === "down" ? "text-destructive bg-destructive/15 scale-110" : "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                          }`}
                          title="Poor response">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><OwlIcon size={12} /></div>
                  <div className="bg-card border border-border/50 rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/50 px-3 py-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2">
                <button onClick={toggleMic}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isListening ? "bg-destructive/10 text-destructive animate-pulse" : "hover:bg-muted/50 text-muted-foreground"
                  }`}>
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
                <textarea ref={inputRef} value={input}
                  onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask Owl…"
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none resize-none max-h-[80px] leading-relaxed" />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-20 transition-opacity">
                  {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
