import { motion } from "framer-motion";
import { ChevronRight, Sparkles, DollarSign, BookOpen, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import { CORE_TRACKS, MONEY_TRACK_IDS, getRecommendedTracks } from "@/lib/core-tracks";
import { MASTERY_TRACKS } from "@/lib/mastery-tracks";
import { useProgress } from "@/hooks/useProgress";
import { useCalibration } from "@/hooks/useCalibration";
import ProgressRing from "@/components/ProgressRing";
import HiddenOwl from "@/components/HiddenOwl";

function SectionHeader({ icon: Icon, label, title }: { icon: any; label: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="section-label text-primary">{label}</p>
      </div>
      <h2 className="font-display text-h3 text-foreground">{title}</h2>
    </div>
  );
}

function CoreTrackCard({ track, index }: { track: typeof CORE_TRACKS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={`/track/${track.id}`}
        className="glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all duration-200 block"
      >
        <span className="text-xl">{track.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-foreground">{track.name}</p>
          <p className="text-micro text-muted-foreground line-clamp-1">{track.tagline}</p>
        </div>
        <span className="text-micro font-bold text-primary bg-primary/10 rounded-lg px-2 py-0.5">
          {track.modules.length} modules
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </motion.div>
  );
}

function CategoryCard({ cat, score, index }: { cat: typeof MASTERY_CATEGORIES[0]; score: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
    >
      <Link
        to={`/category/${cat.id}`}
        className="glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all duration-200 block"
      >
        <span className="text-xl">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-foreground">{cat.name}</p>
          <p className="text-micro text-muted-foreground uppercase tracking-wider">
            {getLevelLabel(score)} · {score}%
          </p>
        </div>
        <ProgressRing value={score} size={36} strokeWidth={2.5} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </motion.div>
  );
}

export default function LearnPaths() {
  const { progress } = useProgress();
  const { calibration } = useCalibration();

  const recommended = getRecommendedTracks(calibration.goalMode, calibration.outputMode);
  const coreTracks = CORE_TRACKS.filter(t => !MONEY_TRACK_IDS.includes(t.id));
  const moneyTracks = CORE_TRACKS.filter(t => MONEY_TRACK_IDS.includes(t.id));

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 relative">
        <p className="section-label text-primary mb-2">Course Catalog</p>
        <h1 className="font-display text-h1 text-foreground">Master AI.<br />Make It Pay.</h1>
        <p className="text-body text-muted-foreground mt-2">
          Guided tracks to master AI + real-world skills to turn knowledge into income.
        </p>
        <HiddenOwl locationId="paths-header" className="absolute right-6 bottom-4" size={16} />
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* SECTION 1 — Recommended for You */}
      <div className="px-5 mb-8">
        <SectionHeader icon={Star} label="Personalized" title="Recommended for You" />
        <p className="text-caption text-muted-foreground mb-3">
          Based on your goal: <span className="text-primary font-semibold capitalize">{calibration.goalMode}</span>
        </p>
        <div className="space-y-2">
          {recommended.slice(0, 3).map((track, i) => (
            <CoreTrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* SECTION 2 — Start with AI Mastery */}
      <div className="px-5 mb-8">
        <SectionHeader icon={Sparkles} label="Core Learning" title="Start with AI Mastery" />
        <p className="text-caption text-muted-foreground mb-3">
          The essential tracks to understand, use, and master AI.
        </p>
        <div className="space-y-2">
          {coreTracks.map((track, i) => (
            <CoreTrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* SECTION 3 — Make Money With AI */}
      <div className="px-5 mb-8">
        <SectionHeader icon={DollarSign} label="Income & Leverage" title="Make Money With AI" />
        <p className="text-caption text-muted-foreground mb-3">
          Realistic, skill-based ways AI can improve your income and operations.
        </p>
        <div className="space-y-2">
          {moneyTracks.map((track, i) => (
            <CoreTrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* SECTION 4 — Expand Your Knowledge */}
      <div className="px-5 mb-8">
        <SectionHeader icon={BookOpen} label="22 Categories" title="Expand Your Knowledge" />
        <p className="text-caption text-muted-foreground mb-3">
          Deep-dive into any field. Apply AI across every industry.
        </p>
        <div className="space-y-2">
          {MASTERY_CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              score={progress.masteryScores[cat.id] || 0}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
