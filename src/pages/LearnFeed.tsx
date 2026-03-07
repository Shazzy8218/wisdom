import { motion } from "framer-motion";
import { MICRO_LESSONS } from "@/lib/data";
import MicroLessonCard from "@/components/MicroLessonCard";

export default function LearnFeed() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Learn Feed</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Swipe. Learn. Level Up.</h1>
        <p className="text-sm text-muted-foreground mt-1">Each card = one micro-lesson. 30–90 seconds.</p>
      </div>

      <div className="px-5 space-y-4 pb-4">
        {MICRO_LESSONS.map((lesson, i) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <MicroLessonCard lesson={lesson} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
