import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, ChevronDown, ChevronUp, Clock, Flame, Plus, X } from "lucide-react";
import {
  DOMAINS, COMPLEXITY_CONFIG, CURATED_SCENARIOS, AI_INTERVENTION_LEVELS,
  type ArenaScenario,
} from "@/lib/mastery-arena";

interface ScenarioConfigProps {
  onStart: (scenario: ArenaScenario) => void;
}

export default function ScenarioConfig({ onStart }: ScenarioConfigProps) {
  const [mode, setMode] = useState<"curated" | "custom">("curated");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [complexity, setComplexity] = useState<keyof typeof COMPLEXITY_CONFIG>("intermediate");
  const [aiIntervention, setAiIntervention] = useState<"neutral" | "antagonist" | "active" | "environmental">("neutral");
  const [customVariables, setCustomVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const filteredScenarios = selectedDomain
    ? CURATED_SCENARIOS.filter(s => s.domain === selectedDomain)
    : CURATED_SCENARIOS;

  const addVariable = () => {
    if (newVariable.trim() && customVariables.length < 6) {
      setCustomVariables(prev => [...prev, newVariable.trim()]);
      setNewVariable("");
    }
  };

  const handleCustomStart = () => {
    if (!customGoal.trim()) return;
    const domain = DOMAINS.find(d => d.id === (selectedDomain || "leadership"))!;
    const scenario: ArenaScenario = {
      id: `custom-${Date.now()}`,
      title: customGoal.slice(0, 60),
      domain: domain.id,
      goal: customGoal,
      complexity,
      timeLimit: 300,
      description: customGoal,
      variables: customVariables,
      tags: ["custom", domain.id],
      icon: domain.icon,
      aiIntervention,
      desiredOutcome: desiredOutcome || undefined,
    };
    onStart(scenario);
  };

  return (
    <div className="px-5 space-y-5 pb-24">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        {([
          { key: "curated" as const, icon: "📋", label: "Drill Library" },
          { key: "custom" as const, icon: "⚡", label: "Custom Scenario" },
        ]).map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`flex-1 py-2.5 rounded-xl text-caption font-semibold transition-all ${mode === m.key ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface-2 text-muted-foreground border border-transparent"}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Domain Filter */}
      <div>
        <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Domain</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSelectedDomain(null)}
            className={`px-3 py-1.5 rounded-lg text-micro font-medium transition-all ${!selectedDomain ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
            All
          </button>
          {DOMAINS.map(d => (
            <button key={d.id} onClick={() => setSelectedDomain(d.id)}
              className={`px-3 py-1.5 rounded-lg text-micro font-medium transition-all ${selectedDomain === d.id ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "curated" ? (
        <div className="space-y-2.5">
          {filteredScenarios.map((s, i) => {
            const cfg = COMPLEXITY_CONFIG[s.complexity];
            const isExpanded = expandedScenario === s.id;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden">
                <button onClick={() => setExpandedScenario(isExpanded ? null : s.id)}
                  className="w-full p-4 text-left hover:bg-surface-hover/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-caption font-bold text-foreground truncate">{s.title}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Variables</p>
                          <div className="space-y-1">
                            {s.variables.map((v, vi) => (
                              <div key={vi} className="flex items-center gap-2 text-[11px] text-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 text-muted-foreground">{t}</span>
                          ))}
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />{Math.round(s.timeLimit * cfg.timeMult / 60)}min
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 text-muted-foreground flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5" />{cfg.turns} turns
                          </span>
                        </div>
                        <button onClick={() => onStart(s)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-caption font-bold text-primary-foreground">
                          <Play className="h-3.5 w-3.5" /> Launch Drill
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Complexity */}
          <div>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Complexity Tier</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(COMPLEXITY_CONFIG) as [keyof typeof COMPLEXITY_CONFIG, typeof COMPLEXITY_CONFIG[keyof typeof COMPLEXITY_CONFIG]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setComplexity(key)}
                  className={`py-2.5 px-3 rounded-xl text-left transition-all ${complexity === key ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface-2 text-muted-foreground border border-transparent"}`}>
                  <p className="text-caption font-semibold">{cfg.label}</p>
                  <p className="text-[9px] text-muted-foreground">{cfg.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Scenario Goal</p>
            <textarea
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              placeholder="Describe the scenario, challenge, or crisis... (e.g., 'Negotiate a hostile acquisition defense while managing board dissent')"
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-2xl p-4 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
            />
          </div>

          {/* Custom Variables */}
          <div>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Context Variables ({customVariables.length}/6)</p>
            <div className="space-y-1.5 mb-2">
              {customVariables.map((v, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 text-caption text-foreground">
                  <span className="flex-1">{v}</span>
                  <button onClick={() => setCustomVariables(prev => prev.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              ))}
            </div>
            {customVariables.length < 6 && (
              <div className="flex gap-2">
                <input value={newVariable} onChange={e => setNewVariable(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVariable(); } }}
                  placeholder="Add variable (e.g., 'Budget: $500K')"
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
                <button onClick={addVariable} disabled={!newVariable.trim()}
                  className="px-3 py-2 rounded-xl bg-primary/15 text-primary disabled:opacity-30">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Advanced Settings Toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <span className="text-micro font-semibold text-foreground">Advanced Settings</span>
            {showAdvanced ? <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden">
                {/* AI Intervention Level */}
                <div>
                  <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Intervention Level</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AI_INTERVENTION_LEVELS.map(level => (
                      <button key={level.id} onClick={() => setAiIntervention(level.id as typeof aiIntervention)}
                        className={`py-2 px-3 rounded-xl text-left transition-all ${aiIntervention === level.id ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface-2 text-muted-foreground border border-transparent"}`}>
                        <p className="text-caption font-semibold">{level.icon} {level.label}</p>
                        <p className="text-[9px] text-muted-foreground">{level.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desired Outcome */}
                <div>
                  <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Desired Learning Outcome (Optional)</p>
                  <input value={desiredOutcome} onChange={e => setDesiredOutcome(e.target.value)}
                    placeholder="e.g., 'Practice negotiation under time pressure'"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleCustomStart} disabled={!customGoal.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-40 transition-opacity">
            <Sparkles className="h-4 w-4" /> Generate & Launch Drill
          </button>
        </div>
      )}
    </div>
  );
}
