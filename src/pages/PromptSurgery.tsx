import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, RotateCcw, Scissors } from "lucide-react";
import { Link } from "react-router-dom";

interface SurgeryQuestion {
  bloatedPrompt: string;
  segments: { text: string; isFluff: boolean; explanation: string }[];
  topic: string;
}

const QUESTIONS: SurgeryQuestion[] = [
  {
    topic: "Email Writing",
    bloatedPrompt: "I was wondering if you could possibly help me write an email for my business...",
    segments: [
      { text: "I was wondering if you could possibly", isFluff: true, explanation: "Unnecessary hedging — AI always helps, no need to ask permission." },
      { text: "help me write", isFluff: false, explanation: "Core action — this is the task." },
      { text: "a professional follow-up email", isFluff: false, explanation: "Specific type of email — keeps it focused." },
      { text: "that is really good and impressive", isFluff: true, explanation: "Vague quality words — specify what 'good' means instead (concise, persuasive, etc.)." },
      { text: "to a potential client who hasn't responded in 2 weeks", isFluff: false, explanation: "Essential context — defines the situation." },
      { text: "I think it should probably be", isFluff: true, explanation: "More hedging — just state the requirement directly." },
      { text: "under 100 words with a clear CTA", isFluff: false, explanation: "Useful constraints — length limit and structural requirement." },
      { text: "if that makes sense and isn't too much trouble", isFluff: true, explanation: "Apologetic filler — adds nothing to the output quality." },
    ],
  },
  {
    topic: "Content Strategy",
    bloatedPrompt: "So basically what I need is for you to create some content ideas...",
    segments: [
      { text: "So basically what I need is for you to", isFluff: true, explanation: "Filler opening — jump straight to the task." },
      { text: "create 10 LinkedIn post ideas", isFluff: false, explanation: "Clear task with specific quantity and platform." },
      { text: "that are really really engaging and viral", isFluff: true, explanation: "Subjective buzzwords — specify what engagement means (comments, shares, saves)." },
      { text: "for a B2B cybersecurity company", isFluff: false, explanation: "Essential context — industry and audience type." },
      { text: "I guess maybe you could also", isFluff: true, explanation: "Uncertain filler — state requirements confidently." },
      { text: "include a hook line and content type for each", isFluff: false, explanation: "Clear format requirement — structures the output." },
      { text: "targeting CISOs and IT directors", isFluff: false, explanation: "Specific audience — crucial for tone and content relevance." },
      { text: "or whatever you think is best honestly", isFluff: true, explanation: "Defers control to AI — you should set the direction." },
    ],
  },
];

export default function PromptSurgery() {
  const [qIdx, setQIdx] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);

  const question = QUESTIONS[qIdx % QUESTIONS.length];

  const toggleSegment = (idx: number) => {
    if (submitted) return;
    setTapped(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    if (tapped.size === 0) return;
    setSubmitted(true);
    const fluffIndices = question.segments.map((s, i) => s.isFluff ? i : -1).filter(i => i >= 0);
    const tappedArr = Array.from(tapped);
    const perfect = fluffIndices.every(i => tappedArr.includes(i)) && tappedArr.every(i => fluffIndices.includes(i));
    if (perfect) {
      setScore(s => s + 15);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const fluffIndices = question.segments.map((s, i) => s.isFluff ? i : -1).filter(i => i >= 0);
  const tappedArr = Array.from(tapped);
  const isPerfect = submitted && fluffIndices.every(i => tappedArr.includes(i)) && tappedArr.every(i => fluffIndices.includes(i));

  const handleNext = () => {
    setQIdx(q => q + 1);
    setTapped(new Set());
    setSubmitted(false);
    setRound(r => r + 1);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-foreground">Prompt Surgery</h1>
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

      <div className="px-5">
        <p className="text-caption text-muted-foreground mb-4">
          <Scissors className="h-3.5 w-3.5 inline mr-1 text-primary" />
          Tap all the <span className="text-primary font-semibold">fluff segments</span> that should be removed.
        </p>

        <div className="glass-card p-4 mb-5">
          <p className="section-label text-primary mb-2">{question.topic}</p>
          <div className="flex flex-wrap gap-1">
            {question.segments.map((seg, idx) => {
              const isTapped = tapped.has(idx);
              let classes = "bg-surface-2 text-foreground border-border";
              if (submitted) {
                if (seg.isFluff && isTapped) classes = "bg-accent-green/10 text-accent-green border-accent-green/30 line-through opacity-60";
                else if (seg.isFluff && !isTapped) classes = "bg-accent-gold/10 text-accent-gold border-accent-gold/30";
                else if (!seg.isFluff && isTapped) classes = "bg-primary/10 text-primary border-primary/30";
                else classes = "bg-surface-2 text-foreground border-border";
              } else if (isTapped) {
                classes = "bg-primary/15 text-primary border-primary/30 line-through";
              }

              return (
                <motion.button key={idx}
                  whileTap={!submitted ? { scale: 0.95 } : undefined}
                  onClick={() => toggleSegment(idx)}
                  disabled={submitted}
                  className={`rounded-xl border px-2.5 py-1.5 text-caption transition-all ${classes}`}>
                  {seg.text}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Explanations after submit */}
        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 mb-5">
            {question.segments.map((seg, idx) => (
              <div key={idx} className={`rounded-xl p-2.5 text-micro ${seg.isFluff ? "bg-primary/5 text-muted-foreground" : "bg-surface-2 text-text-tertiary"}`}>
                <span className={`font-semibold ${seg.isFluff ? "text-primary" : "text-accent-green"}`}>
                  {seg.isFluff ? "✂ Fluff" : "✓ Keep"}:
                </span> {seg.explanation}
              </div>
            ))}
          </motion.div>
        )}

        {!submitted ? (
          <button onClick={handleSubmit} disabled={tapped.size === 0}
            className="w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-30 transition-opacity">
            Cut the Fluff
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className={`glass-card p-5 ${isPerfect ? "border-accent-green/30" : "border-primary/30"}`}>
              <p className={`font-display text-h3 ${isPerfect ? "text-accent-green" : "text-primary"}`}>
                {isPerfect ? "Clean cut!" : "Close, but missed some!"}
              </p>
              {isPerfect && (
                <div className="flex items-center gap-1.5 mt-2 text-caption text-accent-gold">
                  <Sparkles className="h-3.5 w-3.5" /> +15 Wisdom Tokens
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleNext} className="flex-1 rounded-2xl bg-primary py-3 text-body font-bold text-primary-foreground">
                Next Surgery →
              </button>
              <button onClick={() => { setTapped(new Set()); setSubmitted(false); }}
                className="rounded-2xl bg-surface-2 px-4 py-3 text-body text-muted-foreground hover:bg-surface-hover transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
