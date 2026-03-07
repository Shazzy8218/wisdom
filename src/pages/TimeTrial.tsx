import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, Timer, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface TrialQuestion {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: TrialQuestion[] = [
  {
    scenario: "You need AI to write a cold email. Which prompt is best?",
    options: [
      "Write an email",
      "Write a cold outreach email to a SaaS founder about our analytics tool. 3 sentences max. Include a specific pain point.",
      "Can you help me with an email please? I need it to be good.",
      "Email. Professional. Short. Sales.",
    ],
    correctIndex: 1,
    explanation: "Specific audience + product + constraint + pain point = best output.",
  },
  {
    scenario: "You want AI to review your resume. Best approach?",
    options: [
      "Fix my resume",
      "Make my resume better for any job",
      "Review my resume for a Senior Product Manager role at a B2B SaaS company. Focus on: impact metrics, leadership evidence, and ATS keywords.",
      "Check for grammar errors in my resume",
    ],
    correctIndex: 2,
    explanation: "Role-specific + company type + evaluation criteria = targeted, useful feedback.",
  },
  {
    scenario: "You need to brainstorm content ideas. Best prompt?",
    options: [
      "Give me content ideas",
      "Generate 15 LinkedIn post ideas for a fintech startup targeting CFOs. Mix: 5 educational, 5 case-study hooks, 5 contrarian takes. Each with a hook line.",
      "What should I post on social media?",
      "I need ideas for my business content strategy",
    ],
    correctIndex: 1,
    explanation: "Quantity + platform + audience + content mix + format = diverse, usable ideas.",
  },
  {
    scenario: "You're debugging code. Best way to ask AI?",
    options: [
      "My code doesn't work, fix it",
      "Here's my React component (pasted below). It throws 'Cannot read property of undefined' on line 23 when the user array is empty. Expected: show empty state. Environment: React 18, TypeScript.",
      "Help with React",
      "I have a bug somewhere in my code",
    ],
    correctIndex: 1,
    explanation: "Error message + specific line + expected behavior + environment = precise fix.",
  },
  {
    scenario: "You want AI to create a study plan. Best prompt?",
    options: [
      "Help me study",
      "Create a study plan for me",
      "Design a 4-week study plan for AWS Solutions Architect certification. I have 2 hours/day, weekdays only. I'm familiar with basic networking but new to cloud services. Include: daily topics, practice exercises, and a mock exam schedule.",
      "I need to learn cloud computing",
    ],
    correctIndex: 2,
    explanation: "Specific cert + time constraints + current knowledge + structure = actionable plan.",
  },
];

export default function TimeTrial() {
  const [gameState, setGameState] = useState<"ready" | "playing" | "results">("ready");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answered, setAnswered] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (timeLeft === 0 && gameState === "playing") {
      setGameState("results");
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState("playing");
    setCurrentQ(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setAnswered(0);
    setSelected(null);
    setShowFeedback(false);
  };

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    setAnswered(a => a + 1);

    const q = QUESTIONS[currentQ % QUESTIONS.length];
    if (idx === q.correctIndex) {
      const points = 10 + combo * 2;
      setScore(s => s + points);
      setCombo(c => {
        const newCombo = c + 1;
        setMaxCombo(m => Math.max(m, newCombo));
        return newCombo;
      });
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      setSelected(null);
      setShowFeedback(false);
      setCurrentQ(q => q + 1);
    }, 1200);
  };

  const question = QUESTIONS[currentQ % QUESTIONS.length];
  const isCorrect = selected === question.correctIndex;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link to="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-foreground">Time Trial</h1>
          <p className="text-micro text-muted-foreground">Pick the best prompt — fast!</p>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      <div className="px-5">
        {gameState === "ready" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12">
            <Timer className="h-16 w-16 text-primary mb-4" />
            <h2 className="font-display text-h2 text-foreground mb-2">60 Seconds</h2>
            <p className="text-body text-muted-foreground text-center mb-8">
              Pick the best prompt for each scenario. Build combos for bonus points!
            </p>
            <button onClick={startGame}
              className="rounded-2xl bg-primary px-8 py-3.5 text-body font-bold text-primary-foreground">
              Start Trial
            </button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <>
            {/* Timer + Stats */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Timer className={`h-4 w-4 ${timeLeft <= 10 ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                <span className={`font-display text-h3 font-bold ${timeLeft <= 10 ? "text-primary" : "text-foreground"}`}>{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-caption text-muted-foreground">Score: {score}</span>
                {combo >= 2 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 rounded-xl bg-accent-gold/10 px-2 py-1">
                    <Zap className="h-3 w-3 text-accent-gold" />
                    <span className="text-micro font-bold text-accent-gold">{combo}x</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full rounded-full bg-secondary mb-5 overflow-hidden">
              <motion.div className="h-full rounded-full bg-primary"
                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}>
                <p className="text-body font-semibold text-foreground mb-4">{question.scenario}</p>
                <div className="space-y-2">
                  {question.options.map((opt, idx) => {
                    let classes = "border-border bg-surface-2 hover:border-border/80";
                    if (showFeedback) {
                      if (idx === question.correctIndex) classes = "border-accent-green/50 bg-accent-green/5";
                      else if (idx === selected) classes = "border-primary/50 bg-primary/5";
                      else classes = "border-border bg-surface-2 opacity-40";
                    } else if (selected === idx) {
                      classes = "border-primary/40 bg-primary/10";
                    }

                    return (
                      <motion.button key={idx}
                        whileTap={!showFeedback ? { scale: 0.98 } : undefined}
                        onClick={() => handleSelect(idx)}
                        disabled={showFeedback}
                        className={`w-full rounded-2xl border p-3.5 text-left text-caption transition-all ${classes}`}>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`mt-3 text-caption ${isCorrect ? "text-accent-green" : "text-primary"}`}>
                    {isCorrect ? "✓ Correct!" : "✗ " + question.explanation}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {gameState === "results" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-8">
            <Sparkles className="h-12 w-12 text-accent-gold mb-4" />
            <h2 className="font-display text-h2 text-foreground mb-1">Time's Up!</h2>
            <div className="grid grid-cols-3 gap-4 my-6 w-full">
              <div className="glass-card p-4 text-center">
                <p className="hero-number text-primary">{score}</p>
                <p className="section-label mt-1">Score</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="hero-number text-foreground">{answered}</p>
                <p className="section-label mt-1">Answered</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="hero-number text-accent-gold">{maxCombo}x</p>
                <p className="section-label mt-1">Best Combo</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-6 text-caption text-accent-gold">
              <Sparkles className="h-3.5 w-3.5" /> +{Math.round(score / 2)} Wisdom Tokens earned
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={startGame} className="flex-1 rounded-2xl bg-primary py-3 text-body font-bold text-primary-foreground">
                Play Again
              </button>
              <Link to="/games" className="rounded-2xl bg-surface-2 px-5 py-3 text-body text-muted-foreground hover:bg-surface-hover transition-colors">
                Back
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
