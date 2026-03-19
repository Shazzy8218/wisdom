import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, CheckCircle2, Crown, BookOpen, Play, Map } from "lucide-react";
import { getMasteryTrack } from "@/lib/mastery-tracks";
import { getTrackProgress, getNextIncompleteLesson, getPillarProgress } from "@/lib/mastery-lessons";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";

export default function MasteryTrackHub() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getMasteryTrack(trackId || "");
  const navigate = useNavigate();
  const { progress } = useProgress();

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  const trackStarted = progress.completedLessons.includes(`mastery-${trackId}-started`);
  const trackProg = getTrackProgress(trackId || "", progress.completedLessons);
  const nextLesson = getNextIncompleteLesson(trackId || "", progress.completedLessons);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold">Mastery Track</p>
          </div>
          <h1 className="font-display text-lg font-bold text-foreground leading-tight">{track.name}</h1>
        </div>
        <span className="text-2xl">{track.icon}</span>
      </div>

      {/* Value Prop */}
      <div className="px-5 mb-4">
        <p className="text-body text-muted-foreground leading-relaxed">{track.tagline}</p>
      </div>

      {/* Progress (if started) */}
      {trackStarted && (
        <div className="px-5 mb-4">
          <div className="glass-card p-4 border-accent-gold/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Your Progress</p>
              <p className="text-micro font-bold text-accent-gold">{trackProg.percent}%</p>
            </div>
            <Progress value={trackProg.percent} className="h-2 bg-surface-2" />
            <p className="text-micro text-muted-foreground mt-2">{trackProg.done}/{trackProg.total} lessons completed</p>
          </div>
        </div>
      )}

      <div className="editorial-divider mx-5 mb-4" />

      {/* Ultimate Value Proposition */}
      <div className="px-5 mb-5">
        <div className="glass-card p-5 border-accent-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
            <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Ultimate Value</p>
          </div>
          <p className="text-caption text-foreground leading-relaxed font-medium">{track.valueProp}</p>
        </div>
      </div>

      {/* Key Pillars with progress */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <p className="text-micro font-bold text-primary uppercase tracking-wider">Key Pillars</p>
        </div>
        <div className="space-y-2">
          {track.pillars.map((pillar, i) => {
            const pp = getPillarProgress(trackId || "", i, progress.completedLessons);
            const pillarComplete = pp.done === pp.total && pp.total > 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 ${pillarComplete ? "border-accent-green/15" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    pillarComplete ? "bg-accent-green/10" : "bg-primary/10"
                  }`}>
                    {pillarComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                    ) : (
                      <span className="text-micro font-bold text-primary">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-semibold text-foreground mb-1">{pillar.title}</p>
                    <p className="text-micro text-muted-foreground leading-relaxed">{pillar.description}</p>
                    {trackStarted && pp.total > 0 && (
                      <p className="text-micro text-primary mt-1 font-medium">{pp.done}/{pp.total} lessons</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Why College Level */}
      <div className="px-5 mb-6">
        <div className="glass-card p-5 border-primary/15">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <p className="text-micro font-bold text-primary uppercase tracking-wider">Why This Achieves College-Level Value</p>
          </div>
          <p className="text-caption text-muted-foreground leading-relaxed">{track.whyCollegeLevel}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-5 space-y-2">
        {trackStarted ? (
          <>
            {/* Continue learning */}
            {nextLesson && (
              <Link
                to={`/mastery/${trackId}/lesson?pillar=${nextLesson.pillarIndex}&lesson=${nextLesson.lessonIndex}`}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center"
              >
                <Play className="h-4 w-4" />
                Continue This Track
              </Link>
            )}
            {/* View Roadmap */}
            <Link
              to={`/mastery/${trackId}/roadmap`}
              className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-accent-gold hover:border-accent-gold/20 transition-all block text-center"
            >
              <Map className="h-4 w-4" />
              View Track Roadmap
            </Link>
          </>
        ) : (
          <Link
            to={`/mastery/${trackId}/start`}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center"
          >
            <Sparkles className="h-4 w-4" />
            Start This Mastery Track
          </Link>
        )}
      </div>
    </div>
  );
}
