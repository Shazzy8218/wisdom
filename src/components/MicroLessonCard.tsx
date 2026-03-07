import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, Bookmark, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLessonCardProps {
  lesson: {
    id: string;
    title: string;
    hook: string;
    track: string;
    difficulty: string;
    xp: number;
    tokens: number;
    content: string;
    tryPrompt: string;
    interaction: string;
    options?: string[];
    correctAnswer?: number;
  };
}

export default function MicroLessonCard({ lesson }: MicroLessonCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === lesson.correctAnswer) {
      setTimeout(() => setCompleted(true), 600);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">{lesson.track}</span>
          <span className="text-text-tertiary">·</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{lesson.difficulty}</span>
        </div>
        <h3 className="font-display text-lg font-bold leading-tight text-foreground">{lesson.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.hook}</p>
      </div>

      <div className="editorial-divider mx-5" />

      {/* Content */}
      <div className="p-5">
        {lesson.interaction === "tap-reveal" && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-xl bg-secondary p-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            Tap to reveal the lesson →
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed text-text-secondary"
          >
            {lesson.content}
          </motion.div>
        )}

        {/* Choice interaction */}
        {lesson.interaction === "choice" && lesson.options && (
          <div className="mt-4 space-y-2">
            {lesson.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                  selectedOption === null
                    ? "border-border bg-secondary hover:border-primary/30 hover:bg-surface-hover"
                    : selectedOption === idx
                    ? idx === lesson.correctAnswer
                      ? "border-accent-green/50 bg-accent-green/10 text-foreground"
                      : "border-destructive/50 bg-destructive/10"
                    : idx === lesson.correctAnswer && selectedOption !== null
                    ? "border-accent-green/50 bg-accent-green/10"
                    : "border-border bg-secondary opacity-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Try It Now */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Try It Now</p>
          <p className="text-sm text-muted-foreground">{lesson.tryPrompt}</p>
        </div>
      </div>

      <div className="editorial-divider mx-5" />

      {/* Footer */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
            +{lesson.tokens} tokens
          </span>
          <span className="text-xs text-muted-foreground">+{lesson.xp} XP</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
            <Bookmark className="h-4 w-4" />
          </button>
          {completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="h-5 w-5 text-accent-green" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
