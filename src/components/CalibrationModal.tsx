import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import OwlIcon from "@/components/OwlIcon";
import { toast } from "@/hooks/use-toast";

interface CalibrationModalProps {
  onComplete: (goalMode: string, outputMode: string) => Promise<void>;
}

const goalOptions = [
  { id: "income", emoji: "💰", label: "Income", desc: "Speed, cash flow, practical wins" },
  { id: "impact", emoji: "🚀", label: "Impact", desc: "Scalability, legacy, long-term build" },
];

const outputOptions = [
  { id: "blueprints", emoji: "📐", label: "Structural Blueprints", desc: "Layouts, systems, flows, strategy" },
  { id: "components", emoji: "🧩", label: "Raw Components", desc: "Scripts, templates, code, assets" },
];

export default function CalibrationModal({ onComplete }: CalibrationModalProps) {
  const [goalMode, setGoalMode] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ready = goalMode && outputMode;

  const handleFinish = async () => {
    if (!goalMode || !outputMode || saving) return;
    setSaving(true);
    try {
      await onComplete(goalMode, outputMode);
      const goalLabel = goalOptions.find(g => g.id === goalMode)?.label;
      const outputLabel = outputOptions.find(o => o.id === outputMode)?.label;
      toast({ title: `Locked in: ${goalLabel} + ${outputLabel}`, description: "Owl is calibrated to you." });
    } catch (e) {
      console.error("Calibration save failed:", e);
      toast({ title: "Save failed — tap to retry", variant: "destructive" });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm md:max-w-lg md:rounded-2xl md:border md:border-border md:bg-card/80 md:backdrop-blur-md md:p-8 md:shadow-xl"
      >
        {/* Header */}
        <div className="text-center mb-8 md:mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex justify-center mb-5"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <OwlIcon size={32} />
            </div>
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Quick Calibration</h2>
          <p className="text-sm text-muted-foreground mt-2">Two questions so Owl adapts to you</p>
        </div>

        {/* Question 1: The Why */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">1 — The Why</p>
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((opt, i) => {
              const selected = goalMode === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGoalMode(opt.id)}
                  className={`relative rounded-2xl p-5 text-left transition-all duration-200 border ${
                    selected
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(355_78%_50%/0.15)]"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}
                  <span className="text-2xl block mb-2">{opt.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Question 2: The How */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">2 — The How</p>
          <div className="grid grid-cols-2 gap-3">
            {outputOptions.map((opt, i) => {
              const selected = outputMode === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOutputMode(opt.id)}
                  className={`relative rounded-2xl p-5 text-left transition-all duration-200 border ${
                    selected
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(355_78%_50%/0.15)]"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}
                  <span className="text-2xl block mb-2">{opt.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Let's Go Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileTap={ready ? { scale: 0.97 } : {}}
          onClick={handleFinish}
          disabled={!ready || saving}
          className={`w-full rounded-2xl py-4 text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
            ready
              ? "bg-primary text-primary-foreground shadow-[0_4px_24px_hsl(355_78%_50%/0.4)] hover:shadow-[0_4px_32px_hsl(355_78%_50%/0.5)]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            "Let's Go ✦"
          )}
        </motion.button>

        {!ready && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Select one option from each question
          </p>
        )}
      </motion.div>
    </div>
  );
}
