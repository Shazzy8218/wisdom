// CAE — CTA "Why this matters to YOUR goal" panel.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoals, type UserGoal } from "@/hooks/useGoals";
import { getCachedRelevance, setCachedRelevance } from "@/lib/learning-optimizer";

export default function WhyThisMatters({ moduleId, moduleTitle, moduleHook }: { moduleId: string; moduleTitle: string; moduleHook?: string }) {
  const { primaryGoal } = useGoals();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const goalId = primaryGoal?.id || null;
    const cached = getCachedRelevance(moduleId, goalId);
    if (cached) { setText(cached); return; }
    setLoading(true);
    (async () => {
      try {
        const goalPayload: Partial<UserGoal> | null = primaryGoal ? {
          title: primaryGoal.title,
          targetMetric: primaryGoal.targetMetric,
          targetValue: primaryGoal.targetValue,
          currentValue: primaryGoal.currentValue,
        } : null;
        const { data, error } = await supabase.functions.invoke("nexus-relevance", {
          body: { moduleTitle, moduleHook, goal: goalPayload },
        });
        if (!error && data?.text) {
          setText(data.text);
          setCachedRelevance(moduleId, goalId, data.text);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [moduleId, moduleTitle, moduleHook, primaryGoal]);

  if (loading) {
    return (
      <div className="glass-card p-3 border border-border/40 animate-pulse">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Linking to your goal...</p>
      </div>
    );
  }
  if (!text) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border border-accent-green/25 bg-gradient-to-br from-accent-green/[0.04] to-transparent">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-3.5 w-3.5 text-accent-green" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent-green">
          {primaryGoal ? `Why this matters to "${primaryGoal.title}"` : "Why this matters"}
        </p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
    </motion.div>
  );
}
