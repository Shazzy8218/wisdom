// THE KNOWLEDGE NEXUS — Wisdom Spark micro-challenge component
// Voice (ElevenLabs Scribe realtime) + text fallback. Auto-grades via edge function.
// Awards tokens + tracks streak in useProgress.

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, X, Loader2, CheckCircle2, AlertCircle, Volume2, Flame } from "lucide-react";
import { useScribe } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useProgress } from "@/hooks/useProgress";
import { useGoals } from "@/hooks/useGoals";
import { toast } from "@/hooks/use-toast";
import { requestOwlReplay } from "@/lib/owl-voice";
import ThoughtAura from "@/components/ThoughtAura";

interface SparkContext {
  moduleId: string;
  moduleTitle: string;
  sectionHeading: string;
  sectionBody: string;
  operatorMove?: string;
  doctrineHint?: string;
}

interface SparkData {
  question: string;
  contextHint: string;
  idealAnswerSummary: string;
}

interface GradingResult {
  score: number;
  verdict: "miss" | "directional" | "sharp" | "operator";
  feedback: string;
  nextStep: string;
}

interface Props {
  context: SparkContext;
  onClose: () => void;
  onComplete?: (graded: GradingResult) => void;
}

const SPARK_STREAK_KEY = "wisdom-spark-streak-v1";

interface SparkStreak {
  current: number;
  best: number;
  lastDate: string;
}

