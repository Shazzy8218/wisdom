import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Layers, ArrowRight } from "lucide-react";
import OwlIcon from "@/components/OwlIcon";

interface CalibrationModalProps {
  onComplete: (goalMode: string, outputMode: string) => void;
}

export default function CalibrationModal({ onComplete }: CalibrationModalProps) {
  const [step, setStep] = useState(0);
  const [goalMode, setGoalMode] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<string | null>(null);

  const handleFinish = () => {
    if (goalMode && outputMode) onComplete(goalMode, outputMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <OwlIcon size={28} />
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Quick Calibration</h2>
          <p className="text-caption text-muted-foreground mt-1">2 questions so Owl adapts to you</p>
          <div className="flex gap-2 justify-center mt-3">
            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 0 ? "bg-primary" : "bg-surface-2"}`} />
            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-surface-2"}`} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-body font-semibold text-foreground">What are you building for?</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setGoalMode("income")}
                  className={`w-full glass-card p-5 text-left transition-all ${goalMode === "income" ? "border-primary/40 bg-primary/5" : "hover:border-primary/15"}`}>
                  <p className="text-body font-semibold text-foreground">💰 Income</p>
                  <p className="text-caption text-muted-foreground mt-1">Speed, cash flow, revenue — get results fast</p>
                </button>
                <button onClick={() => setGoalMode("impact")}
                  className={`w-full glass-card p-5 text-left transition-all ${goalMode === "impact" ? "border-primary/40 bg-primary/5" : "hover:border-primary/15"}`}>
                  <p className="text-body font-semibold text-foreground">🚀 Impact</p>
                  <p className="text-caption text-muted-foreground mt-1">Scalability, legacy, systems — build to last</p>
                </button>
              </div>
              <button onClick={() => goalMode && setStep(1)} disabled={!goalMode}
                className="w-full mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-body font-semibold disabled:opacity-30 transition-opacity">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-primary" />
                <p className="text-body font-semibold text-foreground">How do you like your outputs?</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setOutputMode("blueprints")}
                  className={`w-full glass-card p-5 text-left transition-all ${outputMode === "blueprints" ? "border-primary/40 bg-primary/5" : "hover:border-primary/15"}`}>
                  <p className="text-body font-semibold text-foreground">📐 Structural Blueprints</p>
                  <p className="text-caption text-muted-foreground mt-1">Layouts, logic flows, step-by-step plans, frameworks</p>
                </button>
                <button onClick={() => setOutputMode("components")}
                  className={`w-full glass-card p-5 text-left transition-all ${outputMode === "components" ? "border-primary/40 bg-primary/5" : "hover:border-primary/15"}`}>
                  <p className="text-body font-semibold text-foreground">🧩 Raw Components</p>
                  <p className="text-caption text-muted-foreground mt-1">Templates, scripts, code snippets, copy blocks, checklists</p>
                </button>
              </div>
              <button onClick={handleFinish} disabled={!outputMode}
                className="w-full mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-body font-semibold disabled:opacity-30 transition-opacity">
                Let's Go ✦
              </button>
              <button onClick={() => setStep(0)}
                className="w-full mt-2 text-caption text-muted-foreground hover:text-foreground transition-colors py-2">
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
