import { motion } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { GAMES } from "@/lib/data";

export default function Games() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Games</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Learn by Playing</h1>
        <p className="text-sm text-muted-foreground mt-1">Interactive challenges to sharpen your AI skills.</p>
      </div>

      <div className="px-5 space-y-3">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-primary/20 transition-colors"
          >
            <span className="text-3xl">{game.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{game.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{game.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Level {game.level}</span>
                {game.bestScore > 0 && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-accent-gold">
                      <Trophy className="h-3 w-3" /> {game.bestScore}
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
