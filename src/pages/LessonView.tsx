import { useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Sparkles, CheckCircle2, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { getCategoryTrack, type StarterLesson } from "@/lib/categories";
import { generateLesson } from "@/lib/ai-stream";
import { completeModuleLesson, isLessonCompleted, getModuleLessonKey, loadProgress } from "@/lib/progress";
import { refreshProgress } from "@/hooks/useProgress";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function LessonView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [search] = useSearchParams();
  const level = search.get("level") || "Beginner";
  const modIdx = parseInt(search.get("mod") || "0", 10);
  const lessonIdx = parseInt(search.get("lesson") || "0", 10);
  const navigate = useNavigate();

  const track = getCategoryTrack(categoryId || "");
  const levelData = track?.levels.find(l => l.level === level);
  const moduleName = levelData?.modules[modIdx] || "Module";

  // Get lesson content
  const diffMap: Record<string, string> = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" };
  const diff = diffMap[level] || "beginner";
  const lessons = track?.starterLessons.filter(l => l.difficulty === diff) || [];
  const lesson = lessons[lessonIdx % Math.max(lessons.length, 1)] as StarterLesson | undefined;

  const lessonId = getModuleLessonKey(categoryId || "", level, modIdx, lessonIdx);
  const [completed, setCompleted] = useState(isLessonCompleted(lessonId));
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deeperContent, setDeeperContent] = useState<string | null>(null);

  const handleComplete = () => {
    if (!completed) {
      completeModuleLesson(categoryId || "", level, modIdx, lessonIdx, lesson?.tokens || 10, lesson?.xp || 50);
      setCompleted(true);
      refreshProgress();
      toast({ title: "Lesson complete! 🎉", description: `+${lesson?.tokens || 10} tokens, +${lesson?.xp || 50} XP` });
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === (lesson?.correctAnswer ?? 0)) {
      setTimeout(() => handleComplete(), 600);
    }
  };

  const handleGoDeeper = async () => {
    setGenerating(true);
    try {
      const result = await generateLesson({
        category: track?.name, difficulty: diff, track: track?.name,
      });
      setDeeperContent(result.content || result.hook);
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleAskAI = () => {
    const q = encodeURIComponent(`Explain more about: ${lesson?.title}. Context: ${lesson?.hook}`);
    navigate(`/chat?context=${q}`);
  };

  const nextLessonUrl = `/category/${categoryId}/lesson?level=${level}&mod=${modIdx}&lesson=${lessonIdx + 1}`;

  if (!track || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to={`/category/${categoryId}/module?level=${level}&mod=${modIdx}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="section-label text-primary truncate">{moduleName}</p>
          <h1 className="font-display text-h3 text-foreground truncate">{lesson.title}</h1>
        </div>
        {completed && <CheckCircle2 className="h-6 w-6 text-accent-green shrink-0" />}
      </div>

      <div className="px-5">
        {/* Hook */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-body text-muted-foreground mb-4">{lesson.hook}</motion.p>

        <div className="editorial-divider mb-5" />

        {/* Content */}
        {lesson.interaction === "tap-reveal" && !revealed ? (
          <button onClick={() => { setRevealed(true); if (!lesson.options) setTimeout(handleComplete, 1000); }}
            className="w-full rounded-2xl bg-surface-2 p-6 text-center text-body font-medium text-muted-foreground transition-colors hover:bg-surface-hover border border-border mb-5">
            Tap to reveal the lesson →
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-5 mb-5 text-body leading-relaxed text-foreground">
            {lesson.content || "This lesson's content is generated by AI. Tap 'Go Deeper' to learn more."}
          </motion.div>
        )}

        {/* Choice interaction */}
        {lesson.interaction === "choice" && lesson.options && (
          <div className="space-y-2 mb-5">
            {lesson.options.map((opt, idx) => (
              <button key={idx} onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
                className={`w-full rounded-2xl border p-4 text-left text-body transition-all duration-200 ${
                  selectedOption === null
                    ? "border-border bg-surface-2 hover:border-primary/30 hover:bg-surface-hover"
                    : selectedOption === idx
                    ? idx === lesson.correctAnswer
                      ? "border-accent-green/50 bg-accent-green/10 text-foreground"
                      : "border-destructive/50 bg-destructive/10"
                    : idx === lesson.correctAnswer
                    ? "border-accent-green/50 bg-accent-green/10"
                    : "border-border bg-surface-2 opacity-40"
                }`}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Try It Now */}
        {lesson.tryPrompt && (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 mb-5">
            <p className="section-label text-primary mb-2">Try It Now</p>
            <p className="text-body text-muted-foreground">{lesson.tryPrompt}</p>
          </div>
        )}

        {/* Reward bar */}
        <div className="glass-card p-4 flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent-gold" /> +{lesson.tokens || 10}
            </span>
            <span className="text-caption text-muted-foreground">+{lesson.xp || 50} XP</span>
          </div>
          {!completed && (
            <button onClick={handleComplete}
              className="rounded-xl bg-primary px-4 py-2 text-micro font-semibold text-primary-foreground">
              Mark Complete
            </button>
          )}
        </div>

        <div className="editorial-divider mb-5" />

        {/* AI Actions */}
        <div className="space-y-2 mb-5">
          <button onClick={handleAskAI}
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-body font-medium text-foreground">Ask AI about this lesson</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </button>
          <button onClick={handleGoDeeper} disabled={generating}
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all">
            {generating ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <BookOpen className="h-5 w-5 text-primary" />}
            <span className="text-body font-medium text-foreground">{generating ? "Generating..." : "Go Deeper"}</span>
          </button>
        </div>

        {/* Deeper content */}
        <AnimatePresence>
          {deeperContent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 mb-5 border-primary/20">
              <p className="section-label text-primary mb-2">AI Deep Dive</p>
              <p className="text-body text-foreground leading-relaxed">{deeperContent}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Lesson */}
        <Link to={nextLessonUrl}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center">
          Next Lesson <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
