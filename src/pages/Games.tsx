import { motion } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { GAMES } from "@/lib/data";

const GAME_ROUTES: Record<string, string> = {
  "hallucination-hunter": "/games/hallucination-hunter",
};

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
        {GAMES.map((game, i) => {
          const route = GAME_ROUTES[game.id];
          const content = (
            <>
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-foreground">{game.name}</h3>
                  <p className="text-caption text-muted-foreground mt-0.5">{game.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="section-label">Level {game.level}</span>
                    {!route && <span className="text-micro text-text-tertiary italic">Coming soon</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
