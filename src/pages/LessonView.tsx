import { useState, useCallback } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Sparkles, CheckCircle2, ChevronRight, Loader2, BookOpen, Copy, Lightbulb, ArrowRight } from "lucide-react";
import { getCategoryTrack, type StarterLesson } from "@/lib/categories";
import { generateLesson } from "@/lib/ai-stream";
import { completeModuleLesson, isLessonCompleted, getModuleLessonKey } from "@/lib/progress";
import { refreshProgress } from "@/hooks/useProgress";
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
    // Build full context payload and auto-send
    const contextParts = [
      `📚 LESSON: "${lesson?.title}"`,
      `📋 TOPIC: ${moduleName} (${track?.name})`,
      `📖 DIFFICULTY: ${diff}`,
      ``,
      `LESSON CONTENT:`,
      lesson?.content || lesson?.hook || "",
      ``,
      `KEY OBJECTIVES: Understand ${lesson?.title?.toLowerCase()}`,
      ``,
      `---`,
      `Please explain this topic in beginner terms. Teach me like I'm completely new to this. Use simple examples, step-by-step explanations.`,
      ``,
      `Include in your response:`,
      `1. A basic explanation (dummy-proof, anyone can understand)`,
      `2. 3 real-life examples`,
      `3. A mini checklist (key takeaways)`,
      `4. A "Try it now" prompt I can use immediately`,
      `5. 1 tiny quiz question to test my understanding`,
      `6. A simple diagram description (boxes and arrows)`,
    ];
    const fullContext = contextParts.join("\n");
    const encoded = encodeURIComponent(fullContext);
    navigate(`/chat?context=${encoded}&lessonId=${lessonId}&autoSend=true`);
  };

  const nextLessonUrl = `/category/${categoryId}/lesson?level=${level}&mod=${modIdx}&lesson=${lessonIdx + 1}`;

  if (!track || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  // Build visual diagram based on lesson
  const diagramSteps = lesson.content
    ? lesson.content.split(". ").filter(s => s.length > 10).slice(0, 4)
    : [lesson.hook];

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="section-label text-primary mb-1">💡 Why This Matters</p>
            <p className="text-body text-foreground font-medium">{lesson.hook}</p>
          </div>
        </motion.div>

        <div className="editorial-divider mb-5" />

        {/* Explain Like I'm 10 section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-5">
          <p className="section-label text-primary mb-2">🧒 Explain Like I'm 10</p>
          {lesson.interaction === "tap-reveal" && !revealed ? (
            <button onClick={() => { setRevealed(true); if (!lesson.options) setTimeout(handleComplete, 1000); }}
              className="w-full rounded-2xl bg-surface-2 p-6 text-center text-body font-medium text-muted-foreground transition-colors hover:bg-surface-hover border border-border">
              Tap to reveal the lesson →
            </button>
          ) : (
            <div className="glass-card p-5 text-body leading-relaxed text-foreground">
              {lesson.content || "This lesson's content is generated by AI. Tap 'Go Deeper' to learn more."}
            </div>
          )}
        </motion.div>

        {/* Visual Diagram */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-5">
          <p className="section-label text-primary mb-2">📊 Visual Breakdown</p>
          <div className="glass-card p-4 overflow-hidden">
            <div className="space-y-0">
              {diagramSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary text-micro font-bold">
                      {i + 1}
                    </div>
                    {i < diagramSteps.length - 1 && (
                      <div className="w-0.5 h-6 bg-primary/20 my-1" />
                    )}
                  </div>
                  <p className="text-caption text-foreground pt-1.5 leading-relaxed">{step.trim()}{step.endsWith(".") ? "" : "."}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Choice interaction */}
        {lesson.interaction === "choice" && lesson.options && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-5">
            <p className="section-label text-primary mb-2">🎯 Quick Check</p>
            <div className="space-y-2">
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
              {selectedOption !== null && selectedOption !== lesson.correctAnswer && (
                <p className="text-caption text-muted-foreground mt-1">The correct answer is highlighted in green. Tap "Ask AI" to learn why!</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Try It Now */}
        {lesson.tryPrompt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mb-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="section-label text-primary mb-2">🚀 Try It Now</p>
              <p className="text-body text-muted-foreground mb-3">{lesson.tryPrompt}</p>
              <button onClick={() => { navigator.clipboard.writeText(lesson.tryPrompt || ""); toast({ title: "Copied to clipboard!" }); }}
                className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-micro font-semibold text-primary">
                <Copy className="h-3 w-3" /> Copy Prompt
              </button>
            </div>
          </motion.div>
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
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all border-primary/10">
            <Bot className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <span className="text-body font-medium text-foreground block">Ask AI about this lesson</span>
              <span className="text-micro text-muted-foreground">Auto-sends lesson context for beginner explanation</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
