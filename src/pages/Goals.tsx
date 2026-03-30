import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, ChevronLeft, Plus, Trash2, CheckCircle, Circle, Flame,
  Coins, Clock, Loader2, Trophy, TrendingUp, X, Brain, Sparkles,
  ChevronRight, BarChart3, Zap, AlertTriangle, ChevronDown,
  Crosshair, BookOpen, Dumbbell, Rocket, Eye, ArrowRight
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoals, UserGoal } from "@/hooks/useGoals";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import GoalCreateSheet, { GoalDraft } from "@/components/goals/GoalCreateSheet";
import { decomposeGoal, decompositionToRoadmap, type GoalDecomposition } from "@/lib/goal-decompose";

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleComplete, refetch } = useGoals();
  const { progress } = useProgress();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editCurrentValue, setEditCurrentValue] = useState("");
  const [decomposing, setDecomposing] = useState<string | null>(null); // goalId being decomposed

  const openGoalCreation = useCallback(() => {
    setShowCreate(true);
  }, []);

  useEffect(() => {
    const loaImport = (location.state as { loaImport?: { createdCount?: number } } | null)?.loaImport;
    if (!loaImport) return;

    void refetch().finally(() => {
      toast({
        title: "Mission Control activated",
        description: `${loaImport.createdCount ?? 0} goal${loaImport.createdCount === 1 ? "" : "s"} loaded from Life Optimization Advisor.`,
      });
    });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, refetch]);

  const handleCreate = async (goal: GoalDraft) => {
    setCreating(true);
    try {
      const result = await createGoal(goal);
      toast({ title: "✅ Goal created!" });
      setShowCreate(false);

      // Auto-decompose after creation
      if (result?.id) {
        triggerDecomposition(result.id, goal);
      }
      return true;
    } catch (e: any) {
      toast({ title: "Failed to create goal", description: e?.message, variant: "destructive" });
      return false;
    } finally {
      setCreating(false);
    }
  };

  const triggerDecomposition = async (goalId: string, goal: GoalDraft | UserGoal) => {
    setDecomposing(goalId);
    try {
      const avgMastery = Object.values(progress.masteryScores || {}).length > 0
        ? Math.round(Object.values(progress.masteryScores).reduce((a, b) => a + b, 0) / Object.values(progress.masteryScores).length)
        : 0;

      const decomp = await decomposeGoal(
        {
          title: goal.title,
          targetMetric: goal.targetMetric,
          targetValue: goal.targetValue,
          baselineValue: goal.baselineValue,
          why: goal.why || ("why" in goal ? (goal as any).why : ""),
          deadline: goal.deadline,
        },
        {
          currentMastery: avgMastery,
          streak: progress.streak,
          completedLessons: progress.completedLessons.length,
        }
      );

      const roadmap = decompositionToRoadmap(decomp);
      await updateGoal(goalId, { roadmap });
      toast({ title: "🎯 Strategic roadmap generated!", description: `${roadmap.length} tasks mapped across ${decomp.pillars.length} pillars` });
    } catch (err: any) {
      console.error("Decomposition error:", err);
      toast({ title: "Decomposition failed", description: err.message, variant: "destructive" });
    } finally {
      setDecomposing(null);
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

  const overallProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    return Math.round(activeGoals.reduce((sum, g) => sum + getProgressPercent(g), 0) / activeGoals.length);
  }, [activeGoals]);

  const totalTasks = useMemo(() => {
    return activeGoals.reduce((sum, g) => sum + g.roadmap.filter(s => !s.step.startsWith("📌")).length, 0);
  }, [activeGoals]);

  const doneTasks = useMemo(() => {
    return activeGoals.reduce((sum, g) => sum + g.roadmap.filter(s => s.done && !s.step.startsWith("📌")).length, 0);
  }, [activeGoals]);

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

  // Compute the NEXT MOVE — first incomplete task across the highest priority goal
  const nextMove = useMemo(() => {
    for (const goal of activeGoals) {
      for (const step of goal.roadmap) {
        if (!step.done && !step.step.startsWith("📌")) {
          return { goalTitle: goal.title, goalId: goal.id, task: step.step };
        }
      }
    }
    return null;
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
          onClick={openGoalCreation}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>Set Goal</span>
        </button>
      </div>

      {/* Precision Tracker — Accountability Scoreboard */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-3">Precision Tracker</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Goal Progress</span>
            </div>
            <p className="text-2xl font-black text-foreground">{overallProgress}%</p>
            <Progress value={overallProgress} className="h-1 mt-1.5" />
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Active Streak</span>
            </div>
            <p className="text-2xl font-black text-foreground">{progress.streak}<span className="text-sm text-muted-foreground ml-1">days</span></p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Tokens Earned</span>
            </div>
            <p className="text-2xl font-black text-foreground">{progress.tokens.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Mastery</span>
            </div>
            <p className="text-2xl font-black text-foreground">{(() => {
              const vals = Object.values(progress.masteryScores || {});
              return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            })()}%</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border p-2.5 text-center">
            <Target className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{doneTasks}/{totalTasks}</p>
            <p className="text-[9px] text-muted-foreground">Tasks Done</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-2.5 text-center">
            <Trophy className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{completedGoals.length}</p>
            <p className="text-[9px] text-muted-foreground">Achieved</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-2.5 text-center">
            <Zap className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{progress.xp.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Total XP</p>
          </div>
        </div>
      </div>

      {/* THE NEXT MOVE — always visible if there's something to do */}
      {nextMove && (
        <div className="px-5 mb-4">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setExpandedGoal(nextMove.goalId);
              // scroll to the goal
              document.getElementById(`goal-${nextMove.goalId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="w-full rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 group"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors shrink-0">
                <Crosshair className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Your Next Move</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">{nextMove.task}</p>
                <p className="text-[11px] text-muted-foreground mt-1">→ {nextMove.goalTitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-2" />
            </div>
          </motion.button>
        </div>
      )}

      {/* LOA Entry */}
      <div className="px-5 mb-5">
        <button
          onClick={() => navigate("/life-optimizer")}
          className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm font-bold text-foreground">Life Optimization Advisor</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">AI</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {goals.length === 0
                  ? "Want AI help instead? Let the LOA define your strategic trajectory after you explore manual goal setup."
                  : "Run a diagnostic to recalibrate your strategy or set new targets."}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </button>
      </div>

      {/* Goal Drift Alert */}
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Active Missions</p>
          <div className="space-y-3">
            {activeGoals.map((goal, i) => (
              <MissionCard
                key={goal.id}
                goal={goal}
                index={i}
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
                isDecomposing={decomposing === goal.id}
                onDecompose={() => triggerDecomposition(goal.id, goal)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedGoals.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Achieved 🎉</p>
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
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No Active Missions</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Create a mission manually or use LOA for a deeper strategy pass — either way your roadmap auto-builds into actionable steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={openGoalCreation}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Set Goal
            </button>
            <button onClick={() => navigate("/life-optimizer")}
              className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center gap-2">
              <Brain className="h-4 w-4" /> Life Optimizer
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── MissionCard — The Goal Card with full roadmap visualization ─── */

interface MissionCardProps {
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
  isDecomposing?: boolean;
  onDecompose: () => void;
}

function MissionCard({
  goal, index, expanded, onToggleExpand, onToggleStep, onAddStep, onRemoveStep,
  newStep, onNewStepChange, onDelete, onToggleComplete, onUpdateProgress,
  isEditingProgress, editCurrentValue, onEditCurrentValueChange, onSaveProgress, onCancelEdit,
  getProgressPercent, isAtRisk, isDecomposing, onDecompose
}: MissionCardProps) {
  const percent = getProgressPercent(goal);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Parse roadmap into pillars and tasks
  const { pillars, flatTasks } = useMemo(() => {
    const p: { name: string; tasks: { step: string; done: boolean; index: number }[] }[] = [];
    let currentPillar: typeof p[0] | null = null;

    goal.roadmap.forEach((step, idx) => {
      if (step.step.startsWith("📌")) {
        currentPillar = { name: step.step.replace("📌 ", ""), tasks: [] };
        p.push(currentPillar);
      } else if (currentPillar) {
        currentPillar.tasks.push({ ...step, index: idx });
      } else {
        // Tasks without a pillar header — create a default
        if (p.length === 0) {
          currentPillar = { name: "Tasks", tasks: [] };
          p.push(currentPillar);
        }
        p[p.length - 1].tasks.push({ ...step, index: idx });
      }
    });

    const flat = goal.roadmap
      .map((s, i) => ({ ...s, index: i }))
      .filter(s => !s.step.startsWith("📌"));

    return { pillars: p, flatTasks: flat };
  }, [goal.roadmap]);

  const tasksDone = flatTasks.filter(t => t.done).length;
  const tasksTotal = flatTasks.length;
  const roadmapPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const taskTypeIcon = (task: string) => {
    const lower = task.toLowerCase();
    if (lower.includes("learn") || lower.includes("watch") || lower.includes("read") || lower.includes("study"))
      return <BookOpen className="h-3 w-3 text-blue-400" />;
    if (lower.includes("practice") || lower.includes("drill") || lower.includes("exercise"))
      return <Dumbbell className="h-3 w-3 text-amber-400" />;
    if (lower.includes("review") || lower.includes("analyze") || lower.includes("audit"))
      return <Eye className="h-3 w-3 text-purple-400" />;
    return <Rocket className="h-3 w-3 text-primary" />;
  };

  return (
    <motion.div
      id={`goal-${goal.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
    >
      <div className={`rounded-2xl border bg-card transition-all ${
        isAtRisk ? "border-amber-500/30" : index === 0 ? "border-primary/20" : "border-border"
      }`}>
        {/* Header */}
        <button onClick={onToggleExpand} className="w-full p-5 flex items-start gap-3 text-left">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
            isAtRisk ? "bg-amber-500/10" : index === 0 ? "bg-primary/10" : "bg-muted/50"
          }`}>
            {isAtRisk ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Target className={`h-4 w-4 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate">{goal.title}</h3>
            {goal.why && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">"{goal.why}"</p>}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground">{tasksDone}/{tasksTotal} tasks</span>
              {goal.deadline && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {goal.deadline}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-bold ${isAtRisk ? "text-amber-500" : "text-primary"}`}>{percent}%</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Dual Progress Bars */}
        <div className="px-5 pb-3">
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Metric: {goal.currentValue}/{goal.targetValue} {goal.targetMetric}</span>
                <span className="text-[10px] font-medium text-primary">{percent}%</span>
              </div>
              <Progress value={percent} className={`h-1.5 ${isAtRisk ? "[&>div]:bg-amber-500" : ""}`} />
            </div>
            {tasksTotal > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Roadmap progress</span>
                  <span className="text-[10px] font-medium text-primary">{roadmapPercent}%</span>
                </div>
                <Progress value={roadmapPercent} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        {/* Update Progress / Quick Actions */}
        <div className="px-5 pb-4">
          {isEditingProgress ? (
            <div className="flex items-center gap-2">
              <input value={editCurrentValue} onChange={e => onEditCurrentValueChange(e.target.value)}
                type="number" autoFocus placeholder="New value"
                onKeyDown={e => e.key === "Enter" && onSaveProgress()}
                className="flex-1 rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none focus:border-primary/40" />
              <button onClick={onSaveProgress} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Save</button>
              <button onClick={onCancelEdit} className="text-xs text-muted-foreground">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onUpdateProgress}
                className="flex-1 rounded-xl bg-primary/5 border border-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Update Progress
              </button>
              {goal.roadmap.length === 0 && (
                <button onClick={onDecompose} disabled={!!isDecomposing}
                  className="flex-1 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {isDecomposing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {isDecomposing ? "Decomposing..." : "AI Roadmap"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expanded: Full Roadmap */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-2 border-t border-border">
                {/* Pillar-based roadmap */}
                {pillars.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {pillars.map((pillar, pi) => {
                      const pillarDone = pillar.tasks.filter(t => t.done).length;
                      const pillarTotal = pillar.tasks.length;
                      const pillarPct = pillarTotal > 0 ? Math.round((pillarDone / pillarTotal) * 100) : 0;

                      return (
                        <div key={pi}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {pi + 1}
                            </div>
                            <span className="text-xs font-bold text-foreground flex-1">{pillar.name}</span>
                            <span className="text-[10px] text-muted-foreground">{pillarDone}/{pillarTotal}</span>
                            <span className="text-[10px] font-medium text-primary">{pillarPct}%</span>
                          </div>
                          <Progress value={pillarPct} className="h-1 mb-2" />
                          <div className="space-y-1 ml-2">
                            {pillar.tasks.map((task) => (
                              <div key={task.index} className="flex items-center gap-2 group">
                                <button onClick={() => onToggleStep(task.index)}
                                  className="flex items-center gap-2 flex-1 rounded-lg bg-muted/20 p-2 text-left transition-colors hover:bg-muted/40">
                                  {task.done
                                    ? <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                    : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                  <span className="shrink-0">{taskTypeIcon(task.step)}</span>
                                  <span className={`text-xs ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    {task.step}
                                  </span>
                                </button>
                                <button onClick={() => onRemoveStep(task.index)}
                                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 mb-3">
                    <p className="text-xs text-muted-foreground mb-2">No roadmap yet</p>
                    <button onClick={onDecompose} disabled={!!isDecomposing}
                      className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
                      {isDecomposing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {isDecomposing ? "Generating..." : "Generate AI Roadmap"}
                    </button>
                  </div>
                )}

                {/* Add custom step */}
                <div className="flex gap-2 mb-4">
                  <input value={newStep} onChange={e => onNewStepChange(e.target.value)}
                    placeholder="Add a custom task..."
                    onKeyDown={e => e.key === "Enter" && onAddStep()}
                    className="flex-1 rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40" />
                  <button onClick={onAddStep} disabled={!newStep.trim()}
                    className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-30">
                    Add
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {goal.roadmap.length > 0 && (
                    <button onClick={onDecompose} disabled={!!isDecomposing}
                      className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      <Sparkles className="h-3 w-3" /> Re-analyze
                    </button>
                  )}
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
