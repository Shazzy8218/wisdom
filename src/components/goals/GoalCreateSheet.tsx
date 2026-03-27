import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Flame, Target, Trophy, X } from "lucide-react";

export interface GoalDraft {
  title: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  deadline: string | null;
  why: string;
  roadmap: { step: string; done: boolean }[];
}

interface GoalCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (goal: GoalDraft) => Promise<boolean>;
  creating: boolean;
  hasGoals: boolean;
  progress: {
    streak: number;
    tokens: number;
    masteryScores?: Record<string, number>;
  };
}

const METRIC_OPTIONS = [
  { value: "mastery", label: "Mastery %", icon: "🎯" },
  { value: "lessons", label: "Lessons", icon: "📚" },
  { value: "tokens", label: "Tokens", icon: "🪙" },
  { value: "streak", label: "Streak Days", icon: "🔥" },
  { value: "revenue", label: "Revenue $", icon: "💰" },
  { value: "clients", label: "Clients", icon: "👥" },
  { value: "custom", label: "Custom", icon: "⚡" },
];

const QUICK_STARTS = [
  {
    label: "Sharpen prompting",
    title: "Reach elite AI prompting mastery",
    metric: "mastery",
    why: "Create sharper outputs with less trial and error",
  },
  {
    label: "Build momentum",
    title: "Hold a 14-day learning streak",
    metric: "streak",
    why: "Turn consistency into compounding skill growth",
  },
  {
    label: "Grow income",
    title: "Hit my next revenue milestone",
    metric: "revenue",
    why: "Turn skills into measurable business results",
  },
];

