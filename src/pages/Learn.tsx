import { motion } from "framer-motion";
import { ChevronRight, Search, BookOpen, Flame, Gamepad2, BarChart3, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { MASTERY_CATEGORIES, MICRO_LESSONS, getLevelLabel } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import ProgressRing from "@/components/ProgressRing";

export default function Learn() {
  const { progress } = useProgress();
  const [search, setSearch] = useState("");

  // Find first incomplete lesson as "Your next lesson"
  const nextLesson = useMemo(() => {
    return MICRO_LESSONS.find(l => !progress.completedLessons.includes(l.id)) || MICRO_LESSONS[0];
  }, [progress.completedLessons]);

  // Recommended path = lowest mastery category
  const recommendedPath = useMemo(() => {
    const sorted = [...MASTERY_CATEGORIES].sort((a, b) => {
      const sa = progress.masteryScores[a.id] || 0;
      const sb = progress.masteryScores[b.id] || 0;
      return sa - sb;
    });
    return sorted[0];
  }, [progress.masteryScores]);

  const filteredCategories = MASTERY_CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4">
        <p className="section-label text-primary mb-2">Learn</p>
        <h1 className="font-display text-h1 text-foreground">Your Path</h1>
      </div>

      {/* Start Here */}
      {recommendedPath && (
        <div className="px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={`/category/${recommendedPath.id}`}
              className="glass-card p-5 flex items-center gap-4 group hover:border-primary/20 transition-all block">
              <span className="text-2xl">{recommendedPath.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="section-label text-primary mb-1">Start here</p>
                <p className="text-body font-semibold text-foreground">{recommendedPath.name}</p>
                <p className="text-caption text-muted-foreground">{getLevelLabel(progress.masteryScores[recommendedPath.id] || 0)} · {progress.masteryScores[recommendedPath.id] || 0}%</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </motion.div>
        </div>
      )}

      {/* Your Next Lesson */}
      {nextLesson && (
        <div className="px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Link to="/feed"
              className="glass-card p-5 flex items-center gap-4 group hover:border-primary/20 transition-all block">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="section-label text-accent-gold mb-1">Your next lesson</p>
                <p className="text-body font-semibold text-foreground">{nextLesson.title}</p>
                <p className="text-caption text-muted-foreground">+{nextLesson.tokens} tokens</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </motion.div>
        </div>
      )}

      <div className="editorial-divider mx-5 mb-4" />

      {/* Quick Links */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { to: "/feed", icon: BookOpen, label: "Feed" },
          { to: "/paths", icon: BarChart3, label: "All Courses" },
          { to: "/drills", icon: Flame, label: "Drills" },
          { to: "/games", icon: Gamepad2, label: "Games" },
          { to: "/mastery", icon: BarChart3, label: "Mastery" },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 py-2 text-caption font-medium text-muted-foreground hover:bg-surface-hover transition-colors whitespace-nowrap">
            <item.icon className="h-3.5 w-3.5" /> {item.label}
          </Link>
        ))}
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Browse Topics */}
      <div className="px-5">
        <p className="section-label mb-3">Browse topics</p>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 mb-4">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..."
            className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
        </div>

        <div className="space-y-1.5">
          {filteredCategories.map((cat, i) => {
            const score = progress.masteryScores[cat.id] || 0;
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}>
                <Link to={`/category/${cat.id}`}
                  className="glass-card p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all block">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-foreground">{cat.name}</p>
                    <p className="text-micro text-muted-foreground">{getLevelLabel(score)} · {score}%</p>
                  </div>
                  <ProgressRing value={score} size={30} strokeWidth={2} />
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
