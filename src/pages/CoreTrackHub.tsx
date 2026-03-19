import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, BookOpen, Target, DollarSign, Users, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { getCoreTrack } from "@/lib/core-tracks";
import { isLessonCompleted, getModuleLessonKey } from "@/lib/progress";
import { useProgress } from "@/hooks/useProgress";
import { generateLesson } from "@/lib/ai-stream";
import ProgressRing from "@/components/ProgressRing";
import { toast } from "@/hooks/use-toast";

export default function CoreTrackHub() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getCoreTrack(trackId || "");
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [selectedLevel, setSelectedLevel] = useState("Beginner");
  const [generating, setGenerating] = useState(false);

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  const masteryScore = progress.masteryScores[trackId || ""] || 0;

  // Count completed lessons across all modules
  const completedModules = track.modules.map((_, i) => {
    const totalLessons = 5;
    const done = Array.from({ length: totalLessons }, (__, li) =>
      isLessonCompleted(getModuleLessonKey(trackId || "", selectedLevel, i, li))
    ).filter(Boolean).length;
    return { done, total: totalLessons };
  });

  const totalDone = completedModules.reduce((a, m) => a + m.done, 0);
  const totalLessons = completedModules.reduce((a, m) => a + m.total, 0);
  const overallPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

  const handleGenerateLesson = async () => {
    setGenerating(true);
    try {
      const lesson = await generateLesson({
        category: track.name,
        difficulty: selectedLevel.toLowerCase(),
        track: track.name,
      });
      toast({ title: "New lesson generated!", description: lesson.title });
      // Navigate to it via chat
      const encoded = encodeURIComponent(`Teach me: ${lesson.title}. ${lesson.content}`);
      navigate(`/?context=${encoded}&autoSend=true`);
    } catch {
      toast({ title: "Generation failed", description: "Try again in a moment.", variant: "destructive" });
    }
    setGenerating(false);
  };

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
          <p className="section-label text-primary">{track.icon} Core Track</p>
          <h1 className="font-display text-h3 text-foreground">{track.name}</h1>
        </div>
        <ProgressRing value={overallPct} size={48} strokeWidth={3} />
      </div>

      {/* Description */}
      <div className="px-5 mb-4">
        <p className="text-body text-muted-foreground leading-relaxed">{track.description}</p>
        <p className="text-caption text-primary mt-1 font-semibold">{overallPct}% complete · {totalDone}/{totalLessons} lessons</p>
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Info Cards */}
      <div className="px-5 space-y-3 mb-5">
        {/* Elevated Value Proposition */}
        {track.valueProp && (
          <div className="glass-card p-4 border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-micro font-bold text-primary uppercase tracking-wider">Why This Track Matters</p>
            </div>
            <p className="text-caption text-foreground leading-relaxed font-medium">{track.valueProp}</p>
          </div>
        )}

        <InfoRow icon={Target} label="What you'll learn" value={track.outcome} />
        <InfoRow icon={DollarSign} label="Money angle" value={track.moneyAngle} />
        <InfoRow icon={Users} label="Who it's for" value={track.whoFor} />

        {/* Core Outcomes */}
        {track.outcomes && track.outcomes.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
              <p className="text-micro font-bold text-accent-green uppercase tracking-wider">You Will Be Able To</p>
            </div>
            <ul className="space-y-2">
              {track.outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground">
                  <span className="text-accent-green mt-0.5 shrink-0">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Advanced Examples */}
        {track.advancedExamples && track.advancedExamples.length > 0 && (
          <div className="glass-card p-4 border-accent-gold/15">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
              <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Real-World Breakthroughs</p>
            </div>
            <div className="space-y-2">
              {track.advancedExamples.map((ex, i) => (
                <p key={i} className="text-caption text-muted-foreground leading-relaxed italic">"{ex}"</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Level Selector */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {["Beginner", "Intermediate", "Advanced"].map(lvl => (
            <button key={lvl} onClick={() => setSelectedLevel(lvl)}
              className={`rounded-xl px-3 py-1.5 text-micro font-semibold uppercase tracking-wider transition-all ${
                selectedLevel === lvl ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
              }`}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Modules — clickable, links to ModuleView */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <p className="section-label text-primary">Modules</p>
        </div>
        <div className="space-y-1.5">
          {track.modules.map((mod, i) => {
            const { done, total } = completedModules[i];
            const modPct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isComplete = done === total && total > 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/category/${trackId}/module?level=${selectedLevel}&mod=${i}`}
                  className={`glass-card p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all block ${isComplete ? "border-accent-green/20" : ""}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isComplete ? "bg-accent-green/10" : "bg-primary/10"}`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-green" />
                    ) : (
                      <span className="text-micro font-bold text-primary">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption text-foreground">{mod}</p>
                    <p className="text-micro text-muted-foreground">{done}/{total} lessons · {modPct}%</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Generate Lesson */}
      <div className="px-5 space-y-2">
        <button onClick={handleGenerateLesson} disabled={generating}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating..." : "Generate New Lesson"}
        </button>

        {/* Start Learning CTA */}
        <Link
          to={`/category/${trackId}/lesson?level=${selectedLevel}&mod=0&lesson=0`}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center"
        >
          <Sparkles className="h-4 w-4" />
          {totalDone > 0 ? "Continue Learning" : "Start First Lesson"}
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-micro font-bold text-primary uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-caption text-muted-foreground leading-relaxed">{value}</p>
    </div>
  );
}
