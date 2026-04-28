// CAE — ACL-M Scaffolding banner. Tells the user (in Shazzy voice) what tier of delivery they're getting.
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { decideScaffold } from "@/lib/learning-optimizer";
import type { FlagshipModule } from "@/lib/nexus-flagship";

export default function ScaffoldBanner({ mod }: { mod: FlagshipModule }) {
  const decision = decideScaffold(mod);
  const tone = decision.tier === "novice" ? "border-primary/25 from-primary/[0.04]"
            : decision.tier === "expert" ? "border-accent-gold/25 from-accent-gold/[0.04]"
            : "border-border/40 from-surface-2/40";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`glass-card p-3 border bg-gradient-to-br to-transparent ${tone}`}>
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-3 w-3 text-foreground/70" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Adaptive Cognitive Load · {decision.label}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed italic">"{decision.guidance}"</p>
    </motion.div>
  );
}
