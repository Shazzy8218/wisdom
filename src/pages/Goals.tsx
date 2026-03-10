import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Target, ChevronLeft, Plus, Trash2, CheckCircle, Circle, Flame, Coins, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoals } from "@/hooks/useGoals";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

export default function Goals() {
  const { goals, primaryGoal, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("mastery");
  const [targetVal, setTargetVal] = useState("80");
  const [baselineVal, setBaselineVal] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [why, setWhy] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { toast({ title: "Enter a goal title" }); return; }
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
      setTitle(""); setMetric("mastery"); setTargetVal("80"); setBaselineVal("0"); setDeadline(""); setWhy("");
      toast({ title: "✅ Goal created!" });
    } catch (e) {
      toast({ title: "Failed to create goal", variant: "destructive" });
    }
    setCreating(false);
  };

  const toggleRoadmapStep = async (goalId: string, idx: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.roadmap.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    await updateGoal(goalId, { roadmap: updated });
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    await deleteGoal(id);
    setConfirmDelete(null);
    toast({ title: "Goal deleted" });
  };

  const getProgressPercent = (g: typeof primaryGoal) => {
    if (!g || g.targetValue === g.baselineValue) return 0;
    return Math.min(100, Math.round(((g.currentValue - g.baselineValue) / (g.targetValue - g.baselineValue)) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Goals</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Your Mission</h1>
        </div>
      </div>

      {/* Primary Goal */}
      {primaryGoal && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-5">
          <div className="rounded-2xl border border-primary/15 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">{primaryGoal.title}</h2>
            </div>
            {primaryGoal.why && (
              <p className="text-sm text-muted-foreground mb-4 italic">"{primaryGoal.why}"</p>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{primaryGoal.currentValue} / {primaryGoal.targetValue} {primaryGoal.targetMetric}</span>
                <span>{getProgressPercent(primaryGoal)}%</span>
              </div>
              <Progress value={getProgressPercent(primaryGoal)} className="h-2.5" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <Flame className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{progress.streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <Coins className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{progress.tokens}</p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
            </div>

            {/* Roadmap */}
            {primaryGoal.roadmap.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Roadmap</p>
                <div className="space-y-1.5">
                  {primaryGoal.roadmap.map((step, i) => (
                    <button key={i} onClick={() => toggleRoadmapStep(primaryGoal.id, i)}
                      className="w-full flex items-center gap-2 rounded-xl bg-muted/50 p-2.5 text-left transition-colors hover:bg-muted">
                      {step.done
                        ? <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className={`text-sm ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.step}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {primaryGoal.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Clock className="h-3 w-3" />
                <span>Deadline: {primaryGoal.deadline}</span>
              </div>
            )}

            <button onClick={() => handleDelete(primaryGoal.id)}
              className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/20 transition-colors">
              {confirmDelete === primaryGoal.id ? "Confirm delete" : "Delete goal"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Other Goals */}
      {goals.slice(1).map((goal, i) => (
        <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }} className="mx-5 mb-3">
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={getProgressPercent(goal)} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{getProgressPercent(goal)}%</span>
              </div>
            </div>
            <button onClick={() => handleDelete(goal.id)}
              className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      ))}

      {/* No Goals State */}
      {goals.length === 0 && !showCreate && (
        <div className="mx-5 text-center py-12">
          <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No goals yet</p>
          <p className="text-xs text-muted-foreground/70">Set a goal to track your progress</p>
        </div>
      )}

      {/* Create Goal */}
      {showCreate ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-4">
          <div className="rounded-2xl border border-primary/15 bg-card p-5 space-y-3">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">New Goal</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title (e.g., Master AI prompting)"
              className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40" />
            <input value={why} onChange={e => setWhy(e.target.value)} placeholder="Why this matters to you (optional)"
              className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Metric</p>
                <select value={metric} onChange={e => setMetric(e.target.value)}
                  className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none">
                  <option value="mastery">Mastery %</option>
                  <option value="lessons">Lessons</option>
                  <option value="tokens">Tokens</option>
                  <option value="streak">Streak Days</option>
                  <option value="revenue">Revenue $</option>
                  <option value="clients">Clients</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Target</p>
                <input value={targetVal} onChange={e => setTargetVal(e.target.value)} type="number"
                  className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Starting at</p>
                <input value={baselineVal} onChange={e => setBaselineVal(e.target.value)} type="number"
                  className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Deadline (optional)</p>
                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
                  className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2 text-xs text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Goal
              </button>
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="px-5 mt-2">
          <button onClick={() => setShowCreate(true)}
            className="w-full rounded-2xl border border-dashed border-border p-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
            <Plus className="h-4 w-4" /> Create New Goal
          </button>
        </div>
      )}
    </div>
  );
}
