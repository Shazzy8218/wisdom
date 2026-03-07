import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Trophy, Zap, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { generateGameQuestion } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";

interface Claim {
  text: string;
  isHallucination: boolean;
  explanation: string;
}

interface Question {
  id: string;
  passage: string;
  claims: Claim[];
  correctFeedback: string;
  incorrectFeedback: string;
  topic: string;
}

// Starter question for immediate play
const STARTER: Question = {
  id: "starter-1",
  passage: "The transformer architecture, which powers modern AI models like GPT, was invented by Google researchers in their landmark 2017 paper 'Attention Is All You Need.' The original model was designed primarily for machine translation and contained approximately 65 million parameters. Since then, models have scaled to billions of parameters, with GPT-4 reportedly containing over 1.8 trillion parameters across its mixture-of-experts architecture.",
  claims: [
    { text: "Transformers were invented by Google in 2017", isHallucination: false, explanation: "Correct — the 'Attention Is All You Need' paper was published by Google researchers in 2017." },
    { text: "The original transformer had 65 million parameters", isHallucination: true, explanation: "The original transformer had about 213 million parameters in its big version, not 65 million." },
    { text: "It was designed for machine translation", isHallucination: false, explanation: "Correct — the original transformer was indeed designed and tested primarily for machine translation tasks." },
    { text: "GPT-4 has 1.8 trillion parameters", isHallucination: true, explanation: "While GPT-4 is rumored to use a mixture-of-experts approach, the exact parameter count has not been officially confirmed by OpenAI. This specific number is unverified." },
  ],
  correctFeedback: "Sharp eye! You correctly identified the hallucination.",
  incorrectFeedback: "Not quite — look for specific numbers and unverified statistics.",
  topic: "AI Architecture",
};

export default function HallucinationHunter() {
  const [question, setQuestion] = useState<Question>(STARTER);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState(0);

  const loadNewQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const q = await generateGameQuestion({ gameType: "hallucination-hunter", difficulty: round <= 3 ? "beginner" : round <= 6 ? "intermediate" : "advanced" });
      setQuestion(q);
    } catch (err) {
      toast({ title: "Using backup question", description: "AI generation unavailable" });
      setQuestion(STARTER); // Fallback
    }
    setLoading(false);
  }, [round]);

  const toggleClaim = (idx: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    setSubmitted(true);
    const hallucinations = question.claims.map((c, i) => c.isHallucination ? i : -1).filter(i => i >= 0);
    const selectedArr = Array.from(selected);
    const correct = hallucinations.every(i => selectedArr.includes(i)) && selectedArr.every(i => hallucinations.includes(i));

    if (correct) {
      const bonus = streak >= 3 ? 5 : 0;
      const earned = 10 + bonus;
      setScore(s => s + earned);
      setStreak(s => s + 1);
      setTokens(t => t + earned);
    } else {
      setStreak(0);
    }
  };

  const handleNext = async () => {
    setSubmitted(false);
    setSelected(new Set());
    setRound(r => r + 1);
    await loadNewQuestion();
  };

  const hallucinations = question.claims.map((c, i) => c.isHallucination ? i : -1).filter(i => i >= 0);
  const selectedArr = Array.from(selected);
  const isCorrect = submitted && hallucinations.every(i => selectedArr.includes(i)) && selectedArr.every(i => hallucinations.includes(i));

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-foreground">Hallucination Hunter</h1>
          <p className="text-micro text-muted-foreground">Round {round} · Score: {score}</p>
        </div>
        {streak >= 2 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-xl bg-accent-gold/10 px-3 py-1.5">
            <Zap className="h-3 w-3 text-accent-gold" />
            <span className="text-micro font-bold text-accent-gold">{streak}x</span>
          </motion.div>
        )}
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <p className="text-body text-muted-foreground mt-4">Generating new challenge...</p>
        </div>
      ) : (
        <div className="px-5">
          {/* Instructions */}
          <p className="text-caption text-muted-foreground mb-4">
            Read the passage and <span className="text-primary font-semibold">tap all claims that are hallucinations</span> (false/unverified).
          </p>

          {/* Passage */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-5">
            <p className="section-label text-primary mb-2">{question.topic}</p>
            <p className="text-body leading-relaxed text-foreground">{question.passage}</p>
          </motion.div>

          {/* Claims */}
          <div className="space-y-2 mb-6">
            {question.claims.map((claim, idx) => {
              const isSelected = selected.has(idx);
              let borderClass = "border-border";
              let bgClass = "bg-surface-2";

              if (submitted) {
                if (claim.isHallucination && isSelected) { borderClass = "border-accent-green/50"; bgClass = "bg-accent-green/10"; }
                else if (claim.isHallucination && !isSelected) { borderClass = "border-accent-gold/50"; bgClass = "bg-accent-gold/10"; }
                else if (!claim.isHallucination && isSelected) { borderClass = "border-primary/50"; bgClass = "bg-primary/10"; }
                else { borderClass = "border-border"; bgClass = "bg-surface-2 opacity-50"; }
              } else if (isSelected) {
                borderClass = "border-primary/40"; bgClass = "bg-primary/10";
              }

              return (
                <motion.button key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }} onClick={() => toggleClaim(idx)}
                  disabled={submitted}
                  className={`w-full rounded-2xl border ${borderClass} ${bgClass} p-4 text-left text-body transition-all`}>
                  <p className="text-foreground">{claim.text}</p>
                  {submitted && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="text-caption text-muted-foreground mt-2 pt-2 border-t border-border/50">
                      {claim.explanation}
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Submit / Result */}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={selected.size === 0}
              className="w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-30 transition-opacity">
              Submit Answer
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className={`glass-card p-5 ${isCorrect ? "border-accent-green/30" : "border-primary/30"}`}>
                <p className={`font-display text-h3 ${isCorrect ? "text-accent-green" : "text-primary"}`}>
                  {isCorrect ? "Correct!" : "Not quite!"}
                </p>
                <p className="text-body text-muted-foreground mt-1">
                  {isCorrect ? question.correctFeedback : question.incorrectFeedback}
                </p>
                {isCorrect && tokens > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-caption text-accent-gold">
                    <Sparkles className="h-3.5 w-3.5" /> +{streak >= 3 ? 15 : 10} Wisdom Tokens {streak >= 3 && "(streak bonus!)"}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleNext} className="flex-1 rounded-2xl bg-primary py-3 text-body font-bold text-primary-foreground">
                  Next Question →
                </button>
                <button onClick={() => { setSubmitted(false); setSelected(new Set()); }}
                  className="rounded-2xl bg-surface-2 px-4 py-3 text-body text-muted-foreground hover:bg-surface-hover transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
