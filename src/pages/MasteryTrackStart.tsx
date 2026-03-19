import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, ChevronRight, Sparkles, Crown, Loader2, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMasteryTrack } from "@/lib/mastery-tracks";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";

type Phase = "onboarding" | "assessment" | "deliverable" | "roadmap";

interface OnboardingQuestion {
  question: string;
  answer: string;
}

const ONBOARDING_QUESTIONS = [
  (trackName: string) => `What is your #1 immediate goal you aim to achieve with ${trackName} in the next 30 days?`,
  (trackName: string) => `What existing skills or resources do you bring to ${trackName}?`,
  (trackName: string) => `What's the biggest obstacle you anticipate in mastering ${trackName}?`,
];

export default function MasteryTrackStart() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getMasteryTrack(trackId || "");
  const navigate = useNavigate();
  const { progress, update } = useProgress();

  const [phase, setPhase] = useState<Phase>("onboarding");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<OnboardingQuestion[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [assessmentAnswer, setAssessmentAnswer] = useState("");
  const [assessmentQ, setAssessmentQ] = useState("");
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [deliverableContent, setDeliverableContent] = useState("");
  const [deliverableLoading, setDeliverableLoading] = useState(false);
  const [deliverableAction, setDeliverableAction] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [phase, answers, deliverableContent, assessmentQ]);

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  const handleSubmitAnswer = () => {
    if (!inputValue.trim()) return;
    const q = ONBOARDING_QUESTIONS[currentQ](track.name);
    const newAnswers = [...answers, { question: q, answer: inputValue.trim() }];
    setAnswers(newAnswers);
    setInputValue("");

    if (currentQ < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Move to assessment phase
      setPhase("assessment");
      generateAssessment(newAnswers);
    }
  };

  const generateAssessment = async (collectedAnswers: OnboardingQuestion[]) => {
    setAssessmentLoading(true);
    const context = collectedAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
    const pillar = track.pillars[0];

    const messages: Msg[] = [
      {
        role: "user",
        content: `You are Wisdom Owl, a ruthless AI mentor. A user just started the "${track.name}" mastery track.

Their onboarding answers:
${context}

The first pillar of this track is: "${pillar.title}" — ${pillar.description}

Generate ONE sharp, targeted assessment question (multiple-choice with 4 options labeled A-D) that tests their current understanding of the first pillar's core concept. The question should reveal gaps in their knowledge and help calibrate their starting point.

Format:
**Question:** [question text]

A) [option]
B) [option]  
C) [option]
D) [option]

Keep it concise, practical, and directly relevant to real-world application.`
      }
    ];

    let result = "";
    await streamChat({
      messages,
      mode: "blueprint",
      onDelta: (t) => { result += t; setAssessmentQ(result); },
      onDone: () => setAssessmentLoading(false),
    });
  };

  const handleAssessmentSubmit = () => {
    if (!assessmentAnswer.trim()) return;
    setPhase("deliverable");
    generateDeliverable();
  };

  const generateDeliverable = async () => {
    setDeliverableLoading(true);
    const context = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
    const pillar = track.pillars[0];

    const messages: Msg[] = [
      {
        role: "user",
        content: `You are Wisdom Owl, a ruthless, results-oriented AI mentor. A user just started the "${track.name}" mastery track.

Track value proposition: ${track.valueProp}

Their goals and context:
${context}

Their assessment answer for "${pillar.title}": ${assessmentAnswer}

Now deliver their FIRST actionable micro-lesson for Pillar 1: "${pillar.title}" — ${pillar.description}

Requirements:
1. Start with a personalized 1-line acknowledgment of their goals
2. Deliver a concrete, actionable framework or blueprint they can use TODAY
3. Include specific steps (numbered), not theory
4. End with a "🎯 24-Hour Action Item:" — a specific, low-friction task they must complete within 24 hours to build momentum
5. Keep the tone direct, sharp, and results-oriented
6. Make it specific to THIS track, not generic advice
7. Maximum 400 words — density over length

Format with markdown. Use bold headers. Be ruthlessly practical.`
      }
    ];

    let result = "";
    let actionItem = "";
    await streamChat({
      messages,
      mode: "blueprint",
      onDelta: (t) => {
        result += t;
        setDeliverableContent(result);
        // Extract action item
        const actionMatch = result.match(/🎯.*?24.*?:/);
        if (actionMatch) {
          actionItem = result.slice(result.indexOf(actionMatch[0]));
          setDeliverableAction(actionItem);
        }
      },
      onDone: () => {
        setDeliverableLoading(false);
        // Mark track as started in progress
        update(p => ({
          ...p,
          completedLessons: p.completedLessons.includes(`mastery-${trackId}-started`)
            ? p.completedLessons
            : [...p.completedLessons, `mastery-${trackId}-started`],
          xp: p.xp + 25,
        }));
      },
    });
  };

  const goToRoadmap = () => setPhase("roadmap");

  const trackStarted = progress.completedLessons.includes(`mastery-${trackId}-started`);
  const progressPercent = trackStarted ? Math.max(1, Math.round((1 / (track.pillars.length * 5)) * 100)) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center gap-3 border-b border-border/50">
        <button
          onClick={() => navigate(`/mastery/${trackId}`)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold truncate">
              {phase === "onboarding" ? "Personalizing" : phase === "assessment" ? "Assessment" : phase === "deliverable" ? "First Blueprint" : "Your Roadmap"}
            </p>
          </div>
          <h1 className="font-display text-sm font-bold text-foreground leading-tight truncate">{track.name}</h1>
        </div>
        <span className="text-xl">{track.icon}</span>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* ===== ONBOARDING PHASE ===== */}
          {phase === "onboarding" && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Welcome message */}
              <div className="glass-card p-4 border-accent-gold/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gold/15">
                    <span className="text-sm">🦉</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-semibold text-foreground mb-1">Welcome, Operator.</p>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      You've chosen <span className="text-accent-gold font-semibold">{track.name}</span>. {track.valueProp}
                    </p>
                    <p className="text-micro text-muted-foreground mt-2 leading-relaxed">
                      Before we begin, I need to understand your situation. Answer these 3 questions so I can build your personalized blueprint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Completed answers */}
              {answers.map((a, i) => (
                <div key={i} className="space-y-2">
                  <div className="glass-card p-3 border-primary/15">
                    <p className="text-micro text-primary font-semibold mb-1">🦉 Question {i + 1}</p>
                    <p className="text-caption text-foreground">{a.question}</p>
                  </div>
                  <div className="glass-card p-3 ml-6 border-accent-gold/15">
                    <p className="text-caption text-foreground">{a.answer}</p>
                  </div>
                </div>
              ))}

              {/* Current question */}
              {currentQ < ONBOARDING_QUESTIONS.length && answers.length <= currentQ && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-3 border-primary/15"
                >
                  <p className="text-micro text-primary font-semibold mb-1">🦉 Question {currentQ + 1} of 3</p>
                  <p className="text-caption text-foreground">{ONBOARDING_QUESTIONS[currentQ](track.name)}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== ASSESSMENT PHASE ===== */}
          {phase === "assessment" && (
            <motion.div key="assessment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card p-4 border-accent-gold/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gold/15">
                    <span className="text-sm">🦉</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-semibold text-foreground mb-1">Quick Calibration</p>
                    <p className="text-micro text-muted-foreground">
                      Good answers. Now let me calibrate your starting point for <span className="font-semibold text-primary">{track.pillars[0].title}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {assessmentQ && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
                  <div className="prose prose-sm prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{assessmentQ}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {assessmentLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <p className="text-micro">Generating assessment...</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== DELIVERABLE PHASE ===== */}
          {phase === "deliverable" && (
            <motion.div key="deliverable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card p-4 border-accent-gold/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gold/15">
                    <Sparkles className="h-4 w-4 text-accent-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-semibold text-foreground mb-1">Your First Blueprint</p>
                    <p className="text-micro text-muted-foreground">
                      Pillar 1: <span className="font-semibold text-primary">{track.pillars[0].title}</span>
                    </p>
                  </div>
                </div>
              </div>

              {deliverableContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
                  <div className="prose prose-sm prose-invert max-w-none text-foreground [&_strong]:text-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-caption">
                    <ReactMarkdown>{deliverableContent}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {deliverableLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <p className="text-micro">Building your personalized blueprint...</p>
                </div>
              )}

              {!deliverableLoading && deliverableContent && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={goToRoadmap}
                  className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-accent-gold hover:border-accent-gold/30 transition-all"
                >
                  <Target className="h-4 w-4" />
                  View Your Track Roadmap
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ===== ROADMAP PHASE ===== */}
          {phase === "roadmap" && (
            <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Progress */}
              <div className="glass-card p-4 border-accent-gold/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Track Progress</p>
                  <p className="text-micro font-bold text-accent-gold">{progressPercent}%</p>
                </div>
                <Progress value={progressPercent} className="h-2 bg-surface-2" />
                <p className="text-micro text-muted-foreground mt-2">Pillar 1 initiated · {track.pillars.length} pillars total</p>
              </div>

              {/* Pillars roadmap */}
              <div className="space-y-3">
                {track.pillars.map((pillar, i) => {
                  const isActive = i === 0;
                  const isLocked = i > 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`glass-card p-4 ${isActive ? "border-accent-gold/30" : "opacity-60"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isActive ? "bg-accent-gold/20" : "bg-surface-2"
                        }`}>
                          {isActive ? (
                            <CheckCircle2 className="h-4 w-4 text-accent-gold" />
                          ) : (
                            <span className="text-micro font-bold text-muted-foreground">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-caption font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                              {pillar.title}
                            </p>
                            {isActive && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-accent-gold/15 text-accent-gold px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                            {isLocked && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-surface-2 text-muted-foreground px-1.5 py-0.5 rounded">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <p className="text-micro text-muted-foreground leading-relaxed mt-0.5">{pillar.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/")}
                  className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue in Chat with Wisdom Owl
                </button>
                <button
                  onClick={() => navigate(`/mastery/${trackId}`)}
                  className="w-full text-center text-micro text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Back to Track Overview
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area — shown during onboarding and assessment */}
      {(phase === "onboarding" || phase === "assessment") && (
        <div className="px-5 pb-6 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={phase === "onboarding" ? inputValue : assessmentAnswer}
              onChange={e => phase === "onboarding" ? setInputValue(e.target.value) : setAssessmentAnswer(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  phase === "onboarding" ? handleSubmitAnswer() : handleAssessmentSubmit();
                }
              }}
              placeholder={phase === "onboarding" ? "Type your answer..." : "Type your answer (A, B, C, or D)..."}
              className="flex-1 bg-surface-2 rounded-xl px-4 py-3 text-caption text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/30 focus:outline-none transition-colors"
              disabled={assessmentLoading}
            />
            <button
              onClick={() => phase === "onboarding" ? handleSubmitAnswer() : handleAssessmentSubmit()}
              disabled={
                (phase === "onboarding" && !inputValue.trim()) ||
                (phase === "assessment" && (!assessmentAnswer.trim() || assessmentLoading))
              }
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