function readStreak(): SparkStreak {
  try {
    const raw = localStorage.getItem(SPARK_STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { current: 0, best: 0, lastDate: "" };
}

function writeStreak(s: SparkStreak) {
  try { localStorage.setItem(SPARK_STREAK_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export default function WisdomSpark({ context, onClose, onComplete }: Props) {
  const { update } = useProgress();
  const { primaryGoal } = useGoals();
  const [phase, setPhase] = useState<"loading" | "ready" | "answering" | "grading" | "graded" | "error">("loading");
  const [spark, setSpark] = useState<SparkData | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [answer, setAnswer] = useState("");
  const [grading, setGrading] = useState<GradingResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scribeError, setScribeError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Realtime scribe
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad" as never,
    onPartialTranscript: (data: { text: string }) => {
      setAnswer(data.text);
    },
    onCommittedTranscript: (data: { text: string }) => {
      setAnswer(prev => {
        const trimmed = (prev || "").trim();
        if (!trimmed) return data.text;
        if (trimmed.endsWith(data.text.trim())) return trimmed;
        return `${trimmed} ${data.text}`.trim();
      });
    },
  } as never);

  /* Generate the Spark on mount */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("nexus-wisdom-spark", {
          body: {
            action: "generate",
            moduleTitle: context.moduleTitle,
            sectionHeading: context.sectionHeading,
            sectionBody: context.sectionBody,
            operatorMove: context.operatorMove,
            doctrineHint: context.doctrineHint,
            userGoal: primaryGoal?.title,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setSpark(data);
        setPhase("ready");
        // Voice the question
        if (data?.question) {
          const voiceText = data.contextHint ? `${data.contextHint} ${data.question}` : data.question;
          requestOwlReplay(voiceText, true);
        }
      } catch (err) {
        console.error("Spark generate error", err);
        setErrMsg(err instanceof Error ? err.message : "Could not generate challenge.");
        setPhase("error");
      }
    })();

    return () => {
      // Disconnect on unmount
      try { (scribe.disconnect() as unknown as Promise<void>)?.catch?.(() => {}); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Voice capture controls */
  const startRecording = useCallback(async () => {
    setScribeError(null);
    try {
      // Permission check
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token
      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (tokenErr) throw tokenErr;
      if (!tokenData?.token) throw new Error("No transcription token received.");

      await scribe.connect({
        token: tokenData.token,
        microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setIsRecording(true);
      setPhase("answering");
    } catch (err) {
      console.error("Scribe start error", err);
      setScribeError(err instanceof Error ? err.message : "Microphone unavailable.");
      toast({ title: "Voice unavailable", description: "Type your answer instead.", variant: "destructive" });
    }
  }, [scribe]);

  const stopRecording = useCallback(async () => {
    try {
      const r = scribe.disconnect() as unknown;
      if (r && typeof (r as Promise<void>).then === "function") await (r as Promise<void>);
    } catch { /* ignore */ }
    setIsRecording(false);
  }, [scribe]);

  /* Submit for grading */
  const submit = useCallback(async () => {
    if (!spark) return;
    const trimmed = answer.trim();
    if (!trimmed) {
      toast({ title: "Empty answer", description: "Speak or type your move.", variant: "destructive" });
      return;
    }
    if (isRecording) await stopRecording();

    setPhase("grading");
    try {
      const { data, error } = await supabase.functions.invoke("nexus-wisdom-spark", {
        body: {
          action: "grade",
          question: spark.question,
          contextHint: spark.contextHint,
          idealAnswerSummary: spark.idealAnswerSummary,
          userAnswer: trimmed,
          moduleTitle: context.moduleTitle,
          sectionHeading: context.sectionHeading,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const graded: GradingResult = {
        score: Number(data.score) || 0,
        verdict: data.verdict || "miss",
        feedback: String(data.feedback || ""),
        nextStep: String(data.nextStep || ""),
      };
      setGrading(graded);
      setPhase("graded");

      // Streak + reward
      const streak = readStreak();
      const today = new Date().toISOString().slice(0, 10);
      const success = graded.score >= 50;

      let newStreak = streak;
      if (success) {
        if (streak.lastDate === today) {
          newStreak = { ...streak, current: streak.current + 1, best: Math.max(streak.best, streak.current + 1), lastDate: today };
        } else {
          // continued from previous day or fresh
          const wasYesterday = (() => {
            try {
              const y = new Date(); y.setDate(y.getDate() - 1);
              return streak.lastDate === y.toISOString().slice(0, 10);
            } catch { return false; }
          })();
          const next = wasYesterday ? streak.current + 1 : 1;
          newStreak = { current: next, best: Math.max(streak.best, next), lastDate: today };
        }
      } else {
        // miss does NOT reset; we only reset after a full day with no successful spark
        newStreak = streak;
      }
      writeStreak(newStreak);

      // Token reward
      const reward = graded.score >= 90 ? 8 : graded.score >= 75 ? 5 : graded.score >= 50 ? 3 : 1;
      update(p => ({
        ...p,
        tokens: (p.tokens || 0) + reward,
        xp: (p.xp || 0) + reward * 2,
        tokenHistory: [
          ...(p.tokenHistory || []),
          { action: `Wisdom Spark · ${graded.verdict}`, amount: reward, date: new Date().toISOString() },
        ],
      }));

      // Voice the feedback
      const verdictWord = graded.verdict === "operator" ? "Operator-level."
                        : graded.verdict === "sharp" ? "Sharp."
                        : graded.verdict === "directional" ? "Directionally correct."
                        : "Miss.";
      requestOwlReplay(`${verdictWord} ${graded.feedback}`, true);

      onComplete?.(graded);
    } catch (err) {
      console.error("Spark grade error", err);
      setErrMsg(err instanceof Error ? err.message : "Grading failed.");
      setPhase("error");
    }
  }, [spark, answer, isRecording, stopRecording, context, update, onComplete]);

  const verdictColor = grading
    ? grading.verdict === "operator" ? "text-accent-gold"
    : grading.verdict === "sharp" ? "text-accent-green"
    : grading.verdict === "directional" ? "text-primary"
    : "text-rose-400"
    : "text-foreground";

  const auraState: "idle" | "listening" | "thinking" | "speaking" =
    phase === "loading" || phase === "grading" ? "thinking"
    : isRecording ? "listening"
    : phase === "graded" ? "speaking"
    : "idle";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        className="relative w-full max-w-md glass-card border border-primary/30 shadow-2xl rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-3 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent-gold/[0.05] border-b border-border/40">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 h-8 w-8 rounded-xl bg-background/60 hover:bg-background flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ThoughtAura state={auraState} size={40} />
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Wisdom Spark · 60-second decision</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{context.sectionHeading}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {phase === "loading" && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Shazzy-Owl is composing your challenge…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="py-6 flex flex-col items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <p className="text-sm text-foreground text-center">{errMsg}</p>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground underline">Close</button>
            </div>
          )}

          {(phase === "ready" || phase === "answering" || phase === "grading") && spark && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Scenario</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{spark.contextHint}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1.5">Your call</p>
                <p className="text-sm text-foreground font-medium leading-relaxed">{spark.question}</p>
              </div>

              {/* Replay voice */}
              <button
                onClick={() => requestOwlReplay(spark.contextHint ? `${spark.contextHint} ${spark.question}` : spark.question, true)}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Volume2 className="h-3 w-3" /> Replay
              </button>

              {/* Answer area */}
              <div className="space-y-2">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={isRecording ? "Listening…" : "Speak or type your answer (1–3 sentences)…"}
                  className="w-full min-h-[88px] rounded-xl bg-surface-2 border border-border focus:border-primary/40 outline-none p-3 text-sm text-foreground resize-none"
                  disabled={phase === "grading"}
                />
                {scribeError && <p className="text-[10px] text-rose-400">{scribeError}</p>}

                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={phase === "grading"}
                      className="flex items-center gap-1.5 rounded-xl bg-surface-2 hover:bg-surface-hover px-3 py-2 text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
                    >
                      <Mic className="h-3.5 w-3.5 text-primary" /> Voice
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors"
                    >
                      <MicOff className="h-3.5 w-3.5" /> Stop
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                    </button>
                  )}
                  <button
                    onClick={submit}
                    disabled={!answer.trim() || phase === "grading"}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {phase === "grading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {phase === "grading" ? "Grading…" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "graded" && grading && (
            <AnimatePresence>
              <motion.div
                key="graded"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${verdictColor}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${verdictColor}`}>
                      {grading.verdict}
                    </p>
                  </div>
                  <p className={`font-display text-2xl font-black ${verdictColor}`}>{grading.score}<span className="text-xs text-muted-foreground font-normal">/100</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Shazzy-Owl</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{grading.feedback}</p>
                </div>
                <div className="glass-card p-3 border border-primary/15 bg-primary/[0.04]">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Next move</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{grading.nextStep}</p>
                </div>
                <SparkStreakDisplay />
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-bold hover:opacity-90"
                >
                  Continue
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SparkStreakDisplay() {
  const [streak] = useState(() => readStreak());
  if (streak.current <= 0) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-amber-400">
      <Flame className="h-3.5 w-3.5" />
      Spark streak: {streak.current} {streak.current > 1 ? "in a row" : ""} · best {streak.best}
    </div>
  );
}
