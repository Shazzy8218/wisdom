import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ChevronLeft, Plus, Trash2, CheckCircle, Circle, Flame, Coins, Clock, Loader2, Trophy, TrendingUp, Pencil, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoals, UserGoal } from "@/hooks/useGoals";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const METRIC_OPTIONS = [
  { value: "mastery", label: "Mastery %", icon: "🎯" },
  { value: "lessons", label: "Lessons", icon: "📚" },
  { value: "tokens", label: "Tokens", icon: "🪙" },
  { value: "streak", label: "Streak Days", icon: "🔥" },
  { value: "revenue", label: "Revenue $", icon: "💰" },
  { value: "clients", label: "Clients", icon: "👥" },
  { value: "custom", label: "Custom", icon: "⚡" },
];

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleComplete } = useGoals();
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("mastery");
  const [targetVal, setTargetVal] = useState("80");
  const [baselineVal, setBaselineVal] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [why, setWhy] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editCurrentValue, setEditCurrentValue] = useState("");

  const resetForm = () => {
    setTitle(""); setMetric("mastery"); setTargetVal("80"); setBaselineVal("0"); setDeadline(""); setWhy("");
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast({ title: "Enter a goal title" }); return; }
    if (Number(targetVal) <= Number(baselineVal)) { toast({ title: "Target must be greater than baseline" }); return; }
    setCreating(true);
    try {
      await createGoal({
        title: title.trim(),
        targetMetric: metric,
        targetValue: Number(targetVal) || 100,
        currentValue: Number(baselineVal) || 0,
        baselineValue: Number(baselineVal) || 0,
        deadline: deadline || null,
        why: why.trim(),
        roadmap: [],
      });
      setShowCreate(false);
      resetForm();
      toast({ title: "✅ Goal created!" });
    } catch (e: any) {
      console.error("[Goals] create failed:", e);
      toast({ title: "Failed to create goal", description: e?.message || "Please try again", variant: "destructive" });
    }
    setCreating(false);
  };

  const toggleRoadmapStep = async (goalId: string, idx: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.roadmap.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    try {
      await updateGoal(goalId, { roadmap: updated });
    } catch {
      toast({ title: "Failed to update step", variant: "destructive" });
    }
  };

  const addRoadmapStep = async (goalId: string) => {
    if (!newStep.trim()) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = [...goal.roadmap, { step: newStep.trim(), done: false }];
    try {
      await updateGoal(goalId, { roadmap: updated });
      setNewStep("");
    } catch {
      toast({ title: "Failed to add step", variant: "destructive" });
    }
  };

  const removeRoadmapStep = async (goalId: string, idx: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.roadmap.filter((_, i) => i !== idx);
    try {
      await updateGoal(goalId, { roadmap: updated });
    } catch {
      toast({ title: "Failed to remove step", variant: "destructive" });
    }
  };

  const handleUpdateProgress = async (goalId: string) => {
    const val = Number(editCurrentValue);
    if (isNaN(val)) { toast({ title: "Enter a valid number" }); return; }
    try {
      await updateGoal(goalId, { currentValue: val });
      setEditingGoalId(null);
      setEditCurrentValue("");
      toast({ title: "Progress updated! 🎯" });
    } catch {
      toast({ title: "Failed to update progress", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      toast({ title: "Goal deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const getProgressPercent = (g: UserGoal) => {
    if (!g || g.targetValue === g.baselineValue) return 0;
    return Math.min(100, Math.round(((g.currentValue - g.baselineValue) / (g.targetValue - g.baselineValue)) * 100));
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Goals</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Your Mission</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Flame className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{progress.streak}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Coins className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{progress.tokens}</p>
            <p className="text-[10px] text-muted-foreground">Tokens</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Trophy className="h-4 w-4 text-accent-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{completedGoals.length}</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">New Goal</h2>
                <button onClick={() => { setShowCreate(false); resetForm(); }}
                  className="p-1.5 rounded-xl hover:bg-muted/50 transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">What do you want to achieve?</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Master AI prompting"
                    autoFocus
                    className="w-full rounded-xl bg-muted/50 border border-border px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Why does this matter?</label>
                  <input value={why} onChange={e => setWhy(e.target.value)} placeholder="Your motivation (optional)"
                    className="w-full rounded-xl bg-muted/50 border border-border px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Track by</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {METRIC_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setMetric(opt.value)}
                        className={`rounded-xl px-2 py-2 text-center transition-all ${
                          metric === opt.value
                            ? "bg-primary/10 border border-primary/30 text-primary"
                            : "bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted"
                        }`}>
                        <span className="text-sm block">{opt.icon}</span>
                        <span className="text-[10px] block mt-0.5">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Starting at</label>
                    <input value={baselineVal} onChange={e => setBaselineVal(e.target.value)} type="number"
                      className="w-full rounded-xl bg-muted/50 border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target</label>
                    <input value={targetVal} onChange={e => setTargetVal(e.target.value)} type="number"
                      className="w-full rounded-xl bg-muted/50 border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deadline (optional)</label>
                  <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
                    className="w-full rounded-xl bg-muted/50 border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
                </div>

                <button onClick={handleCreate} disabled={creating || !title.trim()}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  {creating ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Active Goals</p>
          <div className="space-y-3">
            {activeGoals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} index={i}
                expanded={expandedGoal === goal.id}
                onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                onToggleStep={(idx) => toggleRoadmapStep(goal.id, idx)}
                onAddStep={() => addRoadmapStep(goal.id)}
                onRemoveStep={(idx) => removeRoadmapStep(goal.id, idx)}
                newStep={expandedGoal === goal.id ? newStep : ""}
                onNewStepChange={setNewStep}
                onDelete={() => handleDelete(goal.id)}
                onToggleComplete={() => toggleComplete(goal.id)}
                onUpdateProgress={() => {
                  setEditingGoalId(goal.id);
                  setEditCurrentValue(String(goal.currentValue));
                }}
                isEditingProgress={editingGoalId === goal.id}
                editCurrentValue={editCurrentValue}
                onEditCurrentValueChange={setEditCurrentValue}
                onSaveProgress={() => handleUpdateProgress(goal.id)}
                onCancelEdit={() => { setEditingGoalId(null); setEditCurrentValue(""); }}
                getProgressPercent={getProgressPercent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Completed 🎉</p>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-border bg-card/50 p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground line-through truncate">{goal.title}</p>
                </div>
                <button onClick={() => toggleComplete(goal.id)}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Reopen</button>
                <button onClick={() => handleDelete(goal.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !showCreate && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-5 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">Set Your First Goal</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Define what you want to achieve and track your journey step by step.</p>
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </motion.div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: UserGoal;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStep: (idx: number) => void;
  onAddStep: () => void;
  onRemoveStep: (idx: number) => void;
  newStep: string;
  onNewStepChange: (v: string) => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onUpdateProgress: () => void;
  isEditingProgress: boolean;
  editCurrentValue: string;
  onEditCurrentValueChange: (v: string) => void;
  onSaveProgress: () => void;
  onCancelEdit: () => void;
  getProgressPercent: (g: UserGoal) => number;
}

function GoalCard({
  goal, index, expanded, onToggleExpand, onToggleStep, onAddStep, onRemoveStep,
  newStep, onNewStepChange, onDelete, onToggleComplete, onUpdateProgress,
  isEditingProgress, editCurrentValue, onEditCurrentValueChange, onSaveProgress, onCancelEdit,
  getProgressPercent
}: GoalCardProps) {
  const percent = getProgressPercent(goal);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}>
      <div className={`rounded-2xl border bg-card p-5 transition-all ${
        index === 0 ? "border-primary/20" : "border-border"
      }`}>
        {/* Header */}
        <button onClick={onToggleExpand} className="w-full flex items-start gap-3 text-left">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
            index === 0 ? "bg-primary/10" : "bg-muted/50"
          }`}>
            <Target className={`h-4.5 w-4.5 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate">{goal.title}</h3>
            {goal.why && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">"{goal.why}"</p>}
          </div>
          <span className="text-xs font-bold text-primary">{percent}%</span>
        </button>

        {/* Progress Bar */}
        <div className="mt-3 mb-1">
          <Progress value={percent} className="h-2" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">{goal.currentValue} / {goal.targetValue} {goal.targetMetric}</span>
            {goal.deadline && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {goal.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Update Progress inline */}
        {isEditingProgress ? (
          <div className="mt-3 flex items-center gap-2">
            <input value={editCurrentValue} onChange={e => onEditCurrentValueChange(e.target.value)}
              type="number" autoFocus placeholder="New value"
              onKeyDown={e => e.key === "Enter" && onSaveProgress()}
              className="flex-1 rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-primary/40" />
            <button onClick={onSaveProgress} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Save</button>
            <button onClick={onCancelEdit} className="text-xs text-muted-foreground">✕</button>
          </div>
        ) : (
          <button onClick={onUpdateProgress}
            className="mt-2 w-full rounded-xl bg-primary/5 border border-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Update Progress
          </button>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-border">
                {/* Roadmap */}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Roadmap Steps</p>
                {goal.roadmap.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {goal.roadmap.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <button onClick={() => onToggleStep(i)}
                          className="flex items-center gap-2 flex-1 rounded-lg bg-muted/30 p-2 text-left transition-colors hover:bg-muted/50">
                          {step.done
                            ? <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                            : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className={`text-xs ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.step}</span>
                        </button>
                        <button onClick={() => onRemoveStep(i)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Step */}
                <div className="flex gap-2 mb-4">
                  <input value={newStep} onChange={e => onNewStepChange(e.target.value)}
                    placeholder="Add a milestone..."
                    onKeyDown={e => e.key === "Enter" && onAddStep()}
                    className="flex-1 rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40" />
                  <button onClick={onAddStep} disabled={!newStep.trim()}
                    className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-30">
                    Add
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={onToggleComplete}
                    className="flex-1 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-3 w-3" /> Mark Complete
                  </button>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/20 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <button onClick={() => { onDelete(); setShowDeleteConfirm(false); }}
                      className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive font-medium transition-colors">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
