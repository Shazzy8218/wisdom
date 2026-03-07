import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";
import { TRACKS } from "@/lib/data";

export default function LearnPaths() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Learning Paths</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Master AI Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a track and start learning.</p>
      </div>

      <div className="px-5 space-y-3">
        {TRACKS.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`glass-card p-5 bg-gradient-to-br ${track.color} hover:border-primary/20 transition-colors cursor-pointer`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{track.icon}</span>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-foreground">{track.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{track.lessons} lessons · {track.completed} completed</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(track.completed / track.lessons) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  />
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-text-tertiary mt-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
