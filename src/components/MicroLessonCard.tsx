import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, Bookmark, CheckCircle2 } from "lucide-react";

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
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label text-primary">{lesson.track}</span>
          <span className="text-text-tertiary text-micro">·</span>
          <span className="section-label">{lesson.difficulty}</span>
        </div>
        <h3 className="font-display text-h3 text-foreground leading-tight">{lesson.title}</h3>
        <p className="mt-2 text-body text-muted-foreground">{lesson.hook}</p>
      </div>

      <div className="editorial-divider mx-6" />

      {/* Content */}
      <div className="p-6">
        {lesson.interaction === "tap-reveal" && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-2xl bg-surface-2 p-5 text-center text-body font-medium text-muted-foreground transition-colors hover:bg-surface-hover border border-border"
          >
            Tap to reveal the lesson →
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-body leading-relaxed text-text-secondary"
          >
            {lesson.content}
          </motion.div>
        )}

        {/* Choice interaction */}
        {lesson.interaction === "choice" && lesson.options && (
          <div className="mt-5 space-y-2">
            {lesson.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
                className={`w-full rounded-2xl border p-4 text-left text-body transition-all duration-200 ${
                  selectedOption === null
                    ? "border-border bg-surface-2 hover:border-primary/30 hover:bg-surface-hover"
                    : selectedOption === idx
                    ? idx === lesson.correctAnswer
                      ? "border-accent-green/50 bg-accent-green/10 text-foreground"
                      : "border-destructive/50 bg-destructive/10"
                    : idx === lesson.correctAnswer && selectedOption !== null
                    ? "border-accent-green/50 bg-accent-green/10"
                    : "border-border bg-surface-2 opacity-40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Try It Now */}
        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="section-label text-primary mb-2">Try It Now</p>
          <p className="text-body text-muted-foreground">{lesson.tryPrompt}</p>
        </div>
      </div>

      <div className="editorial-divider mx-6" />

      {/* Footer */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
            +{lesson.tokens}
          </span>
          <span className="text-caption text-text-tertiary">+{lesson.xp} XP</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-xl p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button className="rounded-xl p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-foreground">
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
