import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gamepad2, Trophy, Flame, Zap, Star, ChevronRight } from "lucide-react";
import HiddenOwl from "@/components/HiddenOwl";

interface ArcadeGame {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  category: "action" | "puzzle" | "word";
  color: string;
  description: string;
}

const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "ai-navigator",
    title: "AI Navigator",
    subtitle: "Snake-style collection",
    icon: "🐍",
    route: "/games/ai-navigator",
    category: "action",
    color: "from-emerald-500/20 to-emerald-900/10",
    description: "Navigate through a grid collecting correct AI concepts while avoiding misinformation traps. The longer your streak, the faster you go.",
  },
  {
    id: "logic-link",
    title: "Logic Link",
    subtitle: "Memory card matching",
    icon: "🧩",
    route: "/games/logic-link",
    category: "puzzle",
    color: "from-violet-500/20 to-violet-900/10",
    description: "Flip cards and match AI terms with their definitions. Beat the clock and sharpen your recall under pressure.",
  },
  {
    id: "prompt-pro",
    title: "Prompt Pro",
    subtitle: "Speed typing challenge",
    icon: "⌨️",
    route: "/games/prompt-pro",
    category: "word",
    color: "from-amber-500/20 to-amber-900/10",
    description: "Type AI prompts as fast and accurately as possible. Each round pulls from your active learning tracks.",
  },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  action: { label: "Action", icon: "🎮" },
  puzzle: { label: "Puzzle", icon: "🧠" },
  word: { label: "Word", icon: "📝" },
};

function getArcadeStats(): { gamesPlayed: number; totalScore: number; bestStreak: number } {
  try {
    const raw = localStorage.getItem("wisdom-arcade-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gamesPlayed: 0, totalScore: 0, bestStreak: 0 };
}

export default function Games() {
  const stats = useMemo(getArcadeStats, []);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? ARCADE_GAMES.filter(g => g.category === filter) : ARCADE_GAMES;

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="px-5 pt-14 pb-6 relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Play & Learn</p>
        <h1 className="font-display text-3xl font-black text-foreground leading-tight">
          Knowledge<br />Arcade
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
          Real games. Real skills. Every round reinforces what you're learning — no quizzes, no filler.
        </p>
        <HiddenOwl locationId="arcade-header" className="absolute right-6 top-16" size={18} />
      </div>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground">{stats.gamesPlayed}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Played</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground">{stats.totalScore}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Score</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-accent-gold flex items-center justify-center gap-1">
              <Flame className="h-4 w-4" />{stats.bestStreak}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Streak</p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-5 mb-5 flex gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            !filter ? "bg-primary text-primary-foreground border-primary" : "bg-card/50 text-muted-foreground border-border/50 hover:border-primary/30"
          }`}
        >
          All Games
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? null : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === key ? "bg-primary text-primary-foreground border-primary" : "bg-card/50 text-muted-foreground border-border/50 hover:border-primary/30"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Game Cards */}
      <div className="px-5 space-y-3">
        {filtered.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
          >
            <Link to={game.route} className="block group">
              <div className={`rounded-2xl border border-border/50 bg-gradient-to-br ${game.color} p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5`}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-background/60 flex items-center justify-center text-3xl shrink-0">
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-foreground">{game.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium border border-border/30">
                        {CATEGORY_LABELS[game.category]?.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{game.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-accent-gold flex items-center gap-1 font-semibold">
                        <Zap className="h-3 w-3" /> +25 XP
                      </span>
                      <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                        <Star className="h-3 w-3" /> +5 tokens
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mt-8">
        <div className="rounded-2xl border border-border/30 bg-card/40 p-5 text-center">
          <Gamepad2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            More games unlock as you progress through courses.
          </p>
          <Link to="/courses" className="text-sm font-semibold text-primary hover:underline mt-1 inline-block">
            Explore Courses →
          </Link>
        </div>
      </div>
    </div>
  );
}