function getMasteryBaseline(scores?: Record<string, number>) {
  const values = Object.values(scores ?? {}).map(Number).filter((value) => Number.isFinite(value));
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getSuggestedBaseline(metric: string, progress: GoalCreateSheetProps["progress"]) {
  switch (metric) {
    case "tokens":
      return progress.tokens ?? 0;
    case "streak":
      return progress.streak ?? 0;
    case "mastery":
      return getMasteryBaseline(progress.masteryScores);
    default:
      return 0;
  }
}

function getSuggestedTarget(metric: string, baseline: number) {
  switch (metric) {
    case "mastery":
      return Math.min(100, Math.max(80, baseline + 15));
    case "lessons":
      return Math.max(10, baseline + 10);
    case "tokens":
      return Math.max(500, baseline + 500);
    case "streak":
      return Math.max(7, baseline + 7);
    case "revenue":
      return Math.max(1000, baseline + 5000);
    case "clients":
      return Math.max(3, baseline + 3);
    default:
      return Math.max(1, baseline + 1);
  }
}

export default function GoalCreateSheet({
  open,
  onOpenChange,
  onSubmit,
  creating,
  hasGoals,
  progress,
}: GoalCreateSheetProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const initialBaseline = useMemo(() => getSuggestedBaseline("mastery", progress), [progress]);
  const initialTarget = useMemo(() => getSuggestedTarget("mastery", initialBaseline), [initialBaseline]);

  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("mastery");
  const [targetVal, setTargetVal] = useState(String(initialTarget));
  const [baselineVal, setBaselineVal] = useState(String(initialBaseline));
  const [deadline, setDeadline] = useState("");
  const [why, setWhy] = useState("");
  const [baselineTouched, setBaselineTouched] = useState(false);
  const [targetTouched, setTargetTouched] = useState(false);

  const resetForm = useCallback(() => {
    const baseline = getSuggestedBaseline("mastery", progress);
    setTitle("");
    setMetric("mastery");
    setBaselineVal(String(baseline));
    setTargetVal(String(getSuggestedTarget("mastery", baseline)));
    setDeadline("");
    setWhy("");
    setBaselineTouched(false);
    setTargetTouched(false);
  }, [progress]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;

    const suggestedBaseline = getSuggestedBaseline(metric, progress);
    if (!baselineTouched) {
      setBaselineVal(String(suggestedBaseline));
    }

    if (!targetTouched) {
      const targetBase = baselineTouched ? Number(baselineVal) || 0 : suggestedBaseline;
      setTargetVal(String(getSuggestedTarget(metric, targetBase)));
    }
  }, [baselineTouched, baselineVal, metric, open, progress, targetTouched]);

  const baselineHint = useMemo(() => {
    if (metric === "tokens") return `Synced with your token balance (${progress.tokens})`;
    if (metric === "streak") return `Synced with your current streak (${progress.streak} days)`;
    if (metric === "mastery") return `Synced with your average mastery (${getMasteryBaseline(progress.masteryScores)}%)`;
    return "Set your starting point and target to track progress accurately";
  }, [metric, progress]);

  const applyQuickStart = (preset: (typeof QUICK_STARTS)[number]) => {
    setTitle(preset.title);
    setMetric(preset.metric);
    setWhy(preset.why);
    setBaselineTouched(false);
    setTargetTouched(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const baseline = Number(baselineVal);
    const target = Number(targetVal);

    if (!title.trim() || Number.isNaN(baseline) || Number.isNaN(target) || target <= baseline) {
      return;
    }

    const created = await onSubmit({
      title: title.trim(),
      targetMetric: metric,
      targetValue: target,
      currentValue: baseline,
      baselineValue: baseline,
      deadline: deadline || null,
      why: why.trim(),
      roadmap: [],
    });

    if (created) onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={(event) => event.target === event.currentTarget && onOpenChange(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="w-full sm:max-w-xl bg-card border border-border rounded-t-[2rem] sm:rounded-[1.75rem] max-h-[90vh] overflow-hidden"
          >
            <form ref={formRef} onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
              <div className="flex items-start justify-between border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                    {hasGoals ? "Add Goal" : "Set Goal"}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-foreground">Build a goal you can actually hit</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-label="Close goal setup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid gap-2 sm:grid-cols-3">
                  {QUICK_STARTS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyQuickStart(preset)}
                      className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{preset.title}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">What are you aiming for?</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Make it specific, measurable, and worth chasing.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Goal title</label>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="e.g., Reach $10k/month from AI services"
                        autoFocus
                        enterKeyHint="next"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">Track this goal by</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {METRIC_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMetric(option.value)}
                            className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                              metric === option.value
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            <span className="block text-base">{option.icon}</span>
                            <span className="mt-1 block text-[11px] font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Starting point</label>
                        <input
                          value={baselineVal}
                          onChange={(event) => {
                            setBaselineVal(event.target.value);
                            setBaselineTouched(true);
                          }}
                          type="number"
                          inputMode="decimal"
                          enterKeyHint="next"
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Target</label>
                        <input
                          value={targetVal}
                          onChange={(event) => {
                            setTargetVal(event.target.value);
                            setTargetTouched(true);
                          }}
                          type="number"
                          inputMode="decimal"
                          enterKeyHint="done"
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
                      {baselineHint}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Why does this matter?</label>
                      <input
                        value={why}
                        onChange={(event) => setWhy(event.target.value)}
                        placeholder="Give this goal a real reason so it sticks"
                        enterKeyHint="done"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Deadline</label>
                      <input
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                        type="date"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 text-center">
                    <Flame className="mx-auto h-4 w-4 text-amber-500" />
                    <p className="mt-2 text-lg font-bold text-foreground">{progress.streak}</p>
                    <p className="text-[11px] text-muted-foreground">Current streak</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 text-center">
                    <Coins className="mx-auto h-4 w-4 text-primary" />
                    <p className="mt-2 text-lg font-bold text-foreground">{progress.tokens}</p>
                    <p className="text-[11px] text-muted-foreground">Available tokens</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 text-center">
                    <Trophy className="mx-auto h-4 w-4 text-accent-gold" />
                    <p className="mt-2 text-lg font-bold text-foreground">{getMasteryBaseline(progress.masteryScores)}%</p>
                    <p className="text-[11px] text-muted-foreground">Avg mastery</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => formRef.current?.requestSubmit()}
                    disabled={creating || !title.trim() || Number(targetVal) <= Number(baselineVal)}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creating ? "Setting Goal..." : "Set Goal"}
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">Press Enter from any field to submit.</p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}