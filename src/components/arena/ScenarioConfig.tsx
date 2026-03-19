import { useState } from "react";
import { motion } from "framer-motion";
import { Sliders, Sparkles, Play, ChevronRight } from "lucide-react";
import { DOMAINS, COMPLEXITY_CONFIG, CURATED_SCENARIOS, type ArenaScenario } from "@/lib/mastery-arena";

interface ScenarioConfigProps {
  onStart: (scenario: ArenaScenario) => void;
}

export default function ScenarioConfig({ onStart }: ScenarioConfigProps) {
  const [mode, setMode] = useState<"curated" | "custom">("curated");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [complexity, setComplexity] = useState<keyof typeof COMPLEXITY_CONFIG>("intermediate");

  const filteredScenarios = selectedDomain
    ? CURATED_SCENARIOS.filter(s => s.domain === selectedDomain)
    : CURATED_SCENARIOS;

  const handleCustomStart = () => {
    if (!customGoal.trim()) return;
    const domain = DOMAINS.find(d => d.id === (selectedDomain || "leadership"))!;
    const config = COMPLEXITY_CONFIG[complexity];
    const scenario: ArenaScenario = {
      id: `custom-${Date.now()}`,
      title: customGoal.slice(0, 60),
      domain: domain.id,
      goal: customGoal,
      complexity,
      timeLimit: 300,
      description: customGoal,
      variables: [],
      tags: ["custom"],
      icon: domain.icon,
    };
    onStart(scenario);
  };

  return (
    <div className="px-5 space-y-5">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        {(["curated", "custom"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-caption font-semibold transition-all ${mode === m ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface-2 text-muted-foreground border border-transparent"}`}>
            {m === "curated" ? "📋 Drill Library" : "⚡ Custom Scenario"}
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
        /* Curated Drill Library */
        <div className="space-y-2.5">
          {filteredScenarios.map((s, i) => {
            const cfg = COMPLEXITY_CONFIG[s.complexity];
            return (
              <motion.button key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => onStart(s)}
                className="w-full glass-card p-4 text-left hover:border-primary/25 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-caption font-bold text-foreground truncate">{s.title}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5">{s.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 text-muted-foreground">{t}</span>
                      ))}
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 text-muted-foreground">
                        {Math.round(s.timeLimit * cfg.timeMult / 60)}min
                      </span>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-primary shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Custom Scenario Builder */
        <div className="space-y-4">
          <div>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Complexity</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(COMPLEXITY_CONFIG) as [keyof typeof COMPLEXITY_CONFIG, typeof COMPLEXITY_CONFIG[keyof typeof COMPLEXITY_CONFIG]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setComplexity(key)}
                  className={`py-2 rounded-xl text-micro font-semibold transition-all ${complexity === key ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface-2 text-muted-foreground border border-transparent"}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider mb-2">Scenario Goal</p>
            <textarea
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              placeholder="Describe the scenario, challenge, or crisis you want to train for... (e.g., 'Negotiate a hostile acquisition defense while managing board dissent and media pressure')"
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-2xl p-4 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
            />
          </div>

          <button onClick={handleCustomStart} disabled={!customGoal.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-40 transition-opacity">
            <Sparkles className="h-4 w-4" /> Generate & Launch Drill
          </button>
        </div>
      )}
    </div>
  );
}
