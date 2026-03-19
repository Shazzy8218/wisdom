import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, ChevronDown, Search, Sparkles, DollarSign, Star, BookOpen,
  Loader2, RefreshCw, Zap, Filter, CheckCircle2, Crown
} from "lucide-react";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import { CORE_TRACKS, MONEY_TRACK_IDS, getRecommendedTracks } from "@/lib/core-tracks";
import { MASTERY_TRACKS } from "@/lib/mastery-tracks";
import { useProgress } from "@/hooks/useProgress";
import { useCalibration } from "@/hooks/useCalibration";
import { useUserProfile } from "@/hooks/useUserProfile";
import ProgressRing from "@/components/ProgressRing";
import MasteryRadar from "@/components/MasteryRadar";
import {
  loadPersonalizedLessons, savePersonalizedLesson, markPersonalizedLessonComplete,
  extractChatTopics, getUncompletedPersonalizedLessons, type PersonalizedLesson
} from "@/lib/personalized-lessons";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personalized-lesson`;

type Tab = "catalog" | "personalized";
type PFilter = "newest" | "goal" | "category" | "difficulty";

export default function Courses() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [masteryExpanded, setMasteryExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { progress } = useProgress();
  const { calibration } = useCalibration();
  const { profile } = useUserProfile();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Personalized state
  const [personalizedLessons, setPersonalizedLessons] = useState<PersonalizedLesson[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pFilter, setPFilter] = useState<PFilter>("newest");

  useEffect(() => {
    setPersonalizedLessons(loadPersonalizedLessons().filter(l => !l.completed));
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
              source: `Based on: ${lesson.relatedTopic?.slice(0, 40) || "your activity"}`,
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  // Toggle accordion section
  const toggleSection = (id: string) => {
    const next = openSection === id ? null : id;
    setOpenSection(next);
    if (next && sectionRefs.current[next]) {
      setTimeout(() => {
        sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // Catalog data
  const recommended = getRecommendedTracks(calibration.goalMode, calibration.outputMode);
  const coreTracks = CORE_TRACKS.filter(t => !MONEY_TRACK_IDS.includes(t.id));
  const moneyTracks = CORE_TRACKS.filter(t => MONEY_TRACK_IDS.includes(t.id));

  const filteredCategories = MASTERY_CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Global mastery
  const globalScore = useMemo(() => {
    const scores = MASTERY_CATEGORIES.map(c => progress.masteryScores[c.id] || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [progress.masteryScores]);

  // Accordion sections for catalog
  const catalogSections = useMemo(() => {
    const sections: { id: string; icon: string; label: string; sublabel: string; accent: string; content: React.ReactNode }[] = [];

    // Recommended
    sections.push({
      id: "recommended",
      icon: "⭐",
      label: "Recommended for You",
      sublabel: `${recommended.length} tracks · ${calibration.goalMode} focus`,
      accent: "border-l-primary",
      content: (
        <div className="space-y-1">
          {recommended.slice(0, 5).map(track => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      ),
    });

    // Core AI Mastery
    sections.push({
      id: "core",
      icon: "🧠",
      label: "AI Mastery",
      sublabel: `${coreTracks.length} tracks · ${coreTracks.reduce((a, t) => a + t.modules.length, 0)} modules`,
      accent: "border-l-primary",
      content: (
        <div className="space-y-1">
          {coreTracks.map(track => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      ),
    });

    // Money Tracks
    sections.push({
      id: "money",
      icon: "💰",
      label: "Make Money With AI",
      sublabel: `${moneyTracks.length} tracks · income-focused`,
      accent: "border-l-accent-gold",
      content: (
        <div className="space-y-1">
          {moneyTracks.map(track => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      ),
    });

    // Categories
    sections.push({
      id: "categories",
      icon: "📚",
      label: "All 22 Categories",
      sublabel: `${filteredCategories.length} categories · expand your knowledge`,
      accent: "border-l-muted-foreground",
      content: (
        <div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 mb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="space-y-0.5">
            {filteredCategories.map(cat => {
              const score = progress.masteryScores[cat.id] || 0;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{cat.name}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {score}%
                  </span>
                  <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                </Link>
              );
            })}
          </div>
        </div>
      ),
    });

    return sections;
  }, [recommended, coreTracks, moneyTracks, filteredCategories, search, progress.masteryScores, calibration.goalMode]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Courses</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Master AI. Make It Pay.</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-4">
        <div className="flex rounded-xl bg-surface-2 p-0.5 gap-0.5">
          <button
            onClick={() => setTab("catalog")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === "catalog" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setTab("personalized")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all relative ${
              tab === "personalized" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Personalized
            {personalizedLessons.length > 0 && tab !== "personalized" && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-gold text-[8px] font-bold text-background">
                {personalizedLessons.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "catalog" ? (
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Mastery Widget — ultra compact */}
            <div className="px-5 mb-4">
              <button
                onClick={() => setMasteryExpanded(!masteryExpanded)}
                className="w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3 text-left hover:border-primary/20 transition-all"
              >
                <ProgressRing value={globalScore} size={44} strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Overall Mastery</p>
                  <p className="text-sm font-semibold text-foreground">{globalScore}% · {getLevelLabel(globalScore)}</p>
                </div>
                <motion.div animate={{ rotate: masteryExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {masteryExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1">
                      <MasteryRadar />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion sections */}
            <div className="px-5 space-y-2">
              {catalogSections.map(section => (
                <div
                  key={section.id}
                  ref={el => { sectionRefs.current[section.id] = el; }}
                  className="scroll-mt-4"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-3.5 py-3 flex items-center gap-3 text-left transition-all hover:border-primary/15 ${
                      openSection === section.id ? "border-primary/25 shadow-[0_0_12px_hsl(var(--primary)/0.08)]" : ""
                    }`}
                  >
                    <span className="text-lg leading-none">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{section.label}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wide">{section.sublabel}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: openSection === section.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {openSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-1.5 pb-1 pl-2">
                          {section.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="personalized" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PersonalizedTab
              lessons={personalizedLessons}
              generating={generating}
              pFilter={pFilter}
              setPFilter={setPFilter}
              onGenerate={generatePersonalizedLessons}
              onComplete={handleCompletePersonalized}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sub-components ─── */

function TrackRow({ track }: { track: { id: string; name: string; icon: string; tagline: string; modules: string[] } }) {
  return (
    <Link
      to={`/track/${track.id}`}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
    >
      <span className="text-sm">{track.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{track.tagline}</p>
      </div>
      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-md px-1.5 py-0.5">
        {track.modules.length}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
    </Link>
  );
}

function PersonalizedTab({
  lessons, generating, pFilter, setPFilter, onGenerate, onComplete,
}: {
  lessons: PersonalizedLesson[];
  generating: boolean;
  pFilter: PFilter;
  setPFilter: (f: PFilter) => void;
  onGenerate: () => void;
  onComplete: (id: string) => void;
}) {
  return (
    <div className="px-5">
      {/* Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto hide-scrollbar">
        {(["newest", "goal", "category", "difficulty"] as PFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setPFilter(f)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              pFilter === f ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            <Filter className="h-2.5 w-2.5" /> {f}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full rounded-xl border border-border bg-card/60 p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:border-primary/20 transition-all mb-3"
      >
        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {generating ? "Generating…" : "Generate More Lessons"}
      </button>

      {/* Empty state */}
      {lessons.length === 0 && !generating && (
        <div className="rounded-xl border border-border bg-card/60 p-6 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">No personalized lessons yet</p>
          <p className="text-xs text-muted-foreground">Chat with Owl or set a goal, then tap "Generate More Lessons".</p>
        </div>
      )}

      {generating && lessons.length === 0 && (
        <div className="rounded-xl border border-border bg-card/60 p-5 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Creating lessons from your activity…</span>
        </div>
      )}

      {/* Lesson cards */}
      <div className="space-y-1.5">
        {lessons.map((lesson, i) => (
          <motion.div key={lesson.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}>
            <div className="rounded-xl border border-border bg-card/60 p-3 hover:border-primary/15 transition-all">
              <p className="text-sm font-semibold text-foreground mb-0.5">{lesson.title}</p>
              <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{lesson.hook}</p>
              <p className="text-[10px] text-muted-foreground/60 italic mb-2">{lesson.source}</p>
              <div className="flex gap-1.5">
                <Link
                  to={`/?context=${encodeURIComponent(`Teach me about: ${lesson.title}. ${lesson.content}`)}&autoSend=true`}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Zap className="h-2.5 w-2.5" /> Start
                </Link>
                <button
                  onClick={() => onComplete(lesson.id)}
                  className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-surface-hover transition-colors"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" /> Done
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
