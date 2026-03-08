import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Briefcase, Target, Flame, Zap, TrendingUp } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";

interface VaultSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function VaultSidebar({ open, onClose }: VaultSidebarProps) {
  const { progress } = useProgress();
  const { profile } = useUserProfile();

  const masteryScores = progress.masteryScores || {};
  const values = Object.values(masteryScores).filter(v => typeof v === "number") as number[];
  const overallMastery = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  const stats = [
    { label: "NET WORTH", value: `${progress.tokens} WT`, icon: DollarSign, color: "text-primary" },
    { label: "MASTERY", value: `${overallMastery}%`, icon: Target, color: "text-accent-blue" },
    { label: "STREAK", value: `${progress.streak}d`, icon: Flame, color: "text-accent-red" },
    { label: "XP", value: String(progress.xp || 0), icon: TrendingUp, color: "text-accent-green" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
          <motion.aside
            initial={{ x: 280 }} animate={{ x: 0 }} exit={{ x: 280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[280px] bg-card border-l border-border z-50 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold text-primary tracking-wider">THE VAULT</span>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-surface-2 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto hide-scrollbar">
              <p className="section-label">PERFORMANCE METRICS</p>
              <div className="grid grid-cols-2 gap-2">
                {stats.map(stat => (
                  <div key={stat.label} className="p-3 rounded-lg border border-border bg-surface-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <stat.icon className={`h-3 w-3 ${stat.color}`} />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className={`font-mono text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="mt-4">
                <p className="section-label mb-2">ACTIVE PROJECTS</p>
                <div className="space-y-1.5">
                  {(progress.completedModules as string[] || []).length > 0 ? (
                    (progress.completedModules as string[]).slice(0, 5).map((mod, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded border border-border text-xs font-mono text-muted-foreground">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="truncate">{mod}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-mono text-muted-foreground/50 py-2">No projects tracked yet.</p>
                  )}
                </div>
              </div>

              {/* Calibration */}
              <div className="mt-4">
                <p className="section-label mb-2">CALIBRATION</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground">MODE</span>
                    <span className="text-xs font-mono font-bold text-primary uppercase">
                      {(profile as any).goalMode || "income"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground">OUTPUT</span>
                    <span className="text-xs font-mono font-bold text-accent-blue uppercase">
                      {profile.outputMode || "blueprints"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-[9px] font-mono text-muted-foreground/40 text-center tracking-widest">
                WISDOM OWL OS v2.0
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
