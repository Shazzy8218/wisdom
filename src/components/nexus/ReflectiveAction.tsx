// CAE — Reflective Practice prompt at end of module. Saves to local reflections.
import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Check } from "lucide-react";
import { saveReflection } from "@/lib/learning-optimizer";
import { toast } from "@/hooks/use-toast";

export default function ReflectiveAction({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const [text, setText] = useState("");
  const [action, setAction] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (!text.trim() || !action.trim()) return;
    saveReflection({ moduleId, text: text.trim(), actionItem: action.trim(), ts: Date.now() });
    setSaved(true);
    toast({ title: "Reflection logged.", description: "Now go execute the action item within 24h." });
  };

  if (saved) {
    return (
      <div className="glass-card p-4 border border-accent-green/30 bg-accent-green/[0.05] flex items-center gap-3">
        <Check className="h-4 w-4 text-accent-green" />
        <div>
          <p className="text-sm font-semibold text-foreground">Reflection saved.</p>
          <p className="text-xs text-muted-foreground">"{action}" — execute within 24h.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border border-accent-gold/25 bg-gradient-to-br from-accent-gold/[0.04] to-transparent">
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-3.5 w-3.5 text-accent-gold" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">Reflective Practice · Knowledge → Reality</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Lock the transfer. Where in your current life or work does "{moduleTitle}" apply, and what is the single action you'll take in the next 24 hours?
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Where this applies right now..."
        rows={2}
        className="w-full bg-surface-2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-accent-gold/40 focus:outline-none resize-none"
      />
      <input
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder="🎯 Action I'll take in 24h..."
        className="mt-2 w-full bg-surface-2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-accent-gold/40 focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={!text.trim() || !action.trim()}
        className="mt-2 rounded-xl bg-accent-gold/90 hover:bg-accent-gold text-background text-[11px] font-bold px-3 py-1.5 disabled:opacity-40 transition-colors"
      >
        Lock reflection
      </button>
    </motion.div>
  );
}
