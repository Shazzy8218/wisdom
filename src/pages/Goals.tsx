import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, ChevronLeft, Plus, Trash2, CheckCircle, Circle, Flame,
  Coins, Clock, Loader2, Trophy, TrendingUp, X, Brain, Sparkles,
  ChevronRight, BarChart3, Zap, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoals, UserGoal } from "@/hooks/useGoals";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import GoalCreateSheet, { GoalDraft } from "@/components/goals/GoalCreateSheet";

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleComplete } = useGoals();
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editCurrentValue, setEditCurrentValue] = useState("");

  const handleCreate = async (goal: GoalDraft) => {
    setCreating(true);
    try {
      await createGoal(goal);
      toast({ title: "✅ Goal created!" });
      setShowCreate(false);
      return true;
    } catch (e: any) {
      toast({ title: "Failed to create goal", description: e?.message, variant: "destructive" });
      return false;
    } finally {
      setCreating(false);
    }
  };

  const toggleRoadmapStep = async (goalId: string, idx: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.roadmap.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    try { await updateGoal(goalId, { roadmap: updated }); }
    catch { toast({ title: "Failed to update step", variant: "destructive" }); }
  };

  const addRoadmapStep = async (goalId: string) => {
    if (!newStep.trim()) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    try {
      await updateGoal(goalId, { roadmap: [...goal.roadmap, { step: newStep.trim(), done: false }] });
      setNewStep("");
    } catch { toast({ title: "Failed to add step", variant: "destructive" }); }
  };

  const removeRoadmapStep = async (goalId: string, idx: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    try { await updateGoal(goalId, { roadmap: goal.roadmap.filter((_, i) => i !== idx) }); }
    catch { toast({ title: "Failed to remove step", variant: "destructive" }); }
  };

  const handleUpdateProgress = async (goalId: string) => {
    const val = Number(editCurrentValue);
    if (isNaN(val)) { toast({ title: "Enter a valid number" }); return; }
    try {
      await updateGoal(goalId, { currentValue: val });
      setEditingGoalId(null);
      setEditCurrentValue("");
      toast({ title: "Progress updated! 🎯" });
    } catch { toast({ title: "Failed to update progress", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteGoal(id); toast({ title: "Goal deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const getProgressPercent = (g: UserGoal) => {
    if (!g || g.targetValue === g.baselineValue) return 0;
    return Math.min(100, Math.round(((g.currentValue - g.baselineValue) / (g.targetValue - g.baselineValue)) * 100));
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  // Compute overall stats
  const overallProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    return Math.round(activeGoals.reduce((sum, g) => sum + getProgressPercent(g), 0) / activeGoals.length);
  }, [activeGoals]);

  // Find goals at risk (less than expected progress based on deadline)
  const atRiskGoals = useMemo(() => {
    return activeGoals.filter(g => {
      if (!g.deadline) return false;
      const now = Date.now();
      const created = new Date(g.createdAt).getTime();
      const deadline = new Date(g.deadline).getTime();
      if (deadline <= created) return false;
      const timeElapsed = (now - created) / (deadline - created);
      const progressMade = getProgressPercent(g) / 100;
      return timeElapsed > 0.3 && progressMade < timeElapsed * 0.5;
    });
  }, [activeGoals]);

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
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Strategic Goal Engine</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Mission Control</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>Set Goal</span>
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-4 gap-2">
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
            <Trophy className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{completedGoals.length}</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <BarChart3 className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{overallProgress}%</p>
            <p className="text-[10px] text-muted-foreground">Overall</p>
          </div>
        </div>
      </div>

      {/* LOA Entry Card — show when no goals or always as option */}
      <div className="px-5 mb-5">
        <button
          onClick={() => navigate("/life-optimizer")}
          className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm font-bold text-foreground">Life Optimization Advisor</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">AI</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {goals.length === 0
                  ? "Don't know where to start? Let the LOA conduct a ruthless diagnostic of your life and generate an actionable optimization plan."
                  : "Run another diagnostic session to recalibrate your strategy, identify blind spots, or set new targets."}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </button>
      </div>

      {/* At-Risk Goals Warning */}
      {atRiskGoals.length > 0 && (
        <div className="px-5 mb-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground mb-0.5">Goal Drift Detected</p>
              <p className="text-[11px] text-muted-foreground">
                {atRiskGoals.length} goal{atRiskGoals.length > 1 ? "s" : ""} behind schedule: {atRiskGoals.map(g => g.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <GoalCreateSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
        creating={creating}
        hasGoals={goals.length > 0}
        progress={progress}
      />

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
                isAtRisk={atRiskGoals.some(g => g.id === goal.id)}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-5 text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No Goals Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Set a goal manually or let the Life Optimization Advisor create your strategic plan.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setShowCreate(true)}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Set Goal Manually
            </button>
            <button onClick={() => navigate("/life-optimizer")}
              className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center gap-2">
              <Brain className="h-4 w-4" /> Optimize My Life
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── GoalCard Component ─── */

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
  isAtRisk?: boolean;
}

function GoalCard({
  goal, index, expanded, onToggleExpand, onToggleStep, onAddStep, onRemoveStep,
  newStep, onNewStepChange, onDelete, onToggleComplete, onUpdateProgress,
  isEditingProgress, editCurrentValue, onEditCurrentValueChange, onSaveProgress, onCancelEdit,
  getProgressPercent, isAtRisk
}: GoalCardProps) {
  const percent = getProgressPercent(goal);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const stepsComplete = goal.roadmap.filter(s => s.done).length;
  const totalSteps = goal.roadmap.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}>
      <div className={`rounded-2xl border bg-card p-5 transition-all ${
        isAtRisk ? "border-amber-500/30" : index === 0 ? "border-primary/20" : "border-border"
      }`}>
        {/* Header */}
        <button onClick={onToggleExpand} className="w-full flex items-start gap-3 text-left">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
            isAtRisk ? "bg-amber-500/10" : index === 0 ? "bg-primary/10" : "bg-muted/50"
          }`}>
            {isAtRisk ? (
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Target className={`h-4.5 w-4.5 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate">{goal.title}</h3>
            {goal.why && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">"{goal.why}"</p>}
            {totalSteps > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">{stepsComplete}/{totalSteps} milestones</p>
            )}
          </div>
          <span className={`text-xs font-bold ${isAtRisk ? "text-amber-500" : "text-primary"}`}>{percent}%</span>
        </button>

        {/* Progress Bar */}
        <div className="mt-3 mb-1">
          <Progress value={percent} className={`h-2 ${isAtRisk ? "[&>div]:bg-amber-500" : ""}`} />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">{goal.currentValue} / {goal.targetValue} {goal.targetMetric}</span>
            {goal.deadline && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {goal.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Update Progress */}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Roadmap</p>
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
