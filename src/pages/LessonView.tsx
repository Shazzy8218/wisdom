import { useState, useCallback } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, BookOpen, Copy, ArrowRight, Share2, Brain, AlertTriangle, Zap, Quote, RotateCcw } from "lucide-react";
import OwlIcon from "@/components/OwlIcon";
import { getCategoryTrack, type StarterLesson } from "@/lib/categories";
import { generateLesson } from "@/lib/ai-stream";
import { completeModuleLesson, isLessonCompleted, getModuleLessonKey } from "@/lib/progress";
import { refreshProgress } from "@/hooks/useProgress";
import { toast } from "@/hooks/use-toast";
import { saveWisdomSnapshot, type WisdomSnapshot } from "@/lib/wisdom-snapshots";
import DeepDivePanel from "@/components/DeepDivePanel";
import ShareCard from "@/components/ShareCard";

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
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleComplete = () => {
    if (!completed) {
      completeModuleLesson(categoryId || "", level, modIdx, lessonIdx, lesson?.tokens || 10, lesson?.xp || 50);
      setCompleted(true);
      refreshProgress();
      // Save Wisdom Snapshot
      if (lesson) {
        const snapshot: WisdomSnapshot = {
          id: lessonId,
          title: lesson.title,
          mentalModel: lesson.mentalModel || "",
          keyInsight: lesson.hook,
          bragLine: lesson.bragLine || "",
          category: track?.name || "",
          completedAt: Date.now(),
        };
        saveWisdomSnapshot(snapshot);
      }
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

  const handleAskAI = () => {
    const contextParts = [
      `📚 LESSON: "${lesson?.title}"`,
      `📋 TOPIC: ${moduleName} (${track?.name})`,
      `📖 DIFFICULTY: ${diff}`,
      ``, `LESSON CONTENT:`, lesson?.content || lesson?.hook || "",
      ``, `MENTAL MODEL: ${lesson?.mentalModel || "N/A"}`,
      `COMMON MISTAKES: ${lesson?.commonMistakes || "N/A"}`,
      ``, `---`,
      `Please explain this topic in beginner terms. Teach me like I'm completely new.`,
      `Include: 1) Basic explanation 2) 3 real-life examples 3) Mini checklist 4) "Try it now" prompt 5) 1 quiz question 6) Simple diagram (boxes & arrows)`,
    ];
    const encoded = encodeURIComponent(contextParts.join("\n"));
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
        {/* 1. Core Idea + Hook */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="section-label text-primary mb-1">💡 Why This Matters</p>
            <p className="text-body text-foreground font-medium">{lesson.hook}</p>
          </div>
        </motion.div>

        {/* 2. Mental Model */}
        {lesson.mentalModel && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mb-4">
            <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-accent-gold" />
                <p className="section-label text-accent-gold">🧠 The Mental Model</p>
              </div>
              <p className="text-body text-foreground leading-relaxed">{lesson.mentalModel}</p>
            </div>
          </motion.div>
        )}

        <div className="editorial-divider mb-5" />

        {/* 3. Explain Like I'm 10 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-5">
          <p className="section-label text-primary mb-2">🧒 The Lesson</p>
          {lesson.interaction === "tap-reveal" && !revealed ? (
            <button onClick={() => { setRevealed(true); if (!lesson.options) setTimeout(handleComplete, 1000); }}
              className="w-full rounded-2xl bg-surface-2 p-6 text-center text-body font-medium text-muted-foreground transition-colors hover:bg-surface-hover border border-border">
              Tap to reveal →
            </button>
          ) : (
            <div className="glass-card p-5 text-body leading-relaxed text-foreground">
              {lesson.content || "Tap 'Go Deeper' to generate this lesson with AI."}
            </div>
          )}
        </motion.div>

        {/* 4. Visual Diagram */}
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
                    {i < diagramSteps.length - 1 && <div className="w-0.5 h-6 bg-primary/20 my-1" />}
                  </div>
                  <p className="text-caption text-foreground pt-1.5 leading-relaxed">{step.trim()}{step.endsWith(".") ? "" : "."}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 5. Common Mistakes */}
        {lesson.commonMistakes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="mb-5">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="section-label text-destructive">⚠️ Common Mistakes</p>
              </div>
              <p className="text-body text-foreground leading-relaxed">{lesson.commonMistakes}</p>
            </div>
          </motion.div>
        )}

        {/* 6. The Upgrade */}
        {lesson.upgrade && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-5">
            <div className="rounded-2xl border border-accent-green/20 bg-accent-green/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-accent-green" />
                <p className="section-label text-accent-green">⚡ The Upgrade</p>
              </div>
              <p className="text-body text-foreground leading-relaxed">{lesson.upgrade}</p>
            </div>
          </motion.div>
        )}

        {/* 7. Quiz */}
        {lesson.interaction === "choice" && lesson.options && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
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

        {/* 8. Try It Now */}
        {lesson.tryPrompt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mb-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="section-label text-primary mb-2">🚀 Try It Now</p>
              <p className="text-body text-muted-foreground mb-3">{lesson.tryPrompt}</p>
              <button onClick={() => { navigator.clipboard.writeText(lesson.tryPrompt || ""); toast({ title: "Copied!" }); }}
                className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-micro font-semibold text-primary">
                <Copy className="h-3 w-3" /> Copy Prompt
              </button>
            </div>
          </motion.div>
        )}

        {/* 9. Brag Line */}
        {lesson.bragLine && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="mb-5">
            <div className="glass-card p-4 border-accent-gold/15 text-center">
              <Quote className="h-4 w-4 text-accent-gold mx-auto mb-2" />
              <p className="text-body font-semibold text-foreground italic">"{lesson.bragLine}"</p>
              <p className="text-micro text-muted-foreground mt-2">Your new brag line 💪</p>
            </div>
          </motion.div>
        )}

        {/* Reward bar */}
        <div className="glass-card p-4 flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
              ✦ +{lesson.tokens || 10}
            </span>
            <span className="text-caption text-muted-foreground">+{lesson.xp || 50} XP</span>
          </div>
          {!completed ? (
            <button onClick={handleComplete}
              className="rounded-xl bg-primary px-4 py-2 text-micro font-semibold text-primary-foreground">
              Mark Complete
            </button>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-accent-green" />
          )}
        </div>

        <div className="editorial-divider mb-5" />

        {/* Action Buttons */}
        <div className="space-y-2 mb-5">
          <button onClick={handleAskAI}
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all border-primary/10">
            <OwlIcon size={20} />
            <div className="flex-1 text-left">
              <span className="text-body font-medium text-foreground block">Ask Owl about this lesson</span>
              <span className="text-micro text-muted-foreground">Auto-sends context for beginner explanation</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowDeepDive(true)}
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <span className="text-body font-medium text-foreground block">Go Deeper</span>
              <span className="text-micro text-muted-foreground">Full Deep Dive Pack with scenarios & playbook</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowShare(true)}
            className="w-full glass-card p-4 flex items-center gap-3 hover:border-accent-gold/20 transition-all">
            <Share2 className="h-5 w-5 text-accent-gold" />
            <div className="flex-1 text-left">
              <span className="text-body font-medium text-foreground block">Share My Wisdom</span>
              <span className="text-micro text-muted-foreground">Generate a shareable insight card</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Deep Dive Panel */}
        <AnimatePresence>
          {showDeepDive && (
            <DeepDivePanel
              lesson={lesson}
              track={track}
              difficulty={diff}
              onClose={() => setShowDeepDive(false)}
            />
          )}
        </AnimatePresence>

        {/* Share Card */}
        <AnimatePresence>
          {showShare && (
            <ShareCard
              lesson={lesson}
              categoryName={track.name}
              onClose={() => setShowShare(false)}
            />
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
