import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { TRACKS } from "@/lib/data";

export default function LearnPaths() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Learning Paths</p>
        <h1 className="font-display text-h1 text-foreground">Master AI<br/>Skills</h1>
        <p className="text-body text-muted-foreground mt-2">Choose a track and start learning.</p>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-3">
        {TRACKS.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="glass-card p-5 hover:border-primary/20 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{track.icon}</span>
              <div className="flex-1">
                <h3 className="font-display text-body-lg font-bold text-foreground">{track.name}</h3>
                <p className="text-caption text-muted-foreground mt-1">{track.lessons} lessons · {track.completed} completed</p>
                <div className="mt-4 h-1 w-full rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(track.completed / track.lessons) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary mt-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
