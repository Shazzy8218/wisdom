import { motion } from "framer-motion";
import { Trophy, Target, Brain, AlertTriangle, Zap, RotateCcw, BookOpen, ChevronRight, Shield } from "lucide-react";
import type { DrillResult } from "@/lib/mastery-arena";
import ReactMarkdown from "react-markdown";

interface ArenaDebriefProps {
  result: DrillResult;
  onRetry: () => void;
  onBack: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-accent-gold", A: "text-accent-green", B: "text-blue-400",
  C: "text-foreground", D: "text-accent-gold", F: "text-primary",
};

export default function ArenaDebrief({ result, onRetry, onBack }: ArenaDebriefProps) {
  const m = result.metrics;
  const radarMetrics = [
    { key: "decisionSpeed", label: "Speed", value: m.decisionSpeed },
    { key: "strategicForesight", label: "Foresight", value: m.strategicForesight },
    { key: "resourceEfficiency", label: "Efficiency", value: m.resourceEfficiency },
    { key: "adaptability", label: "Adaptability", value: m.adaptability },
    { key: "composure", label: "Composure", value: m.composure },
  ];

  return (
    <div className="px-5 pb-24 space-y-4">
      {/* Grade Banner */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`glass-card p-6 text-center ${result.passed ? "border-accent-green/30" : "border-primary/30"}`}>
        <div className={`text-5xl font-display font-black mb-2 ${GRADE_COLORS[m.overallGrade] || "text-foreground"}`}>
          {m.overallGrade}
        </div>
        <Trophy className={`h-6 w-6 mx-auto mb-2 ${result.passed ? "text-accent-green" : "text-primary"}`} />
        <h2 className="font-display text-h2 text-foreground mb-1">
          {result.passed ? "Drill Passed" : "Drill Failed"}
        </h2>
        <p className="text-caption text-muted-foreground">
          {result.totalScore}/{result.maxScore} points · {Math.round(result.timeUsed / 60)}m {result.timeUsed % 60}s
        </p>
        {result.passed && (
          <p className="text-micro text-accent-green mt-1">+25 tokens · +80 XP earned</p>
        )}
      </motion.div>

      {/* Performance Radar */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="section-label">Performance Audit</h3>
        </div>
        <div className="space-y-3">
          {radarMetrics.map(rm => (
            <div key={rm.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption text-muted-foreground">{rm.label}</span>
                <span className={`font-mono text-caption font-bold ${rm.value >= 7 ? "text-accent-green" : rm.value >= 4 ? "text-accent-gold" : "text-primary"}`}>
                  {rm.value}/10
                </span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${rm.value >= 7 ? "bg-accent-green" : rm.value >= 4 ? "bg-accent-gold" : "bg-primary"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${rm.value * 10}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Decision Timeline */}
      {result.decisions.length > 0 && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-accent-gold" />
            <h3 className="section-label">Decision Tree Analysis</h3>
          </div>
          <div className="space-y-3">
            {result.decisions.map((d, i) => (
              <div key={d.id} className="relative pl-6">
                <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 ${d.score > 0 ? "border-accent-green bg-accent-green/20" : d.score === 0 ? "border-muted bg-surface-2" : "border-primary bg-primary/20"}`} />
                {i < result.decisions.length - 1 && (
                  <div className="absolute left-[5px] top-4 w-0.5 h-full bg-border" />
                )}
                <div className="pb-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-caption font-semibold text-foreground">Turn {i + 1}</p>
                    <span className={`text-micro font-mono font-bold ${d.score > 0 ? "text-accent-green" : d.score === 0 ? "text-muted-foreground" : "text-primary"}`}>
                      {d.score > 0 ? `+${d.score}` : d.score}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{d.action}</p>
                  <p className="text-[11px] text-accent-gold/80 mt-0.5">→ {d.consequence}</p>
                  {d.biasDetected && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">{d.biasDetected}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cognitive Bias Detection */}
      {result.biases.length > 0 && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="section-label">Cognitive Bias Detection</h3>
          </div>
          <div className="space-y-2">
            {result.biases.map((bias, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">{bias}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Feedback */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-accent-gold" />
          <h3 className="section-label">Strategic Debrief</h3>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-caption text-muted-foreground">
          <ReactMarkdown>{result.feedback}</ReactMarkdown>
        </div>
      </motion.div>

      {/* Playbook */}
      {result.playbook.length > 0 && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-accent-green" />
            <h3 className="section-label">Your Strategic Playbook</h3>
          </div>
          <div className="space-y-2">
            {result.playbook.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-accent-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground">
          <RotateCcw className="h-4 w-4" /> Run Another Drill
        </button>
        <button onClick={onBack}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-surface-2 py-3 text-body font-semibold text-foreground hover:bg-surface-hover transition-colors">
          Back to Arena
        </button>
      </div>
    </div>
  );
}
