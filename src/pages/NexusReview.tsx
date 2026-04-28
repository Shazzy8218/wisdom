// CAE — Dedicated Spaced Repetition Review session.
// Full-screen, distraction-free. Sequences all due reviews (or filtered by ?module=).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Eye, Check } from "lucide-react";
import { getDueReviews, getDueReviewsForModule, gradeReview, type ReviewItem } from "@/lib/learning-optimizer";

const GRADES: { v: 0 | 1 | 2 | 3; label: string; cls: string }[] = [
  { v: 0, label: "Blank",  cls: "bg-destructive/15 text-destructive border-destructive/30" },
  { v: 1, label: "Hard",   cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { v: 2, label: "Good",   cls: "bg-primary/15 text-primary border-primary/30" },
  { v: 3, label: "Easy",   cls: "bg-accent-green/15 text-accent-green border-accent-green/30" },
];

export default function NexusReview() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const moduleFilter = search.get("module");

  const initial = useMemo<ReviewItem[]>(() => {
    return moduleFilter ? getDueReviewsForModule(moduleFilter) : getDueReviews();
  }, [moduleFilter]);

  const [queue, setQueue] = useState<ReviewItem[]>(initial);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState(0);
  const [retentionScore, setRetentionScore] = useState({ blanks: 0, good: 0, easy: 0, hard: 0 });

  const current = queue[idx];
  const total = queue.length;
  const done = current === undefined;

  const submitGrade = (g: 0 | 1 | 2 | 3) => {
    if (!current) return;
    gradeReview(current.id, g);
    setRetentionScore(s => ({
      blanks: s.blanks + (g === 0 ? 1 : 0),
      hard: s.hard + (g === 1 ? 1 : 0),
      good: s.good + (g === 2 ? 1 : 0),
      easy: s.easy + (g === 3 ? 1 : 0),
    }));
    setGraded(n => n + 1);
    setIdx(i => i + 1);
    setAnswer("");
    setRevealed(false);
  };

  useEffect(() => { setQueue(initial); }, [initial]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-5 pt-14 pb-3 flex items-center gap-3 border-b border-border/40">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Brain className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold">Memory Engraver</p>
          </div>
          <h1 className="font-display text-sm font-bold text-foreground leading-tight">
            {done ? "Session complete" : `Drill ${idx + 1} of ${total}`}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="glass-card p-4 border border-primary/25">
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-2">From "{current.moduleTitle}"</p>
                <p className="text-base text-foreground/90 leading-relaxed">{current.prompt}</p>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Retrieve from memory — type your answer..."
                rows={4}
                className="w-full bg-surface-2 rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/40 focus:outline-none resize-none"
              />

              <button
                onClick={() => setRevealed(v => !v)}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="h-3 w-3" /> {revealed ? "Hide" : "Reveal"} reference
              </button>
              {revealed && (
                <div className="glass-card p-3 border border-border/40 bg-surface-2/50">
                  <p className="text-xs text-foreground/85 leading-relaxed">{current.ideal}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Self-grade your retrieval</p>
                <div className="grid grid-cols-4 gap-2">
                  {GRADES.map(g => (
                    <button
                      key={g.v}
                      onClick={() => submitGrade(g.v)}
                      className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${g.cls} hover:scale-[1.02]`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="glass-card p-5 border border-accent-green/30 bg-accent-green/[0.04] text-center">
                <div className="flex items-center justify-center mb-2">
                  <Check className="h-6 w-6 text-accent-green" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">Engraved.</h2>
                <p className="text-sm text-muted-foreground mt-1">{graded} drill{graded !== 1 ? "s" : ""} processed.</p>
              </div>

              {graded > 0 && (
                <div className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-accent-gold mb-3">Shazzy's debrief</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Easy</span><span className="text-accent-green font-bold">{retentionScore.easy}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Good</span><span className="text-primary font-bold">{retentionScore.good}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Hard</span><span className="text-orange-400 font-bold">{retentionScore.hard}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Blank</span><span className="text-destructive font-bold">{retentionScore.blanks}</span></div>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed mt-3 italic">
                    {retentionScore.blanks + retentionScore.hard > graded / 2
                      ? `Half your retrievals struggled. Re-open those modules. Reading isn't mastery — retrieval is.`
                      : retentionScore.easy >= graded * 0.7
                      ? `Solid recall. The intervals will widen — your memory is doing the work now.`
                      : `Mixed signal. The hard ones are where the real learning is happening. Keep showing up.`}
                  </p>
                  <p className="text-xs text-accent-gold font-bold mt-3">🎯 Next Move: Apply one retrieved principle in your next decision today.</p>
                </div>
              )}

              <button
                onClick={() => navigate("/nexus")}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Back to Nexus
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
