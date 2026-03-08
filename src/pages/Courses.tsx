import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search, Zap, Sparkles, Loader2, RefreshCw, ChevronDown, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { MASTERY_CATEGORIES, MICRO_LESSONS, getLevelLabel } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { useGoals } from "@/hooks/useGoals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCalibration } from "@/hooks/useCalibration";
import ProgressRing from "@/components/ProgressRing";
import {
  loadPersonalizedLessons, savePersonalizedLesson, markPersonalizedLessonComplete,
  extractChatTopics, getUncompletedPersonalizedLessons, type PersonalizedLesson
} from "@/lib/personalized-lessons";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personalized-lesson`;

type Tab = "catalog" | "personalized";
type PLFilter = "newest" | "goal" | "category" | "difficulty";

export default function Courses() {
  const [tab, setTab] = useState<Tab>("catalog");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "instant" });
  }, [tab]);

  return (
    <div className="min-h-screen pb-24" ref={topRef}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="section-label text-primary mb-2">Courses</p>
        <h1 className="font-display text-h1 text-foreground">Your Learning Hub</h1>
      </div>

      {/* Segmented Control */}
      <div className="px-5 mb-4">
        <div className="flex rounded-2xl bg-secondary p-1 gap-1">
          {([
            { id: "catalog" as Tab, label: "Catalog" },
            { id: "personalized" as Tab, label: "For You" },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl py-2.5 text-caption font-semibold transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "catalog" ? (
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <CatalogTab />
          </motion.div>
        ) : (
          <motion.div key="personalized" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <PersonalizedTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── CATALOG TAB ─── */
function CatalogTab() {
  const { progress } = useProgress();
  const [search, setSearch] = useState("");
  const [masteryExpanded, setMasteryExpanded] = useState(false);

  const categoriesWithScores = useMemo(() =>
    MASTERY_CATEGORIES.map(c => ({ ...c, score: progress.masteryScores[c.id] || 0 })),
    [progress.masteryScores]
  );

  const globalScore = useMemo(() =>
    categoriesWithScores.length > 0
      ? Math.round(categoriesWithScores.reduce((s, c) => s + c.score, 0) / categoriesWithScores.length)
      : 0,
    [categoriesWithScores]
  );

  const recommendedPath = useMemo(() => {
    const sorted = [...categoriesWithScores].sort((a, b) => a.score - b.score);
    return sorted[0];
  }, [categoriesWithScores]);

  const filteredCategories = useMemo(() =>
    categoriesWithScores.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [categoriesWithScores, search]
  );

  return (
    <div className="px-5 space-y-4">
      {/* Mastery Widget */}
      <div className="glass-card p-4">
        <button onClick={() => setMasteryExpanded(!masteryExpanded)}
          className="w-full flex items-center gap-4">
          <ProgressRing value={globalScore} size={56} strokeWidth={2.5} />
          <div className="flex-1 text-left">
            <p className="text-body font-semibold text-foreground">Overall Mastery</p>
            <p className="text-caption text-muted-foreground">{globalScore}% across {categoriesWithScores.length} categories</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${masteryExpanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {masteryExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="editorial-divider my-3" />
              <div className="grid grid-cols-2 gap-2">
                {categoriesWithScores.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.id}`}
                    className="flex items-center gap-2 rounded-xl bg-secondary/50 p-2.5 hover:bg-surface-hover transition-colors">
                    <ProgressRing value={cat.score} size={32} strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-micro font-medium text-foreground truncate">{cat.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{getLevelLabel(cat.score)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Here */}
      {recommendedPath && (
        <Link to={`/category/${recommendedPath.id}`}
          className="glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all block">
          <span className="text-xl">{recommendedPath.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="section-label text-primary mb-0.5">Start here</p>
            <p className="text-body font-semibold text-foreground">{recommendedPath.name}</p>
            <p className="text-micro text-muted-foreground">{getLevelLabel(recommendedPath.score)} · {recommendedPath.score}%</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="editorial-divider" />

      {/* Browse */}
      <div>
        <p className="section-label mb-3">Browse topics</p>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 mb-4">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
            className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
        </div>

        <div className="space-y-1.5">
          {filteredCategories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}>
              <Link to={`/category/${cat.id}`}
                className="glass-card p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all block">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground">{cat.name}</p>
                  <p className="text-micro text-muted-foreground">{getLevelLabel(cat.score)} · {cat.score}%</p>
                </div>
                <ProgressRing value={cat.score} size={30} strokeWidth={2} />
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PERSONALIZED LESSONS TAB ─── */
function PersonalizedTab() {
  const { calibration } = useCalibration();
  const { profile } = useUserProfile();
  const [lessons, setLessons] = useState<PersonalizedLesson[]>([]);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<PLFilter>("newest");

  useEffect(() => {
    setLessons(getUncompletedPersonalizedLessons());
  }, []);

  useEffect(() => {
    if (getUncompletedPersonalizedLessons().length === 0 && extractChatTopics().length > 0) {
      generateLessons();
    }
  }, []);

  const generateLessons = useCallback(async () => {
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
              source: `From your chats: ${lesson.relatedTopic?.slice(0, 40) || "AI topics"}`,
              generatedAt: Date.now(),
              completed: false,
            });
          }
          setLessons(getUncompletedPersonalizedLessons());
        }
      }
    } catch (e) {
      console.error("Failed to generate personalized lessons:", e);
    }
    setGenerating(false);
  }, [generating, calibration, profile.learningStyle]);

  const handleComplete = (id: string) => {
    markPersonalizedLessonComplete(id);
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  const FILTERS: { id: PLFilter; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "goal", label: "Goal-related" },
    { id: "category", label: "Category" },
    { id: "difficulty", label: "Difficulty" },
  ];

  return (
    <div className="px-5 space-y-4">
      {/* Header + Generate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
          <p className="section-label text-accent-gold">Personalized for you</p>
        </div>
        <button onClick={generateLessons} disabled={generating}
          className="text-micro text-primary hover:underline flex items-center gap-1">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Generate
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`rounded-xl px-3 py-1.5 text-micro font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-primary/10 text-primary"
                : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lessons */}
      {generating && lessons.length === 0 && (
        <div className="glass-card p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-caption text-muted-foreground">Generating lessons from your chats...</span>
        </div>
      )}

      {!generating && lessons.length === 0 && (
        <div className="glass-card p-6 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-body text-muted-foreground mb-1">No personalized lessons yet</p>
          <p className="text-caption text-text-tertiary">Chat with Owl first, then lessons will be generated from your conversations.</p>
        </div>
      )}

      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}>
            <div className="glass-card p-4 border-accent-gold/10 hover:border-accent-gold/20 transition-all">
              <p className="text-body font-semibold text-foreground mb-1">{lesson.title}</p>
              <p className="text-caption text-muted-foreground mb-2">{lesson.hook}</p>
              <p className="text-micro text-text-tertiary italic mb-3">{lesson.source}</p>
              <div className="flex gap-2">
                <Link to={`/?context=${encodeURIComponent(`Teach me about: ${lesson.title}. ${lesson.content}`)}&autoSend=true`}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                  <Zap className="h-3 w-3" /> Start
                </Link>
                <button onClick={() => handleComplete(lesson.id)}
                  className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
