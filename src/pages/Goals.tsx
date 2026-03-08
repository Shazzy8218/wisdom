import { useState } from "react";
import { motion } from "framer-motion";
import { Target, ChevronLeft, Plus, Trash2, CheckCircle, Circle, TrendingUp, Flame, Coins, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGoals } from "@/hooks/useGoals";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

export default function Goals() {
  const { goals, primaryGoal, createGoal, updateGoal, deleteGoal } = useGoals();
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

  const handleCreate = async () => {
    if (!title.trim()) { toast({ title: "Enter a goal title" }); return; }
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
    toast({ title: "Goal created!" });
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

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <p className="section-label text-primary mb-1">Goals</p>
          <h1 className="font-display text-h1 text-foreground">Your Mission</h1>
        </div>
      </div>

      {/* Primary Goal Scoreboard */}
      {primaryGoal && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-5">
          <div className="glass-card p-5 border-primary/15">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">{primaryGoal.title}</h2>
            </div>
            {primaryGoal.why && (
              <p className="text-caption text-muted-foreground mb-4 italic">"{primaryGoal.why}"</p>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-micro text-muted-foreground mb-1.5">
                <span>{primaryGoal.currentValue} / {primaryGoal.targetValue} {primaryGoal.targetMetric}</span>
                <span>{getProgressPercent(primaryGoal)}%</span>
              </div>
              <Progress value={getProgressPercent(primaryGoal)} className="h-2.5" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl bg-surface-2 p-3 text-center">
                <Flame className="h-4 w-4 text-accent-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{progress.streak}</p>
                <p className="text-micro text-muted-foreground">Streak</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-3 text-center">
                <Coins className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{progress.tokens}</p>
                <p className="text-micro text-muted-foreground">Tokens</p>
              </div>
            </div>

            {/* Roadmap */}
            {primaryGoal.roadmap.length > 0 && (
              <div className="mb-3">
                <p className="section-label mb-2">Roadmap</p>
                <div className="space-y-1.5">
                  {primaryGoal.roadmap.map((step, i) => (
                    <button key={i} onClick={() => toggleRoadmapStep(primaryGoal.id, i)}
                      className="w-full flex items-center gap-2 rounded-lg bg-surface-2 p-2.5 text-left transition-colors hover:bg-surface-hover">
                      {step.done
                        ? <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className={`text-caption ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.step}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {primaryGoal.deadline && (
              <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Deadline: {primaryGoal.deadline}</span>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Link to={`/?context=${encodeURIComponent(`I'm working toward: "${primaryGoal.title}". My current progress is ${primaryGoal.currentValue}/${primaryGoal.targetValue} ${primaryGoal.targetMetric}. What should I do next?`)}&autoSend=true`}
                className="flex-1 rounded-xl bg-primary/10 px-3 py-2 text-caption font-medium text-primary text-center hover:bg-primary/20 transition-colors">
                Ask Owl: Next Move
              </Link>
              <button onClick={() => handleDelete(primaryGoal.id)}
                className="rounded-xl bg-surface-2 px-3 py-2 text-caption text-muted-foreground hover:text-destructive transition-colors">
                {confirmDelete === primaryGoal.id ? "Confirm" : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Other Goals */}
      {goals.slice(1).map((goal, i) => (
        <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }} className="mx-5 mb-3">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-foreground truncate">{goal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={getProgressPercent(goal)} className="h-1.5 flex-1" />
                <span className="text-micro text-muted-foreground">{getProgressPercent(goal)}%</span>
              </div>
            </div>
            <button onClick={() => handleDelete(goal.id)}
              className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3 w-3 text-text-tertiary" />
            </button>
          </div>
        </motion.div>
      ))}

      {/* Create Goal */}
      {showCreate ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-4">
          <div className="glass-card p-5 border-primary/15 space-y-3">
            <p className="section-label text-primary">New Goal</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title (e.g., Master AI prompting)"
              className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-body text-foreground placeholder:text-text-tertiary outline-none focus:border-primary/40" />
            <input value={why} onChange={e => setWhy(e.target.value)} placeholder="Why this matters to you (optional)"
              className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-caption text-foreground placeholder:text-text-tertiary outline-none focus:border-primary/40" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-micro text-muted-foreground mb-1">Metric</p>
                <select value={metric} onChange={e => setMetric(e.target.value)}
                  className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-caption text-foreground outline-none">
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
                <p className="text-micro text-muted-foreground mb-1">Target</p>
                <input value={targetVal} onChange={e => setTargetVal(e.target.value)} type="number"
                  className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-caption text-foreground outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-micro text-muted-foreground mb-1">Starting at</p>
                <input value={baselineVal} onChange={e => setBaselineVal(e.target.value)} type="number"
                  className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-caption text-foreground outline-none" />
              </div>
              <div>
                <p className="text-micro text-muted-foreground mb-1">Deadline (optional)</p>
                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
                  className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-caption text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-caption font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Create Goal
              </button>
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="px-5">
          <button onClick={() => setShowCreate(true)}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all">
            <Plus className="h-4 w-4" /> Create New Goal
          </button>
        </div>
      )}
    </div>
  );
}
