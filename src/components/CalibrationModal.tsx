import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
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
    businessType?: string;
    revenueStage?: string;
    biggestChallenge?: string;
    teamSize?: string;
  }) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

// Step 1: What kind of user are you?
// Step 2: Business context (if business owner)
// Step 3: Preferences

type Step = "welcome" | "role" | "business" | "preferences" | "done";

const BUSINESS_TYPES = [
  { id: "construction", label: "🏗️ Construction / Trades" },
  { id: "retail", label: "🛍️ Retail / E-commerce" },
  { id: "service", label: "🤝 Service Business" },
  { id: "saas", label: "💻 SaaS / Tech" },
  { id: "agency", label: "📣 Agency / Consulting" },
  { id: "real-estate", label: "🏠 Real Estate" },
  { id: "restaurant", label: "🍽️ Food & Hospitality" },
  { id: "other", label: "⚡ Other" },
];

const REVENUE_STAGES = [
  { id: "idea", label: "Just an idea" },
  { id: "early", label: "Early ($0–$10K/mo)" },
  { id: "growing", label: "Growing ($10K–$100K/mo)" },
  { id: "scaling", label: "Scaling ($100K+/mo)" },
];

const BIGGEST_CHALLENGES = [
  { id: "leads", label: "Not enough leads" },
  { id: "cashflow", label: "Cash flow / pricing" },
  { id: "team", label: "Team & operations" },
  { id: "growth", label: "Hitting a growth ceiling" },
  { id: "clarity", label: "Lack of clarity / strategy" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "small", label: "2–5 people" },
  { id: "medium", label: "6–20 people" },
  { id: "large", label: "20+ people" },
];

export default function CalibrationModal({ onComplete, onSkip, onBack }: CalibrationModalProps) {
  const [step, setStep] = useState<Step>("role");
  const [answers, setAnswers] = useState<Record<string, string>>({
    intensity: "normal",
    role: "owner",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const isOwner = answers.role === "owner";

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onComplete({
        goalMode: "income",
        outputMode: "blueprints",
        primaryDesire: answers.primaryDesire || "",
        answerTone: answers.answerTone || "calm",
        learningStyle: answers.learningStyle || "visual",
        intensity: answers.intensity || "normal",
        businessType: answers.businessType,
        revenueStage: answers.revenueStage,
        biggestChallenge: answers.biggestChallenge,
        teamSize: answers.teamSize,
      });
      setSuccess(true);
      setTimeout(() => {
        setSaving(false);
        setSuccess(false);
      }, 2000);
    } catch (e) {
      console.error("Calibration save failed:", e);
      toast({
        title: "Couldn't save. Check your connection and try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  // Success screen
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <button
          onClick={step === "role" ? onBack : () => setStep(step === "business" ? "role" : step === "preferences" ? (isOwner ? "business" : "role") : "role")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground tracking-wide">
          Calibration
        </span>
        <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-4">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Role ── */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <OwlIcon size={22} />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground leading-snug">
                  Let's tune Wisdom Owl to you.
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 mb-8">
                  What best describes you?
                </p>

                <div className="space-y-3">
                  {[
                    { id: "owner", label: "🏢 Business owner / entrepreneur", desc: "I run or want to run my own business" },
                    { id: "learner", label: "📚 Learning & growing", desc: "I want to sharpen my business thinking" },
                    { id: "pro", label: "💼 Professional / employee", desc: "I want to level up in my career" },
                  ].map((opt) => {
                    const selected = answers.role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => set("role", opt.id)}
                        className={`w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 border ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                        }`}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={answers.role ? { scale: 0.97 } : {}}
                  onClick={() => answers.role && setStep(isOwner ? "business" : "preferences")}
                  disabled={!answers.role}
                  className={`w-full mt-6 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                    answers.role
                      ? "bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Business Context (owners only) ── */}
          {step === "business" && (
            <motion.div
              key="business"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-7">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Tell me about your business.</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is what makes advice specific to you, not generic.
                  </p>
                </div>

                {/* Business type */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">What type of business?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((opt) => {
                      const selected = answers.businessType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("businessType", opt.id)}
                          className={`rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue stage */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Where are you revenue-wise?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {REVENUE_STAGES.map((opt) => {
                      const selected = answers.revenueStage === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("revenueStage", opt.id)}
                          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Biggest challenge */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Biggest challenge right now?</p>
                  <div className="flex flex-wrap gap-2">
                    {BIGGEST_CHALLENGES.map((opt) => {
                      const selected = answers.biggestChallenge === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("biggestChallenge", opt.id)}
                          className={`rounded-xl px-3 py-2 text-sm transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team size */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Team size?</p>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZES.map((opt) => {
                      const selected = answers.teamSize === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("teamSize", opt.id)}
                          className={`rounded-xl px-3 py-2 text-sm transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setStep("preferences")}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold tracking-wide bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)] flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Preferences ── */}
          {step === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-7">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Last few things.</h2>
                  <p className="text-sm text-muted-foreground mt-1">How you want me to talk to you.</p>
                </div>

                {/* Answer tone */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How do you like answers?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "blunt", label: "Blunt and direct" },
                      { id: "calm", label: "Calm but honest" },
                    ].map((opt) => {
                      const selected = answers.answerTone === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("answerTone", opt.id)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Learning style */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How do you like to learn?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "visual", label: "Short and visual" },
                      { id: "reader", label: "Simple and clear" },
                      { id: "hands-on", label: "Deep breakdowns" },
                    ].map((opt) => {
                      const selected = answers.learningStyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("learningStyle", opt.id)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    How intense should I be?{" "}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "normal", label: "Normal mentor" },
                      { id: "ruthless", label: "Ruthless mentor" },
                    ].map((opt) => {
                      const selected = answers.intensity === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => set("intensity", opt.id)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {answers.answerTone && answers.learningStyle && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-primary text-center font-medium"
                    >
                      Got it. I'll use this from now on.
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={answers.answerTone && answers.learningStyle ? { scale: 0.97 } : {}}
                  onClick={handleFinish}
                  disabled={!answers.answerTone || !answers.learningStyle || saving}
                  className={`w-full rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                    answers.answerTone && answers.learningStyle
                      ? "bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    "Let's go"
                  )}
                </motion.button>

                <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
                  Your answers only help Owl talk to you better. You can change them anytime in Profile.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
