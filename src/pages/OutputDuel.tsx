import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, RotateCcw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface DuelQuestion {
  prompt: string;
  outputA: string;
  outputB: string;
  correctAnswer: "A" | "B";
  explanation: string;
  topic: string;
}

const STARTER_QUESTIONS: DuelQuestion[] = [
  {
    prompt: "Write a professional LinkedIn post about AI in business.",
    outputA: "AI is transforming business operations. Companies using AI report 40% faster decision-making. Here are 3 ways to start:\n\n1. Automate repetitive reports\n2. Use AI for customer sentiment analysis\n3. Build AI-assisted onboarding flows\n\nThe key? Start small, measure results, then scale.\n\n#AI #Business #Productivity",
    outputB: "AI is really cool and everyone should use it! It's the future and if you're not using AI you're going to be left behind! There are so many amazing things AI can do for your business it's incredible! Don't wait - start using AI today! 🚀🔥💯\n\n#AI #Future #Amazing",
    correctAnswer: "A",
    explanation: "Output A is specific, actionable, and professional. It includes a concrete stat, clear steps, and a thoughtful CTA. Output B is generic hype with no substance — exactly the kind of content that gets ignored.",
    topic: "LinkedIn Content",
  },
  {
    prompt: "Explain what an API is to a non-technical person.",
    outputA: "An API (Application Programming Interface) is a set of protocols and tools for building software applications. It specifies how software components should interact. APIs are used in web development for client-server communication via HTTP/HTTPS protocols using REST or GraphQL architectures.",
    outputB: "Think of an API as a waiter in a restaurant. You (the app) tell the waiter (API) what you want from the kitchen (server). The waiter takes your order, brings it to the kitchen, and returns with your food (data). You never need to go into the kitchen yourself — the waiter handles the communication.",
    correctAnswer: "B",
    explanation: "Output B uses a relatable analogy that anyone can understand. Output A is technically accurate but fails the brief — it explains APIs using more technical jargon, which defeats the purpose of explaining to a non-technical person.",
    topic: "Technical Communication",
  },
];

export default function OutputDuel() {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [question, setQuestion] = useState<DuelQuestion>(STARTER_QUESTIONS[0]);
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);

  const handleSelect = (choice: "A" | "B") => {
    if (submitted) return;
    setSelected(choice);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    if (selected === question.correctAnswer) {
      const bonus = streak >= 3 ? 5 : 0;
      setScore(s => s + 12 + bonus);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const isCorrect = submitted && selected === question.correctAnswer;

  const handleNext = () => {
    const nextIdx = (questionIdx + 1) % STARTER_QUESTIONS.length;
    setQuestionIdx(nextIdx);
    setQuestion(STARTER_QUESTIONS[nextIdx]);
    setSelected(null);
    setSubmitted(false);
    setRound(r => r + 1);
  };

  const handleReset = () => {
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-foreground">Output Duel</h1>
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

      <div className="px-5">
        <p className="text-caption text-muted-foreground mb-4">
          Two AI outputs for the same prompt. <span className="text-primary font-semibold">Pick the better one.</span>
        </p>

        {/* Prompt */}
        <div className="glass-card p-4 mb-5">
          <p className="section-label text-primary mb-1">{question.topic}</p>
          <p className="text-body text-foreground font-medium">Prompt: "{question.prompt}"</p>
        </div>

        {/* Outputs */}
        <div className="space-y-3 mb-5">
          {(["A", "B"] as const).map(choice => {
            const output = choice === "A" ? question.outputA : question.outputB;
            const isSelected = selected === choice;
            const isCorrectChoice = submitted && choice === question.correctAnswer;
            const isWrongChoice = submitted && isSelected && choice !== question.correctAnswer;

            return (
              <motion.button key={choice} onClick={() => handleSelect(choice)}
                disabled={submitted}
                whileTap={!submitted ? { scale: 0.98 } : undefined}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  isCorrectChoice
                    ? "border-accent-green/50 bg-accent-green/5"
                    : isWrongChoice
                    ? "border-primary/50 bg-primary/5"
                    : isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-surface-2 hover:border-border/80"
                }`}>
                <p className="text-micro font-bold text-primary uppercase tracking-wider mb-2">Output {choice}</p>
                <p className="text-caption text-muted-foreground whitespace-pre-line leading-relaxed">{output}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Submit / Result */}
        {!submitted ? (
          <button onClick={handleSubmit} disabled={!selected}
            className="w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-30 transition-opacity">
            Lock Answer
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className={`glass-card p-5 ${isCorrect ? "border-accent-green/30" : "border-primary/30"}`}>
              <p className={`font-display text-h3 ${isCorrect ? "text-accent-green" : "text-primary"}`}>
                {isCorrect ? "Sharp eye!" : "Not quite!"}
              </p>
              <p className="text-body text-muted-foreground mt-1">{question.explanation}</p>
              {isCorrect && (
                <div className="flex items-center gap-1.5 mt-2 text-caption text-accent-gold">
                  <Sparkles className="h-3.5 w-3.5" /> +{streak >= 3 ? 17 : 12} Wisdom Tokens
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleNext} className="flex-1 rounded-2xl bg-primary py-3 text-body font-bold text-primary-foreground">
                Next Duel →
              </button>
              <button onClick={handleReset}
                className="rounded-2xl bg-surface-2 px-4 py-3 text-body text-muted-foreground hover:bg-surface-hover transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
