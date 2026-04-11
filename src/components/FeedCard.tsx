import { useState, memo } from "react";
import { motion } from "framer-motion";
import { Bookmark, Share2, Sparkles, ChevronDown, Check, X } from "lucide-react";
import { type FeedCard as FeedCardT, CARD_TYPE_CONFIG } from "@/lib/feed-cards";

function FeedCardInner({ card, onComplete }: { card: FeedCardT; onComplete: (id: string, xp: number, tokens: number) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const config = CARD_TYPE_CONFIG[card.type] || { label: card.type, color: "text-muted-foreground" };

  const handleChoice = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    onComplete(card.id, card.xp, card.tokens);
  };

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    onComplete(card.id, card.xp, card.tokens);
  };

  return (
    <div className="snap-start min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 relative overflow-hidden"
      >
        {/* Film grain overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        {/* Header: badges */}
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-current/20 ${config.color}`}>
            {config.label}
          </span>
          {card.urgencyLevel && card.urgencyLevel !== "low" && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              card.urgencyLevel === "critical" ? "bg-red-500/20 text-red-400" :
              card.urgencyLevel === "high" ? "bg-amber-500/20 text-amber-400" :
              "bg-blue-500/20 text-blue-400"
            }`}>
              {card.urgencyLevel.toUpperCase()}
            </span>
          )}
          {card.confidence && (
            <span className="text-[10px] text-muted-foreground/60 ml-auto font-mono">
              {card.confidence}% conf
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-bold text-foreground leading-tight mb-2 relative z-10">
          {card.title}
        </h2>

        {/* Hook */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 relative z-10">
          {card.hook}
        </p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

        {/* Visual block */}
        {card.visual === "steps" && card.visualData?.steps && (
          <div className="mb-4 space-y-2 relative z-10">
            {(card.visualData.steps as string[]).map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-xs text-foreground/80 pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        )}

        {card.visual === "chips" && card.visualData?.chips && (
          <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
            {(card.visualData.chips as string[]).map((chip: string, i: number) => (
              <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-foreground/70">{chip}</span>
            ))}
          </div>
        )}

        {card.visual === "before-after" && card.visualData && (
          <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
            <div className="rounded-xl bg-red-500/[0.06] border border-red-500/10 p-3">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Before</span>
              <p className="text-xs text-foreground/70 mt-1">{card.visualData.before}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 p-3">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">After</span>
              <p className="text-xs text-foreground/70 mt-1">{card.visualData.after}</p>
            </div>
          </div>
        )}

        {/* Content body */}
        <p className="text-[13px] text-foreground/75 leading-relaxed mb-4 relative z-10 whitespace-pre-line">
          {card.content}
        </p>

        {/* Try it now block */}
        {card.tryPrompt && (
          <div className="rounded-xl bg-primary/[0.06] border border-primary/15 p-3.5 mb-4 relative z-10">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Try It Now</span>
            <p className="text-xs text-foreground/70 mt-1.5">{card.tryPrompt}</p>
          </div>
        )}

        {/* Interaction: choice */}
        {card.interaction === "choice" && card.options && (
          <div className="space-y-2 mb-4 relative z-10">
            {card.options.map((opt, i) => (
              <button key={i} onClick={() => handleChoice(i)}
                className={`w-full text-left text-xs px-4 py-3 rounded-xl border transition-all duration-200 ${
                  selected === null
                    ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-foreground/80"
                    : selected === i
                      ? i === card.correctAnswer
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                      : i === card.correctAnswer
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60"
                        : "border-white/[0.04] bg-white/[0.01] text-foreground/30"
                }`}>
                <div className="flex items-center gap-2">
                  {selected !== null && i === card.correctAnswer && <Check className="w-3.5 h-3.5" />}
                  {selected === i && i !== card.correctAnswer && <X className="w-3.5 h-3.5" />}
                  {opt}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Interaction: reveal */}
        {card.interaction === "reveal" && (
          <button onClick={handleReveal}
            className={`w-full text-center text-xs px-4 py-3 rounded-xl border transition-all duration-200 mb-4 relative z-10 ${
              revealed
                ? "border-primary/20 bg-primary/5 text-primary"
                : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-foreground/60"
            }`}>
            {revealed ? "✓ Decoded" : (
              <span className="flex items-center justify-center gap-2">
                <ChevronDown className="w-3.5 h-3.5" /> Tap to Decode
              </span>
            )}
          </button>
        )}

        {/* Source */}
        {card.source && (
          <p className="text-[10px] text-muted-foreground/40 mb-3 relative z-10 italic">{card.source}</p>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-accent-gold font-semibold">+{card.xp} XP</span>
            <span className="text-[10px] text-muted-foreground">✦ {card.tokens}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved(!saved)}
              className={`p-1.5 rounded-lg transition-colors ${saved ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
              <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors">
              <Sparkles className="w-3 h-3" /> Decode
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FeedCard = memo(FeedCardInner);
export default FeedCard;
