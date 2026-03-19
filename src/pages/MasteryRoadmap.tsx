import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, CheckCircle2, ChevronRight, BookOpen, Sparkles, Play } from "lucide-react";
import { getMasteryTrack } from "@/lib/mastery-tracks";
import { getMasteryLessonsForTrack, getPillarProgress, getTrackProgress, getNextIncompleteLesson, getMasteryLessonId } from "@/lib/mastery-lessons";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";

export default function MasteryRoadmap() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getMasteryTrack(trackId || "");
  const allLessons = getMasteryLessonsForTrack(trackId || "");
  const navigate = useNavigate();
  const { progress } = useProgress();

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  const trackProgress = getTrackProgress(trackId || "", progress.completedLessons);
  const nextLesson = getNextIncompleteLesson(trackId || "", progress.completedLessons);

  const handleContinue = () => {
    if (nextLesson) {
      navigate(`/mastery/${trackId}/lesson?pillar=${nextLesson.pillarIndex}&lesson=${nextLesson.lessonIndex}`);
    }
  };

  const handleChatWithContext = () => {
    const contextParts = [
      `📚 MASTERY TRACK: "${track.name}"`,
      `🎯 VALUE: ${track.valueProp}`,
      `📊 PROGRESS: ${trackProgress.done}/${trackProgress.total} lessons (${trackProgress.percent}%)`,
      "",
      "CURRENT PILLAR PROGRESS:",
      ...track.pillars.map((p, i) => {
        const pp = getPillarProgress(trackId || "", i, progress.completedLessons);
        return `  ${i + 1}. ${p.title}: ${pp.done}/${pp.total} lessons`;
      }),
      "",
      nextLesson
        ? `NEXT UP: Pillar ${nextLesson.pillarIndex + 1}, Lesson ${nextLesson.lessonIndex + 1} — "${allLessons[nextLesson.pillarIndex]?.[nextLesson.lessonIndex]?.title}"`
        : "ALL LESSONS COMPLETE",
      "",
      "---",
      "I'm continuing my mastery track. Based on my progress above, give me a focused briefing on what I should focus on next and why. Then suggest a practical exercise I can do right now.",
    ];
    const encoded = encodeURIComponent(contextParts.join("\n"));
    navigate(`/?context=${encoded}&autoSend=true`);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/mastery/${trackId}`)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold">Track Roadmap</p>
          </div>
          <h1 className="font-display text-lg font-bold text-foreground leading-tight">{track.name}</h1>
        </div>
        <span className="text-2xl">{track.icon}</span>
      </div>

      {/* Overall Progress */}
      <div className="px-5 mb-5">
        <div className="glass-card p-4 border-accent-gold/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Overall Progress</p>
            <p className="text-micro font-bold text-accent-gold">{trackProgress.percent}%</p>
          </div>
          <Progress value={trackProgress.percent} className="h-2 bg-surface-2" />
          <p className="text-micro text-muted-foreground mt-2">{trackProgress.done}/{trackProgress.total} lessons completed</p>
        </div>
      </div>

      {/* Continue Button */}
      {nextLesson && (
        <div className="px-5 mb-5">
          <button
            onClick={handleContinue}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all"
          >
            <Play className="h-4 w-4" />
            Continue: {allLessons[nextLesson.pillarIndex]?.[nextLesson.lessonIndex]?.title}
          </button>
        </div>
      )}

      <div className="editorial-divider mx-5 mb-5" />

      {/* Pillars with lessons */}
      <div className="px-5 space-y-5">
        {track.pillars.map((pillar, pi) => {
          const pillarProg = getPillarProgress(trackId || "", pi, progress.completedLessons);
          const pillarPct = pillarProg.total > 0 ? Math.round((pillarProg.done / pillarProg.total) * 100) : 0;
          const lessons = allLessons[pi] || [];
          const pillarComplete = pillarProg.done === pillarProg.total && pillarProg.total > 0;

          return (
            <motion.div
              key={pi}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.05 }}
            >
              {/* Pillar header */}
              <div className={`glass-card p-4 mb-2 ${pillarComplete ? "border-accent-green/20" : "border-accent-gold/15"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    pillarComplete ? "bg-accent-green/15" : "bg-accent-gold/15"
                  }`}>
                    {pillarComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-green" />
                    ) : (
                      <span className="text-micro font-bold text-accent-gold">{pi + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-semibold text-foreground">{pillar.title}</p>
                    <p className="text-micro text-muted-foreground">{pillarProg.done}/{pillarProg.total} · {pillarPct}%</p>
                  </div>
                </div>
                <Progress value={pillarPct} className="h-1.5 bg-surface-2" />
              </div>

              {/* Lessons */}
              <div className="space-y-1 ml-4">
                {lessons.map((lesson, li) => {
                  const lid = getMasteryLessonId(trackId || "", pi, li);
                  const done = progress.completedLessons.includes(lid);
                  const isNext = nextLesson?.pillarIndex === pi && nextLesson?.lessonIndex === li;

                  return (
                    <Link
                      key={li}
                      to={`/mastery/${trackId}/lesson?pillar=${pi}&lesson=${li}`}
                      className={`glass-card p-3 flex items-center gap-3 hover:border-primary/20 transition-all block ${
                        done ? "border-accent-green/15" : isNext ? "border-primary/20" : ""
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        done ? "bg-accent-green/10" : isNext ? "bg-primary/10" : "bg-surface-2"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                        ) : isNext ? (
                          <Play className="h-3 w-3 text-primary" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">{li + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-micro font-medium truncate ${done ? "text-muted-foreground" : "text-foreground"}`}>
                          {lesson.title}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="editorial-divider mx-5 my-5" />

      {/* Chat CTA */}
      <div className="px-5 space-y-2">
        <button
          onClick={handleChatWithContext}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Continue in Chat with Owl
        </button>
      </div>
    </div>
  );
}
