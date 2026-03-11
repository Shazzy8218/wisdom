import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import OwlIcon from "@/components/OwlIcon";
import { toast } from "@/hooks/use-toast";

interface CalibrationModalProps {
  onComplete: (answers: {
    goalMode: string;
    outputMode: string;
    primaryDesire: string;
    answerTone: string;
    learningStyle: string;
    intensity: string;
  }) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

interface Question {
  id: string;
  label: string;
  options: { id: string; label: string }[];
  required: boolean;
}

const questions: Question[] = [
  {
    id: "primaryDesire",
    label: "What do you want most right now?",
    options: [
      { id: "money", label: "More money" },
      { id: "stress", label: "Less stress" },
      { id: "thinking", label: "Better thinking" },
      { id: "skills", label: "Stronger skills" },
    ],
    required: true,
  },
  {
    id: "answerTone",
    label: "How do you like answers?",
    options: [
      { id: "blunt", label: "Blunt and direct" },
      { id: "calm", label: "Calm but honest" },
    ],
    required: true,
  },
  {
    id: "learningStyle",
    label: "How do you like to learn?",
    options: [
      { id: "visual", label: "Short and visual" },
      { id: "reader", label: "Simple and clear" },
      { id: "hands-on", label: "Deep breakdowns" },
    ],
    required: true,
  },
  {
    id: "intensity",
    label: "How intense should I be?",
    options: [
      { id: "normal", label: "Normal mentor" },
      { id: "ruthless", label: "Ruthless mentor" },
    ],
    required: false,
  },
];

export default function CalibrationModal({ onComplete, onSkip, onBack }: CalibrationModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    intensity: "normal",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const requiredIds = questions.filter((q) => q.required).map((q) => q.id);
  const allRequiredAnswered = requiredIds.every((id) => !!answers[id]);

  const select = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFinish = async () => {
    if (!allRequiredAnswered || saving) return;
    setSaving(true);
    try {
      await onComplete({
        goalMode: "income",
        outputMode: "blueprints",
        primaryDesire: answers.primaryDesire || "",
        answerTone: answers.answerTone || "calm",
        learningStyle: answers.learningStyle || "visual",
        intensity: answers.intensity || "normal",
      });
      setSuccess(true);
    } catch (e) {
      console.error("Calibration save failed:", e);
      toast({
        title: "Couldn't save. Check your connection and try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  // Success transition
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-5 h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center"
          >
            <Check className="h-7 w-7 text-primary" />
          </motion.div>
          <p className="text-base font-medium text-foreground">You're all set.</p>
          <p className="text-sm text-muted-foreground mt-1">Entering Wisdom Owl…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground tracking-wide">
          Calibration
        </span>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Intro */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <OwlIcon size={22} />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-5 leading-snug">
            Let's tune Wisdom Owl to you.
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">
            Answer a few quick questions so I actually think like you do.
          </p>

          {/* Questions */}
          <div className="space-y-7">
            {questions.map((q, qi) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + qi * 0.07 }}
              >
                <p className="text-sm font-medium text-foreground mb-3">
                  {q.label}
                  {!q.required && (
                    <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                      (optional)
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => select(q.id, opt.id)}
                        className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                          selected
                            ? "border-primary bg-primary/12 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                            : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {selected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.span>
                          )}
                          {opt.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Confirmation micro-copy */}
          <AnimatePresence>
            {allRequiredAnswered && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-primary mt-6 text-center font-medium"
              >
                Got it. I'll use this from now on.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Let's Go */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={allRequiredAnswered ? { scale: 0.97 } : {}}
            onClick={handleFinish}
            disabled={!allRequiredAnswered || saving}
            className={`w-full mt-6 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
              allRequiredAnswered
                ? "bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_4px_28px_hsl(var(--primary)/0.45)]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Let's go"
            )}
          </motion.button>

          {!allRequiredAnswered && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Answer each question above to continue
            </p>
          )}

          {/* Trust text */}
          <p className="text-center text-[11px] text-muted-foreground/60 mt-6 leading-relaxed">
            Your answers only help Owl talk to you better. You can change them anytime in Profile.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
