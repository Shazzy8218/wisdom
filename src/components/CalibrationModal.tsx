import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import OwlIcon from "@/components/OwlIcon";
import { toast } from "@/hooks/use-toast";
import type { CalibrationAnswers } from "@/hooks/useCalibration";

interface CalibrationModalProps {
  onComplete: (answers: CalibrationAnswers) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  submitLabel?: string;
  title?: string;
  description?: string;
  initialAnswers?: Partial<CalibrationAnswers>;
}

interface Question {
  id: keyof Pick<CalibrationAnswers, "primaryDesire" | "answerTone" | "learningStyle" | "intensity">;
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

const createInitialAnswers = (initialAnswers?: Partial<CalibrationAnswers>): CalibrationAnswers => ({
  goalMode: initialAnswers?.goalMode || "income",
  outputMode: initialAnswers?.outputMode || "blueprints",
  primaryDesire: initialAnswers?.primaryDesire || "",
  answerTone: initialAnswers?.answerTone || "",
  learningStyle: initialAnswers?.learningStyle || "",
  intensity: initialAnswers?.intensity || "normal",
});

export default function CalibrationModal({
  onComplete,
  onBack,
  onSkip,
  showSkip = false,
  submitLabel = "Let's go",
  title = "Let's tune Wisdom Owl to you.",
  description = "Answer a few quick questions so I actually think like you do.",
  initialAnswers,
}: CalibrationModalProps) {
  const [answers, setAnswers] = useState<CalibrationAnswers>(() => createInitialAnswers(initialAnswers));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnswers(createInitialAnswers(initialAnswers));
  }, [initialAnswers]);

  const requiredIds = questions.filter((q) => q.required).map((q) => q.id);
  const allRequiredAnswered = requiredIds.every((id) => Boolean(answers[id]));

  const select = (questionId: Question["id"], optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFinish = async () => {
    if (!allRequiredAnswered || saving) return;

    setSaving(true);

    try {
      await onComplete(answers);
    } catch (e) {
      console.error("Calibration save failed:", e);
      toast({
        title: "Couldn't save your settings. Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold tracking-wide text-foreground">Calibration</span>
        {showSkip && onSkip ? (
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        ) : (
          <span className="w-10" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <OwlIcon size={22} />
              </div>
            </div>

            <h2 className="mt-5 text-lg font-semibold leading-snug text-foreground">{title}</h2>
            <p className="mb-8 mt-1.5 text-sm text-muted-foreground">{description}</p>

            <div className="space-y-7">
              {questions.map((q, qi) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + qi * 0.07 }}
                >
                  <p className="mb-3 text-sm font-medium text-foreground">
                    {q.label}
                    {!q.required && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
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
                          className={`relative rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
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

            <AnimatePresence>
              {allRequiredAnswered && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 text-center text-xs font-medium text-primary"
                >
                  Got it. I&apos;ll use this from now on.
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={allRequiredAnswered && !saving ? { scale: 0.97 } : {}}
              onClick={handleFinish}
              disabled={!allRequiredAnswered || saving}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                allRequiredAnswered && !saving
                  ? "bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_4px_28px_hsl(var(--primary)/0.45)]"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                submitLabel
              )}
            </motion.button>

            {!allRequiredAnswered && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Answer each question above to continue
              </p>
            )}

            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground/60">
              Your answers only help Owl talk to you better. You can change them anytime in Settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
