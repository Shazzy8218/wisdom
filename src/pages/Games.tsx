import { motion } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { GAMES } from "@/lib/data";

export default function Games() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Games</p>
        <h1 className="font-display text-h1 text-foreground">Learn by<br/>Playing</h1>
        <p className="text-body text-muted-foreground mt-2">Interactive challenges to sharpen your AI skills.</p>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-3">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="glass-card p-5 flex items-center gap-4 cursor-pointer hover:border-primary/20 transition-all duration-200"
          >
            <span className="text-2xl">{game.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-body font-semibold text-foreground">{game.name}</h3>
              <p className="text-caption text-muted-foreground mt-0.5">{game.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="section-label">Level {game.level}</span>
                {game.bestScore > 0 && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span className="flex items-center gap-1 text-micro text-accent-gold font-semibold">
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
