import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronRight, Crown, Loader2, Sparkles, Send, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMasteryTrack } from "@/lib/mastery-tracks";
import { getMasteryLessonsForTrack, getMasteryLessonId } from "@/lib/mastery-lessons";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { useProgress } from "@/hooks/useProgress";
import { refreshProgress } from "@/hooks/useProgress";
import { toast } from "@/hooks/use-toast";

export default function MasteryLessonView() {
  const { trackId } = useParams<{ trackId: string }>();
  const [search] = useSearchParams();
  const pillarIdx = parseInt(search.get("pillar") || "0", 10);
  const lessonIdx = parseInt(search.get("lesson") || "0", 10);
  const navigate = useNavigate();

  const track = getMasteryTrack(trackId || "");
  const allLessons = getMasteryLessonsForTrack(trackId || "");
  const pillarLessons = allLessons[pillarIdx] || [];
  const lesson = pillarLessons[lessonIdx];
  const pillar = track?.pillars[pillarIdx];

  const { progress, update } = useProgress();
  const lessonId = getMasteryLessonId(trackId || "", pillarIdx, lessonIdx);
  const isCompleted = progress.completedLessons.includes(lessonId);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");
  const [followUpMessages, setFollowUpMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [followUpStreaming, setFollowUpStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [content, followUpMessages]);

  // Auto-generate lesson on mount
  useEffect(() => {
    if (!track || !lesson || generated) return;
    generateLesson();
  }, [track, lesson]);

  const generateLesson = async () => {
    if (!track || !lesson || !pillar) return;
    setLoading(true);
    setGenerated(true);

    const messages: Msg[] = [
      {
        role: "user",
        content: `You are Wisdom Owl, an elite AI mentor. Generate a comprehensive, actionable lesson for the following:

Track: "${track.name}" (Mastery Tier)
Value Proposition: ${track.valueProp}
Pillar ${pillarIdx + 1}: "${pillar.title}" — ${pillar.description}
Lesson ${lessonIdx + 1}: "${lesson.title}"
Objective: ${lesson.objective}

Deliver a HIGH-VALUE lesson that includes:
1. **Why This Matters** — 2-3 sentences on the strategic importance
2. **Core Framework** — A numbered, step-by-step framework (5-7 steps) the user can immediately deploy
3. **Real-World Application** — A specific scenario showing this framework in action with concrete numbers/results
4. **Pro Tips** — 3 advanced tips that separate beginners from practitioners
5. **Common Pitfalls** — 2-3 mistakes to avoid
6. **🎯 Action Item** — One specific task to complete within 24 hours

Keep it under 600 words. Be direct, specific, and results-oriented. Use markdown formatting. No fluff.`
      }
    ];

    let result = "";
    await streamChat({
      messages,
      mode: "blueprint",
      onDelta: (t) => { result += t; setContent(result); },
      onDone: () => setLoading(false),
    });
  };

  const handleComplete = () => {
    if (isCompleted) return;
    update(p => ({
      ...p,
      completedLessons: [...p.completedLessons, lessonId],
      xp: p.xp + 75,
      tokens: p.tokens + 15,
    }));
    refreshProgress();
    toast({ title: "Lesson complete! 🎉", description: "+15 tokens, +75 XP" });
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || followUpStreaming) return;
    const userMsg = followUpInput.trim();
    setFollowUpInput("");
    setFollowUpMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setFollowUpStreaming(true);

    const contextMessages: Msg[] = [
      { role: "assistant", content: content },
      ...followUpMessages.map(m => ({ role: m.role, content: m.content } as Msg)),
      { role: "user", content: `Context: We're in the "${track?.name}" mastery track, Pillar "${pillar?.title}", Lesson "${lesson?.title}". ${userMsg}` },
    ];

    let result = "";
    setFollowUpMessages(prev => [...prev, { role: "assistant", content: "" }]);
    await streamChat({
      messages: contextMessages,
      mode: "blueprint",
      onDelta: (t) => {
        result += t;
        setFollowUpMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: result };
          return updated;
        });
      },
      onDone: () => setFollowUpStreaming(false),
    });
  };

  // Next lesson navigation
  const getNextLessonUrl = () => {
    if (lessonIdx < pillarLessons.length - 1) {
      return `/mastery/${trackId}/lesson?pillar=${pillarIdx}&lesson=${lessonIdx + 1}`;
    } else if (pillarIdx < (allLessons.length - 1)) {
      return `/mastery/${trackId}/lesson?pillar=${pillarIdx + 1}&lesson=0`;
    }
    return null;
  };

  const nextUrl = getNextLessonUrl();

  if (!track || !lesson || !pillar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center gap-3 border-b border-border/50">
        <button
          onClick={() => navigate(`/mastery/${trackId}/roadmap`)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold truncate">
              Pillar {pillarIdx + 1} · Lesson {lessonIdx + 1}
            </p>
          </div>
          <h1 className="font-display text-sm font-bold text-foreground leading-tight truncate">{lesson.title}</h1>
        </div>
        {isCompleted && <CheckCircle2 className="h-5 w-5 text-accent-green shrink-0" />}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-32">
        {/* Pillar context */}
        <div className="glass-card p-3 border-accent-gold/20">
          <p className="text-micro text-accent-gold font-semibold">{pillar.title}</p>
          <p className="text-micro text-muted-foreground">{pillar.description}</p>
        </div>

        {/* Lesson content */}
        {content && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
            <div className="prose prose-sm prose-invert max-w-none text-foreground [&_strong]:text-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-caption">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <p className="text-micro">Generating your lesson...</p>
          </div>
        )}

        {/* Complete button */}
        {!loading && content && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-caption text-muted-foreground">✦ +15</span>
              <span className="text-caption text-muted-foreground">+75 XP</span>
            </div>
            {!isCompleted ? (
              <button onClick={handleComplete}
                className="rounded-xl bg-primary px-4 py-2 text-micro font-semibold text-primary-foreground">
                Mark Complete
              </button>
            ) : (
              <CheckCircle2 className="h-5 w-5 text-accent-green" />
            )}
          </div>
        )}

        {/* Follow-up messages */}
        {followUpMessages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-3 ${msg.role === "user" ? "ml-8 border-primary/15" : ""}`}>
            {msg.role === "user" ? (
              <p className="text-caption text-foreground">{msg.content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-foreground [&_strong]:text-primary">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        ))}

        {/* Next lesson button */}
        {!loading && content && nextUrl && (
          <Link to={nextUrl}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center">
            Next Lesson <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        {/* Back to roadmap */}
        {!loading && content && !nextUrl && (
          <button onClick={() => navigate(`/mastery/${trackId}/roadmap`)}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-accent-gold hover:border-accent-gold/20 transition-all">
            <Crown className="h-4 w-4" />
            Track Complete — View Roadmap
          </button>
        )}
      </div>

      {/* Follow-up input */}
      {!loading && content && (
        <div className="px-5 pb-6 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={followUpInput}
              onChange={e => setFollowUpInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleFollowUp(); }}
              placeholder="Ask Owl about this lesson..."
              className="flex-1 bg-surface-2 rounded-xl px-4 py-3 text-caption text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/30 focus:outline-none transition-colors"
              disabled={followUpStreaming}
            />
            <button
              onClick={handleFollowUp}
              disabled={!followUpInput.trim() || followUpStreaming}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
