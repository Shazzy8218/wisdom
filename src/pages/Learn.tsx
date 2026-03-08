import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Search, BookOpen, Flame, Gamepad2, Zap, Sparkles, Loader2, RefreshCw, Star, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import { MASTERY_CATEGORIES, MICRO_LESSONS, getLevelLabel } from "@/lib/data";
import { CORE_TRACKS, MONEY_TRACK_IDS, getRecommendedTracks } from "@/lib/core-tracks";
import { useProgress } from "@/hooks/useProgress";
import { useGoals } from "@/hooks/useGoals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCalibration } from "@/hooks/useCalibration";
import ProgressRing from "@/components/ProgressRing";
import { Progress } from "@/components/ui/progress";
import {
  loadPersonalizedLessons, savePersonalizedLesson, markPersonalizedLessonComplete,
  extractChatTopics, getUncompletedPersonalizedLessons, type PersonalizedLesson
} from "@/lib/personalized-lessons";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personalized-lesson`;

export default function Learn() {
  const { progress } = useProgress();
  const { primaryGoal } = useGoals();
  const { profile } = useUserProfile();
  const { calibration } = useCalibration();
  const [search, setSearch] = useState("");
  const [personalizedLessons, setPersonalizedLessons] = useState<PersonalizedLesson[]>([]);
  const [generating, setGenerating] = useState(false);
  const [personalizedOpen, setPersonalizedOpen] = useState(false);

  useEffect(() => {
    setPersonalizedLessons(getUncompletedPersonalizedLessons());
  }, []);

  useEffect(() => {
    const uncompleted = getUncompletedPersonalizedLessons();
    if (uncompleted.length === 0) {
      const topics = extractChatTopics();
      if (topics.length > 0) {
        generatePersonalizedLessons();
      }
    }
  }, []);

  const generatePersonalizedLessons = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const topics = extractChatTopics();
      const existing = loadPersonalizedLessons().map(l => l.id);
      const resp = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          chatTopics: topics,
          goalMode: calibration.goalMode,
          outputMode: calibration.outputMode,
          learningStyle: profile.learningStyle,
          existingLessonIds: existing,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.lessons) {
          for (const lesson of data.lessons) {
            savePersonalizedLesson({
              id: lesson.id,
              title: lesson.title,
              hook: lesson.hook,
              content: lesson.content,
              tryPrompt: lesson.tryPrompt,
              source: `Recommended because you discussed: ${lesson.relatedTopic?.slice(0, 40) || "AI topics"}`,
              generatedAt: Date.now(),
              completed: false,
            });
          }
          setPersonalizedLessons(getUncompletedPersonalizedLessons());
        }
      }
    } catch (e) {
      console.error("Failed to generate personalized lessons:", e);
    }
    setGenerating(false);
  }, [generating, calibration, profile.learningStyle]);

  const handleCompletePersonalized = (id: string) => {
    markPersonalizedLessonComplete(id);
    setPersonalizedLessons(prev => prev.filter(l => l.id !== id));
  };

  const nextLesson = useMemo(() => {
    return MICRO_LESSONS.find(l => !progress.completedLessons.includes(l.id)) || MICRO_LESSONS[0];
  }, [progress.completedLessons]);

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

  const goalPercent = primaryGoal && primaryGoal.targetValue > primaryGoal.baselineValue
    ? Math.min(100, Math.round(((primaryGoal.currentValue - primaryGoal.baselineValue) / (primaryGoal.targetValue - primaryGoal.baselineValue)) * 100))
    : 0;

  const hasPersonalized = personalizedLessons.length > 0 || generating;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4">
        <p className="section-label text-primary mb-2">Learn</p>
        <h1 className="font-display text-h1 text-foreground">Your Path</h1>
      </div>

      {/* Personalized for You — collapsible tap */}
      {hasPersonalized && (
        <div className="px-5 mb-4">
          <button
            onClick={() => setPersonalizedOpen(!personalizedOpen)}
            className="glass-card p-4 flex items-center gap-3 w-full text-left hover:border-accent-gold/20 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gold/10">
              <Sparkles className="h-5 w-5 text-accent-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="section-label text-accent-gold mb-0.5">Personalized for you</p>
              <p className="text-caption text-muted-foreground">
                {generating ? "Generating..." : `${personalizedLessons.length} lesson${personalizedLessons.length !== 1 ? "s" : ""} from your chats`}
              </p>
            </div>
            <motion.div animate={{ rotate: personalizedOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {personalizedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2">
                  <div className="flex justify-end">
                    <button onClick={generatePersonalizedLessons} disabled={generating}
                      className="text-micro text-primary hover:underline flex items-center gap-1">
                      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Refresh
                    </button>
                  </div>
                  {personalizedLessons.slice(0, 3).map((lesson, i) => (
                    <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <div className="glass-card p-4 border-accent-gold/10 hover:border-accent-gold/20 transition-all">
                        <p className="text-body font-semibold text-foreground mb-1">{lesson.title}</p>
                        <p className="text-caption text-muted-foreground mb-2">{lesson.hook}</p>
                        <p className="text-micro text-text-tertiary italic mb-2">{lesson.source}</p>
                        <div className="flex gap-2">
                          <Link to={`/?context=${encodeURIComponent(`Teach me about: ${lesson.title}. ${lesson.content}`)}&autoSend=true`}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                            <Zap className="h-3 w-3" /> Start
                          </Link>
                          <button onClick={() => handleCompletePersonalized(lesson.id)}
                            className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                            Done
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {generating && personalizedLessons.length === 0 && (
                    <div className="glass-card p-4 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-caption text-muted-foreground">Generating lessons from your chats...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Your Goal Track */}
      {primaryGoal && (
        <div className="px-5 mb-4">
          <Link to="/goals" className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all block">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="section-label text-primary mb-1">Your Goal</p>
              <p className="text-body font-semibold text-foreground truncate">{primaryGoal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={goalPercent} className="h-1.5 flex-1" />
                <span className="text-micro text-muted-foreground">{goalPercent}%</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      )}

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
                <BookOpen className="h-5 w-5 text-primary" />
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

      {/* Quick Links — removed All Courses and Mastery */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { to: "/feed", icon: BookOpen, label: "Feed" },
          { to: "/drills", icon: Flame, label: "Drills" },
          { to: "/games", icon: Gamepad2, label: "Games" },
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
