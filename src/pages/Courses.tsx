import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, ChevronDown, Search, Sparkles, DollarSign, Star, BookOpen,
  Loader2, RefreshCw, Zap, Filter, CheckCircle2
} from "lucide-react";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import { CORE_TRACKS, MONEY_TRACK_IDS, getRecommendedTracks } from "@/lib/core-tracks";
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
  const { progress } = useProgress();
  const { calibration } = useCalibration();
  const { profile } = useUserProfile();

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

  // Scroll to top on tab switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  // Catalog data
  const filteredCategories = MASTERY_CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const recommended = getRecommendedTracks(calibration.goalMode, calibration.outputMode);
  const coreTracks = CORE_TRACKS.filter(t => !MONEY_TRACK_IDS.includes(t.id));
  const moneyTracks = CORE_TRACKS.filter(t => MONEY_TRACK_IDS.includes(t.id));

  // Global mastery
  const globalScore = useMemo(() => {
    const scores = MASTERY_CATEGORIES.map(c => progress.masteryScores[c.id] || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [progress.masteryScores]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="section-label text-primary mb-2">Courses</p>
        <h1 className="font-display text-h1 text-foreground">Master AI.<br />Make It Pay.</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-5">
        <div className="flex rounded-2xl bg-surface-2 p-1 gap-1">
          <button
            onClick={() => setTab("catalog")}
            className={`flex-1 rounded-xl py-2.5 text-caption font-semibold transition-all ${
              tab === "catalog" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setTab("personalized")}
            className={`flex-1 rounded-xl py-2.5 text-caption font-semibold transition-all relative ${
              tab === "personalized" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Personalized
            {personalizedLessons.length > 0 && tab !== "personalized" && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-background">
                {personalizedLessons.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "catalog" ? (
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Mastery Widget — compact */}
            <div className="px-5 mb-5">
              <button
                onClick={() => setMasteryExpanded(!masteryExpanded)}
                className="glass-card p-4 flex items-center gap-4 w-full text-left hover:border-primary/20 transition-all"
              >
                <ProgressRing value={globalScore} size={56} strokeWidth={3} />
                <div className="flex-1 min-w-0">
                  <p className="section-label text-primary mb-0.5">Overall Mastery</p>
                  <p className="text-body font-semibold text-foreground">{globalScore}% · {getLevelLabel(globalScore)}</p>
                  <p className="text-micro text-muted-foreground">Tap to {masteryExpanded ? "collapse" : "view full mastery"}</p>
                </div>
                <motion.div animate={{ rotate: masteryExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {masteryExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <MasteryRadar />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="editorial-divider mx-5 mb-5" />

            {/* Recommended */}
            <div className="px-5 mb-6">
              <SectionHeader icon={Star} label="Personalized" title="Recommended for You" />
              <p className="text-caption text-muted-foreground mb-3">
                Based on your goal: <span className="text-primary font-semibold capitalize">{calibration.goalMode}</span>
              </p>
              <div className="space-y-1.5">
                {recommended.slice(0, 3).map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} />
                ))}
              </div>
            </div>

            <div className="editorial-divider mx-5 mb-5" />

            {/* AI Mastery */}
            <div className="px-5 mb-6">
              <SectionHeader icon={Sparkles} label="Core Learning" title="AI Mastery" />
              <div className="space-y-1.5">
                {coreTracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} badge="Core" />
                ))}
              </div>
            </div>

            <div className="editorial-divider mx-5 mb-5" />

            {/* Money Tracks */}
            <div className="px-5 mb-6">
              <SectionHeader icon={DollarSign} label="Income & Leverage" title="Make Money With AI" />
              <div className="space-y-1.5">
                {moneyTracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} badge="Money" badgeColor="accent-gold" />
                ))}
              </div>
            </div>

            <div className="editorial-divider mx-5 mb-5" />

            {/* Browse All Categories */}
            <div className="px-5 mb-6">
              <SectionHeader icon={BookOpen} label="22 Categories" title="Expand Your Knowledge" />
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground outline-none" />
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
                          <p className="text-micro text-muted-foreground uppercase tracking-wider">
                            {getLevelLabel(score)} · {score}%
                          </p>
                        </div>
                        <ProgressRing value={score} size={36} strokeWidth={2.5} />
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="personalized" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Personalized Lessons Tab */}
            <div className="px-5">
              {/* Filters */}
              <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                {(["newest", "goal", "category", "difficulty"] as PFilter[]).map(f => (
                  <button key={f} onClick={() => setPFilter(f)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-micro font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                      pFilter === f ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
                    }`}>
                    <Filter className="h-3 w-3" /> {f}
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button onClick={generatePersonalizedLessons} disabled={generating}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all mb-4">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {generating ? "Generating lessons..." : "Generate More Lessons"}
              </button>

              {/* Lesson cards */}
              {personalizedLessons.length === 0 && !generating && (
                <div className="glass-card p-8 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-body font-semibold text-foreground mb-1">No personalized lessons yet</p>
                  <p className="text-caption text-muted-foreground mb-4">Chat with Owl or set a goal, then tap "Generate More Lessons" above.</p>
                </div>
              )}

              {generating && personalizedLessons.length === 0 && (
                <div className="glass-card p-6 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-caption text-muted-foreground">Creating lessons from your activity...</span>
                </div>
              )}

              <div className="space-y-2">
                {personalizedLessons.map((lesson, i) => (
                  <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <div className="glass-card p-4 hover:border-primary/20 transition-all">
                      <p className="text-body font-semibold text-foreground mb-1">{lesson.title}</p>
                      <p className="text-caption text-muted-foreground mb-2">{lesson.hook}</p>
                      <p className="text-micro text-muted-foreground/70 italic mb-3">{lesson.source}</p>
                      <div className="flex gap-2">
                        <Link
                          to={`/?context=${encodeURIComponent(`Teach me about: ${lesson.title}. ${lesson.content}`)}&autoSend=true`}
                          className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-micro font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Zap className="h-3 w-3" /> Start Lesson
                        </Link>
                        <button onClick={() => handleCompletePersonalized(lesson.id)}
                          className="flex items-center gap-1 rounded-xl bg-surface-2 px-3 py-2 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, title }: { icon: any; label: string; title: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="section-label text-primary">{label}</p>
      </div>
      <h2 className="font-display text-h3 text-foreground">{title}</h2>
    </div>
  );
}

function TrackCard({ track, index, badge, badgeColor = "primary" }: {
  track: { id: string; name: string; icon: string; tagline: string; modules: string[] };
  index: number;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
      <Link to={`/track/${track.id}`}
        className="glass-card p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all block">
        <span className="text-lg">{track.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-foreground">{track.name}</p>
          <p className="text-micro text-muted-foreground line-clamp-1">{track.tagline}</p>
        </div>
        {badge && (
          <span className={`text-[9px] font-bold text-${badgeColor} bg-${badgeColor}/10 rounded-md px-1.5 py-0.5 uppercase tracking-wider`}>
            {badge}
          </span>
        )}
        <span className="text-micro font-bold text-primary bg-primary/10 rounded-lg px-2 py-0.5">
          {track.modules.length} modules
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </Link>
    </motion.div>
  );
}
