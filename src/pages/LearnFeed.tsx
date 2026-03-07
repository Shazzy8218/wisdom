import { motion } from "framer-motion";
import { MICRO_LESSONS } from "@/lib/data";
import MicroLessonCard from "@/components/MicroLessonCard";

export default function LearnFeed() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Learn Feed</p>
        <h1 className="font-display text-h1 text-foreground">Swipe. Learn.<br/>Level Up.</h1>
        <p className="text-body text-muted-foreground mt-2">Each card = one micro-lesson. 30–90 seconds.</p>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-5 pb-4">
        {MICRO_LESSONS.map((lesson, i) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <MicroLessonCard lesson={lesson} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
