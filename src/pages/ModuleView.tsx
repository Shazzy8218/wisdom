import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { getCategoryTrack } from "@/lib/categories";
import { isLessonCompleted, getModuleLessonKey } from "@/lib/progress";

export default function ModuleView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [search] = useSearchParams();
  const level = search.get("level") || "Beginner";
  const modIdx = parseInt(search.get("mod") || "0", 10);

  const track = getCategoryTrack(categoryId || "");
  const levelData = track?.levels.find(l => l.level === level);
  const moduleName = levelData?.modules[modIdx] || "Module";

  const diffMap: Record<string, string> = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" };
  const diff = diffMap[level] || "beginner";
  const lessons = track?.starterLessons.filter(l => l.difficulty === diff) || [];
  const totalLessons = Math.max(lessons.length, 5);

  const completedCount = Array.from({ length: totalLessons }, (_, i) =>
    isLessonCompleted(getModuleLessonKey(categoryId || "", level, modIdx, i))
  ).filter(Boolean).length;

  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (!track || !levelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Module not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to={`/category/${categoryId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <p className="section-label text-primary">{track.icon} {level}</p>
          <h1 className="font-display text-h3 text-foreground">{moduleName}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 mb-5">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-muted-foreground">{completedCount}/{totalLessons} lessons completed</span>
            <span className="text-caption font-semibold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Lessons list */}
      <div className="px-5 space-y-2">
        <p className="section-label mb-3">Lessons</p>
        {Array.from({ length: totalLessons }, (_, i) => {
          const lesson = lessons[i % lessons.length];
          const lid = getModuleLessonKey(categoryId || "", level, modIdx, i);
          const done = isLessonCompleted(lid);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}>
              <Link to={`/category/${categoryId}/lesson?level=${level}&mod=${modIdx}&lesson=${i}`}
                className={`glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all block ${done ? "border-accent-green/20" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${done ? "bg-accent-green/10" : "bg-surface-2"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4 text-accent-green" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground truncate">{lesson?.title || `Lesson ${i + 1}`}</p>
                  <p className="text-micro text-muted-foreground truncate">{lesson?.hook || "AI-generated lesson content"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
