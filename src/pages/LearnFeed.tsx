import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MICRO_LESSONS } from "@/lib/data";
import MicroLessonCard from "@/components/MicroLessonCard";
import { generateLesson } from "@/lib/ai-stream";
import { Sparkles, Loader2 } from "lucide-react";
import type { MicroLesson } from "@/lib/data";

export default function LearnFeed() {
  const [lessons, setLessons] = useState<MicroLesson[]>(MICRO_LESSONS);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const tracks = ["AI Basics", "Prompting & Communication", "Productivity & Business", "Creativity", "AI for Daily Life"];
      const track = tracks[Math.floor(Math.random() * tracks.length)];
      const lesson = await generateLesson({ track, excludeIds: lessons.map(l => l.id) });
      setLessons(prev => [...prev, lesson]);
    } catch (err) {
      console.error("Failed to generate lesson:", err);
    }
    setLoadingMore(false);
  }, [loadingMore, lessons]);

  // Auto-load when near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Learn Feed</p>
        <h1 className="font-display text-h1 text-foreground">Swipe. Learn.<br/>Level Up.</h1>
        <p className="text-body text-muted-foreground mt-2">Each card = one micro-lesson. 30–90 seconds.</p>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-5 pb-4">
        {lessons.map((lesson, i) => (
          <motion.div key={lesson.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.08, 0.5), duration: 0.4 }}>
            <MicroLessonCard lesson={lesson} />
          </motion.div>
        ))}
      </div>

      {/* Load more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-caption text-muted-foreground">Generating new lesson...</span>
        </div>
      )}

      {/* Manual load more */}
      <div className="px-5 pb-8">
        <button onClick={loadMore} disabled={loadingMore}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all">
          <Sparkles className="h-4 w-4" /> Load More Lessons
        </button>
      </div>
    </div>
  );
}
