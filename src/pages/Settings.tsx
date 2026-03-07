import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Trash2, Eye, RotateCcw, Wifi, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { streamChat, generateLesson, generateGameQuestion } from "@/lib/ai-stream";

interface MemoryToggle {
  id: string;
  label: string;
  description: string;
}

const MEMORY_TOGGLES: MemoryToggle[] = [
  { id: "goals", label: "Remember goals", description: "AI remembers your learning goals" },
  { id: "style", label: "Remember explanation style", description: "AI adapts to your preferred teaching style" },
  { id: "industry", label: "Remember industry/tools", description: "AI references your industry context" },
  { id: "workflows", label: "Remember saved workflows", description: "AI recalls your custom workflows" },
];

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetMemory = () => {
    setToggles({});
    toast({ title: "Memory Reset", description: "All AI memory has been cleared." });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Settings</p>
        <h1 className="font-display text-h1 text-foreground">Preferences</h1>
      </div>

      {/* AI Memory */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="section-label text-primary">AI Memory (Consent-Only)</h2>
        </div>
        <p className="text-caption text-muted-foreground mb-4">These settings are OFF by default. Your data is never stored without your permission.</p>

        <div className="space-y-2">
          {MEMORY_TOGGLES.map((toggle, i) => (
            <motion.div key={toggle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-body font-medium text-foreground">{toggle.label}</p>
                <p className="text-micro text-muted-foreground">{toggle.description}</p>
              </div>
              <button onClick={() => handleToggle(toggle.id)}
                className={`relative h-6 w-11 rounded-full transition-colors ${toggles[toggle.id] ? "bg-primary" : "bg-surface-2 border border-border"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${toggles[toggle.id] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <Eye className="h-3.5 w-3.5" /> View Memory
          </button>
          <button onClick={handleResetMemory} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-primary hover:bg-primary/10 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </button>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Display */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">Display</h2>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">Reduce Motion</p>
            <p className="text-micro text-muted-foreground">Minimize animations</p>
          </div>
          <button onClick={() => setReduceMotion(!reduceMotion)}
            className={`relative h-6 w-11 rounded-full transition-colors ${reduceMotion ? "bg-primary" : "bg-surface-2 border border-border"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${reduceMotion ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* AI Connection Test */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">AI Connection Test</h2>
        <AIConnectionTest />
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Danger Zone */}
      <div className="px-5">
        <h2 className="section-label mb-4 text-primary">Danger Zone</h2>
        <button className="glass-card p-4 w-full flex items-center gap-3 text-left border-primary/20 hover:border-primary/40 transition-all">
          <Trash2 className="h-4 w-4 text-primary" />
          <div>
            <p className="text-body font-medium text-primary">Delete All Data</p>
            <p className="text-micro text-muted-foreground">Remove all progress, tokens, and saved content</p>
          </div>
        </button>
      </div>
    </div>
  );
}
