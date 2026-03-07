import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, MessageSquare, Gamepad2, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { getCategoryTrack } from "@/lib/categories";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import { generateLesson } from "@/lib/ai-stream";
import ProgressRing from "@/components/ProgressRing";
import { toast } from "@/hooks/use-toast";

type Tab = "lessons" | "workflows" | "prompts" | "scenario";

export default function CategoryHub() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const track = getCategoryTrack(categoryId || "");
  const mastery = MASTERY_CATEGORIES.find(c => c.id === categoryId);
  const [tab, setTab] = useState<Tab>("lessons");
  const [selectedLevel, setSelectedLevel] = useState("Beginner");
  const [generating, setGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    );
  }

  const handleGenerateLesson = async () => {
    setGenerating(true);
    try {
      const lesson = await generateLesson({
        category: track.name,
        difficulty: selectedLevel.toLowerCase(),
        track: track.name,
      });
      setGeneratedLesson(lesson);
      toast({ title: "New lesson generated!", description: lesson.title });
    } catch {
      toast({ title: "Generation failed", description: "Try again in a moment.", variant: "destructive" });
    }
    setGenerating(false);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "workflows", label: "Workflows", icon: Zap },
    { id: "prompts", label: "Prompts", icon: MessageSquare },
    { id: "scenario", label: "Scenario", icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/mastery" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <p className="section-label text-primary">{track.icon} Category Hub</p>
          <h1 className="font-display text-h3 text-foreground">{track.name}</h1>
        </div>
        {mastery && <ProgressRing value={mastery.score} size={48} strokeWidth={3} />}
      </div>

      <div className="px-5 mb-4">
        <p className="text-body text-muted-foreground">{track.description}</p>
        {mastery && (
          <p className="text-caption text-primary mt-1 font-semibold">{getLevelLabel(mastery.score)} · {mastery.score}% mastery</p>
        )}
      </div>

      {/* Level Selector */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {track.levels.map(lvl => (
            <button key={lvl.level} onClick={() => setSelectedLevel(lvl.level)}
              className={`rounded-xl px-3 py-1.5 text-micro font-semibold uppercase tracking-wider transition-all ${
                selectedLevel === lvl.level ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
              }`}>
              {lvl.level}
            </button>
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Tabs */}
      <div className="flex gap-1 px-5 mb-5 overflow-x-auto hide-scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-micro font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}>
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5">
        <AnimatePresence mode="wait">
          {tab === "lessons" && (
            <motion.div key="lessons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Modules */}
              <div className="mb-4">
                <p className="section-label mb-3">{selectedLevel} Modules</p>
                <div className="space-y-1.5">
                  {track.levels.find(l => l.level === selectedLevel)?.modules.map((mod, i) => (
                    <div key={i} className="glass-card p-3.5 flex items-center gap-3">
                      <span className="text-micro font-bold text-primary w-5">{i + 1}</span>
                      <p className="text-caption text-foreground flex-1">{mod}</p>
                      <ChevronRight className="h-3 w-3 text-text-tertiary" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="editorial-divider mb-4" />

              {/* Starter Lessons */}
              <p className="section-label mb-3">Starter Lessons</p>
              <div className="space-y-1.5 mb-4">
                {track.starterLessons
                  .filter(l => l.difficulty === selectedLevel.toLowerCase())
                  .slice(0, 5)
                  .map((lesson, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-4 cursor-pointer hover:border-primary/20 transition-all">
                      <p className="text-body font-semibold text-foreground">{lesson.title}</p>
                      <p className="text-caption text-muted-foreground mt-0.5">{lesson.hook}</p>
                    </motion.div>
                  ))}
              </div>

              {/* Generate More */}
              <button onClick={handleGenerateLesson} disabled={generating}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate New Lesson"}
              </button>

              {generatedLesson && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 mt-3 border-primary/20">
                  <p className="section-label text-primary mb-1">AI Generated</p>
                  <p className="text-body font-semibold text-foreground">{generatedLesson.title}</p>
                  <p className="text-caption text-muted-foreground mt-1">{generatedLesson.hook}</p>
                  <p className="text-caption text-muted-foreground mt-2 leading-relaxed">{generatedLesson.content}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === "workflows" && (
            <motion.div key="workflows" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              {track.workflows.map((wf, i) => (
                <div key={i} className="glass-card p-4">
                  <p className="text-body font-semibold text-foreground mb-3">{wf.title}</p>
                  <div className="space-y-2">
                    {wf.steps.map((step, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-micro font-bold text-primary">{j + 1}</span>
                        <p className="text-caption text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {tab === "prompts" && (
            <motion.div key="prompts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2">
              {track.prompts.map((p, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-body font-semibold text-foreground">{p.label}</p>
                    <span className={`rounded-lg px-2 py-0.5 text-micro font-bold uppercase ${
                      p.level === "pro" ? "bg-primary/10 text-primary" : "bg-accent-green/10 text-accent-green"
                    }`}>{p.level}</span>
                  </div>
                  <p className="text-caption text-muted-foreground font-mono leading-relaxed">{p.prompt}</p>
                </div>
              ))}
            </motion.div>
          )}

          {tab === "scenario" && (
            <motion.div key="scenario" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-5 border-primary/20">
                <p className="section-label text-primary mb-2">Real Scenario Simulation</p>
                <h3 className="font-display text-h3 text-foreground mb-3">{track.scenario.title}</h3>
                <p className="text-body text-muted-foreground leading-relaxed mb-4">{track.scenario.description}</p>
                <Link to="/chat"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-body font-bold text-primary-foreground">
                  <Sparkles className="h-4 w-4" /> Start Simulation in AI Chat
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
