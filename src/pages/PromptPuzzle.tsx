import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Trophy, Zap, RotateCcw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { generateGameQuestion } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";

interface Block {
  id: string;
  label: string;
  category: "role" | "goal" | "context" | "constraints" | "format";
  color: string;
}

interface PuzzleQuestion {
  prompt: string;
  blocks: Block[];
  correctOrder: string[];
  explanation: string;
  topic: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  role: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  goal: "bg-primary/20 border-primary/30 text-primary",
  context: "bg-purple-500/20 border-purple-500/30 text-purple-300",
  constraints: "bg-amber-500/20 border-amber-500/30 text-amber-300",
  format: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
};

const STARTER: PuzzleQuestion = {
  prompt: "You need to write a product description for an e-commerce store.",
  blocks: [
    { id: "b1", label: "You are an experienced e-commerce copywriter", category: "role", color: CATEGORY_COLORS.role },
    { id: "b2", label: "Write a compelling product description for a wireless headphone", category: "goal", color: CATEGORY_COLORS.goal },
    { id: "b3", label: "The target audience is tech-savvy millennials aged 25-35", category: "context", color: CATEGORY_COLORS.context },
    { id: "b4", label: "Keep it under 100 words, no technical jargon", category: "constraints", color: CATEGORY_COLORS.constraints },
    { id: "b5", label: "Use bullet points for features, paragraph for benefits", category: "format", color: CATEGORY_COLORS.format },
  ],
  correctOrder: ["b1", "b2", "b3", "b4", "b5"],
  explanation: "A great prompt follows: Role → Goal → Context → Constraints → Format. This gives AI clear identity, purpose, audience, limits, and output structure.",
  topic: "E-Commerce Copywriting",
};

export default function PromptPuzzle() {
  const [question, setQuestion] = useState<PuzzleQuestion>(STARTER);
  const [placed, setPlaced] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>(() =>
    [...STARTER.blocks.map(b => b.id)].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePlace = (blockId: string) => {
    if (submitted) return;
    setPlaced(prev => [...prev, blockId]);
    setAvailable(prev => prev.filter(id => id !== blockId));
  };

  const handleRemove = (idx: number) => {
    if (submitted) return;
    const blockId = placed[idx];
    setPlaced(prev => prev.filter((_, i) => i !== idx));
    setAvailable(prev => [...prev, blockId]);
  };

  const handleSubmit = () => {
    if (placed.length !== question.blocks.length) return;
    setSubmitted(true);
    const isCorrect = placed.every((id, i) => id === question.correctOrder[i]);
    if (isCorrect) {
      const bonus = streak >= 3 ? 5 : 0;
      setScore(s => s + 15 + bonus);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const isCorrect = submitted && placed.every((id, i) => id === question.correctOrder[i]);

  const handleNext = async () => {
    setLoading(true);
    setSubmitted(false);
    setRound(r => r + 1);
    // Reset with shuffled starter for now (AI generation would create new puzzles)
    const shuffled = [...STARTER.blocks.map(b => b.id)].sort(() => Math.random() - 0.5);
    setPlaced([]);
    setAvailable(shuffled);
    setQuestion(STARTER);
    setLoading(false);
  };

  const handleReset = () => {
    setSubmitted(false);
    const shuffled = [...question.blocks.map(b => b.id)].sort(() => Math.random() - 0.5);
    setPlaced([]);
    setAvailable(shuffled);
  };

  const getBlock = (id: string) => question.blocks.find(b => b.id === id)!;
  const SLOT_LABELS = ["Role", "Goal", "Context", "Constraints", "Format"];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-foreground">Prompt Puzzle</h1>
          <p className="text-micro text-muted-foreground">Round {round} · Score: {score}</p>
        </div>
        {streak >= 2 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-xl bg-accent-gold/10 px-3 py-1.5">
            <Zap className="h-3 w-3 text-accent-gold" />
            <span className="text-micro font-bold text-accent-gold">{streak}x</span>
          </motion.div>
        )}
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-body text-muted-foreground mt-4">Loading next puzzle...</p>
        </div>
      ) : (
        <div className="px-5">
          <p className="text-caption text-muted-foreground mb-4">
            Arrange the prompt blocks in the correct order: <span className="text-primary font-semibold">Role → Goal → Context → Constraints → Format</span>
          </p>

          {/* Task */}
          <div className="glass-card p-4 mb-5">
            <p className="section-label text-primary mb-1">{question.topic}</p>
            <p className="text-body text-foreground">{question.prompt}</p>
          </div>

          {/* Slots */}
          <div className="space-y-2 mb-5">
            {SLOT_LABELS.map((label, i) => {
              const blockId = placed[i];
              const block = blockId ? getBlock(blockId) : null;
              const isCorrectSlot = submitted && block && block.id === question.correctOrder[i];
              const isWrongSlot = submitted && block && block.id !== question.correctOrder[i];

              return (
                <motion.div
                  key={i}
                  className={`rounded-2xl border-2 border-dashed p-3 min-h-[52px] transition-all ${
                    block
                      ? isCorrectSlot
                        ? "border-accent-green/50 bg-accent-green/5"
                        : isWrongSlot
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-surface-2"
                      : "border-border/50 bg-surface-2/30"
                  }`}
                  onClick={() => block && handleRemove(i)}
                >
                  <p className="text-micro text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
                  {block ? (
                    <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-caption text-foreground">{block.label}</motion.p>
                  ) : (
                    <p className="text-caption text-text-tertiary italic">Tap a block below</p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Available Blocks */}
          {available.length > 0 && (
            <div className="space-y-1.5 mb-5">
              <p className="section-label mb-2">Available Blocks</p>
              {available.map(id => {
                const block = getBlock(id);
                return (
                  <motion.button key={id} layout
                    onClick={() => handlePlace(id)}
                    className={`w-full rounded-2xl border p-3 text-left text-caption transition-all ${block.color} hover:scale-[1.01] active:scale-[0.99]`}>
                    <span className="text-micro font-bold uppercase tracking-wider opacity-60">{block.category}</span>
                    <p className="mt-0.5">{block.label}</p>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Submit / Result */}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={placed.length !== question.blocks.length}
              className="w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-30 transition-opacity">
              Check Order
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className={`glass-card p-5 ${isCorrect ? "border-accent-green/30" : "border-primary/30"}`}>
                <p className={`font-display text-h3 ${isCorrect ? "text-accent-green" : "text-primary"}`}>
                  {isCorrect ? "Perfect Order!" : "Not quite right!"}
                </p>
                <p className="text-body text-muted-foreground mt-1">{question.explanation}</p>
                {isCorrect && (
                  <div className="flex items-center gap-1.5 mt-2 text-caption text-accent-gold">
                    <Sparkles className="h-3.5 w-3.5" /> +{streak >= 3 ? 20 : 15} Wisdom Tokens
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleNext} className="flex-1 rounded-2xl bg-primary py-3 text-body font-bold text-primary-foreground">
                  Next Puzzle →
                </button>
                <button onClick={handleReset}
                  className="rounded-2xl bg-surface-2 px-4 py-3 text-body text-muted-foreground hover:bg-surface-hover transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
