import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, Share2, CheckCircle2, AlertTriangle, Zap, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FeedCard as FeedCardType } from "@/lib/feed-cards";
import { toggleSaveCard, getSavedCards } from "@/lib/feed-cards";
import OwlIcon from "@/components/OwlIcon";

interface Props {
  card: FeedCardType;
  onComplete: (id: string, xp: number, tokens: number) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "quick-fact": { label: "QUICK FACT", color: "text-accent-foreground bg-accent/20" },
  "micro-lesson": { label: "MICRO-LESSON", color: "text-primary" },
  "news": { label: "EVERGREEN", color: "text-accent-foreground" },
  "challenge": { label: "CHALLENGE", color: "text-primary" },
  "myth-vs-truth": { label: "MYTH VS TRUTH", color: "text-destructive" },
  "video": { label: "VIDEO", color: "text-accent-foreground" },
};

function VisualBlock({ card }: { card: FeedCardType }) {
  if (card.type === "myth-vs-truth") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-micro font-bold uppercase tracking-widest text-destructive mb-1">❌ MYTH</p>
          <p className="text-body text-foreground">{card.mythStatement}</p>
        </div>
        <div className="rounded-2xl border border-accent-green/30 bg-accent-green/10 p-4">
          <p className="text-micro font-bold uppercase tracking-widest text-accent-green mb-1">✅ TRUTH</p>
          <p className="text-body text-foreground">{card.truthStatement}</p>
        </div>
      </div>
    );
  }

  if (card.visual === "compare" && card.visualData?.before && card.visualData?.after) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-micro font-bold text-destructive mb-1">BEFORE</p>
          <p className="text-caption text-muted-foreground leading-relaxed">{card.visualData.before}</p>
        </div>
        <div className="rounded-2xl bg-accent-green/10 border border-accent-green/20 p-3">
          <p className="text-micro font-bold text-accent-green mb-1">AFTER</p>
          <p className="text-caption text-muted-foreground leading-relaxed">{card.visualData.after}</p>
        </div>
      </div>
    );
  }

  if (card.visual === "diagram" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {card.visualData.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-xl bg-primary/15 border border-primary/20 px-3 py-1.5 text-caption font-medium text-primary">
                {label}
              </span>
              {i < card.visualData!.labels!.length - 1 && !label.includes("→") && !label.includes("←") && (
                <span className="text-muted-foreground text-caption">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.visual === "steps" && card.visualData?.steps) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-2">
        {card.visualData.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-micro font-bold text-primary">{i + 1}</span>
            <p className="text-caption text-muted-foreground leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
    );
  }

  if (card.visual === "chart" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 flex gap-2 justify-center flex-wrap">
        {card.visualData.labels.map((label, i) => (
          <span key={i} className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-micro font-medium text-primary">
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (card.visual === "infographic" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-2">
        {card.visualData.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent-gold flex-shrink-0" />
            <p className="text-caption text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function FeedCard({ card, onComplete }: Props) {
  const [revealed, setRevealed] = useState(card.interaction !== "tap-reveal");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(() => getSavedCards().includes(card.id));
  const navigate = useNavigate();

  const typeInfo = TYPE_LABELS[card.type] || TYPE_LABELS["quick-fact"];

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === card.correctAnswer) {
      setTimeout(() => { setCompleted(true); onComplete(card.id, card.xp, card.tokens); }, 500);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    if (!card.interaction || card.interaction === "tap-reveal") {
      setTimeout(() => { setCompleted(true); onComplete(card.id, card.xp, card.tokens); }, 800);
    }
  };

  const handleSave = () => { const nowSaved = toggleSaveCard(card.id); setSaved(nowSaved); };

  const handleAskAI = () => {
    const q = encodeURIComponent(`Explain more about: ${card.title}. Context: ${card.content}`);
    navigate(`/chat?context=${q}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: card.title, text: card.shareSnippet, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(card.shareSnippet);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] snap-start flex flex-col justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="glass-card overflow-hidden film-grain max-w-lg mx-auto w-full"
      >
        {/* Type badge + category */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${typeInfo.color}`}>{typeInfo.label}</span>
              <span className="text-text-tertiary text-[9px]">·</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{card.difficulty}</span>
            </div>
            {card.confidence !== undefined && (
              <span className="text-[9px] font-semibold text-accent-gold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {card.confidence}% confidence
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-display text-xl font-bold text-foreground leading-tight mb-2">{card.title}</h2>
          <p className="text-body text-muted-foreground">{card.hook}</p>
        </div>

        <div className="editorial-divider mx-5" />

        {/* Visual section */}
        <div className="p-5">
          <VisualBlock card={card} />
        </div>

        {/* Content */}
        <div className="px-5 pb-4">
          {card.interaction === "tap-reveal" && !revealed ? (
            <button onClick={handleReveal}
              className="w-full rounded-2xl bg-surface-2 border border-border p-4 text-center text-body font-medium text-muted-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2">
              <ChevronDown className="h-4 w-4 text-primary" /> Tap to reveal insight
            </button>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                <p className="text-body leading-relaxed text-muted-foreground whitespace-pre-line">{card.content}</p>

                {/* Choice interaction */}
                {card.interaction === "choice" && card.options && (
                  <div className="space-y-2">
                    {card.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOptionSelect(idx)}
                        disabled={selectedOption !== null}
                        className={`w-full rounded-xl border p-3 text-left text-caption transition-all duration-200 ${
                          selectedOption === null
                            ? "border-border bg-surface-2 hover:border-primary/30"
                            : selectedOption === idx
                              ? idx === card.correctAnswer
                                ? "border-accent-green/50 bg-accent-green/10 text-foreground"
                                : "border-destructive/50 bg-destructive/10"
                              : idx === card.correctAnswer
                                ? "border-accent-green/50 bg-accent-green/10"
                                : "border-border bg-surface-2 opacity-30"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source for news */}
                {card.source && (
                  <p className="text-[10px] text-text-tertiary italic">📎 {card.source} • Always verify independently</p>
                )}

                {/* Try it now */}
                {card.tryPrompt && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Try It Now</p>
                    <p className="text-caption text-muted-foreground">{card.tryPrompt}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="editorial-divider mx-5" />

        {/* Actions */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-caption text-muted-foreground">
              ✦ +{card.tokens}
            </span>
            <span className="text-caption text-text-tertiary">+{card.xp} XP</span>
            {completed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="h-4 w-4 text-accent-green" />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleAskAI} className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
              <OwlIcon size={16} /><span className="text-[10px] font-semibold">Ask Owl</span>
            </button>
            <button onClick={handleSave} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleShare} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
