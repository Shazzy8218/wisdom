import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Brain, AlertTriangle, Zap, RotateCcw, BookOpen, ChevronRight, Shield, GitBranch, User, TrendingUp, Eye } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"overview" | "decisions" | "counterfactual" | "playbook">("overview");
  const m = result.metrics;

  const radarMetrics = [
    { key: "decisionSpeed", label: "Decision Speed", value: m.decisionSpeed },
    { key: "strategicForesight", label: "Strategic Foresight", value: m.strategicForesight },
    { key: "resourceEfficiency", label: "Resource Efficiency", value: m.resourceEfficiency },
    { key: "adaptability", label: "Adaptability", value: m.adaptability },
    { key: "composure", label: "Composure Under Pressure", value: m.composure },
    { key: "communicationClarity", label: "Communication Clarity", value: m.communicationClarity || 5 },
  ];

  const tabs = [
    { key: "overview" as const, label: "Audit", icon: Target },
    { key: "decisions" as const, label: "Decisions", icon: GitBranch },
    { key: "counterfactual" as const, label: "What-If", icon: Eye },
    { key: "playbook" as const, label: "Playbook", icon: BookOpen },
  ];

  return (
    <div className="px-5 pb-24 space-y-4">
      {/* Grade Banner */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`glass-card p-6 text-center ${result.passed ? "border-accent-green/30" : "border-primary/30"}`}>
        <div className={`text-5xl font-display font-black mb-1 ${GRADE_COLORS[m.overallGrade] || "text-foreground"}`}>
          {m.overallGrade}
        </div>
        <Trophy className={`h-5 w-5 mx-auto mb-2 ${result.passed ? "text-accent-green" : "text-primary"}`} />
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

      {/* Cognitive Archetype */}
      {result.cognitiveArchetype && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
          className="glass-card p-4 border-l-2 border-accent-gold/40">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-accent-gold" />
            <h3 className="text-micro font-bold text-accent-gold uppercase tracking-wider">Cognitive Archetype</h3>
          </div>
          <p className="text-caption font-bold text-foreground mb-0.5">{result.cognitiveArchetype}</p>
          <p className="text-[11px] text-muted-foreground">{result.archetypeDescription}</p>
        </motion.div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all ${activeTab === tab.key ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* Performance Bars */}
            <div className="glass-card p-5">
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
                        initial={{ width: 0 }} animate={{ width: `${rm.value * 10}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biases */}
            {result.biases.length > 0 && (
              <div className="glass-card p-5">
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
              </div>
            )}

            {/* AI Feedback */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-accent-gold" />
                <h3 className="section-label">Strategic Debrief</h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-caption text-muted-foreground">
                <ReactMarkdown>{result.feedback}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "decisions" && (
          <motion.div key="decisions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="h-4 w-4 text-accent-gold" />
              <h3 className="section-label">Decision Tree Analysis</h3>
            </div>
            <div className="space-y-3">
              {result.decisions.map((d, i) => (
                <div key={d.id} className="relative pl-6">
                  <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${d.criticalNode ? "border-accent-gold bg-accent-gold/20" : d.score > 0 ? "border-accent-green bg-accent-green/20" : d.score === 0 ? "border-muted bg-surface-2" : "border-primary bg-primary/20"}`}>
                    {d.criticalNode && <span className="text-[6px]">⭐</span>}
                  </div>
                  {i < result.decisions.length - 1 && (
                    <div className="absolute left-[6px] top-5 w-0.5 h-full bg-border" />
                  )}
                  <div className="pb-4">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-caption font-semibold text-foreground">Turn {i + 1}</p>
                        {d.criticalNode && <span className="text-[8px] bg-accent-gold/15 text-accent-gold px-1.5 py-0.5 rounded font-bold">CRITICAL</span>}
                      </div>
                      <span className={`font-mono text-caption font-bold ${d.score > 0 ? "text-accent-green" : d.score === 0 ? "text-muted-foreground" : "text-primary"}`}>
                        {d.score > 0 ? `+${d.score}` : d.score}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/80 mb-0.5">"{d.action}"</p>
                    <p className="text-[11px] text-accent-gold/80">→ {d.consequence}</p>
                    {d.biasDetected && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-primary font-medium">{d.biasDetected}</span>
                      </div>
                    )}
                    {d.alternativePath && (
                      <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-accent-green/5 border border-accent-green/15">
                        <p className="text-[9px] text-accent-green font-bold uppercase mb-0.5">Better Alternative</p>
                        <p className="text-[10px] text-muted-foreground">{d.alternativePath}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "counterfactual" && (
          <motion.div key="counterfactual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="glass-card p-4 border-l-2 border-accent-green/40">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-accent-green" />
                <h3 className="text-micro font-bold text-accent-green uppercase tracking-wider">Counterfactual Engine</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">What would have happened with different choices at critical junctures.</p>
            </div>
            {(result.counterfactuals || []).length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-6">No counterfactual data for this drill.</p>
            ) : (
              result.counterfactuals.map((cf, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-micro font-bold text-foreground">Turn {cf.turn} — Alternative Path</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${cf.successRate >= 70 ? "bg-accent-green/15 text-accent-green" : cf.successRate >= 40 ? "bg-accent-gold/15 text-accent-gold" : "bg-primary/15 text-primary"}`}>
                      {cf.successRate}% success
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 mb-1">
                    <span className="text-accent-green font-medium">Instead: </span>{cf.alternative}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="text-accent-gold font-medium">Projected: </span>{cf.projectedOutcome}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "playbook" && (
          <motion.div key="playbook" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {result.playbook.length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-accent-green" />
                  <h3 className="section-label">Your Strategic Playbook</h3>
                </div>
                <div className="space-y-2.5">
                  {result.playbook.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-accent-green">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Archetype Summary in Playbook */}
            {result.cognitiveArchetype && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="section-label">Growth Trajectory</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  As a <span className="text-primary font-semibold">{result.cognitiveArchetype}</span>, focus on scenarios that challenge your tendencies. Run drills in domains you avoid to build strategic versatility.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="space-y-2 pt-2">
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
