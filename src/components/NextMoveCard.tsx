import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Suggestion } from "@/lib/analytics-engine";
import OwlIcon from "./OwlIcon";

interface Props {
  suggestion: Suggestion;
  delay?: number;
}

export default function NextMoveCard({ suggestion, delay = 0 }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Link
        to={suggestion.action?.to || "/learn"}
        className="glass-card light-tunnel p-4 flex items-start gap-3 group hover:border-primary/20 transition-all block"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5"
        >
          <OwlIcon size={16} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3 w-3 text-accent-gold" />
            </motion.div>
            <span className="text-micro font-semibold text-accent-gold uppercase tracking-wider">
              {suggestion.type === "next-move" ? "Next Move" :
               suggestion.type === "focus-today" ? "Focus Today" :
               suggestion.type === "avoiding" ? "Blind Spot" :
               suggestion.type === "slowing-down" ? "Heads Up" : "Recommended"}
            </span>
          </div>
          <p className="text-body font-semibold text-foreground leading-snug">{suggestion.title}</p>
          <p className="text-caption text-muted-foreground mt-0.5 leading-relaxed">{suggestion.body}</p>
          {suggestion.reason && (
            <p className="text-micro text-primary/70 mt-1.5 italic">{suggestion.reason}</p>
          )}
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-2" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
