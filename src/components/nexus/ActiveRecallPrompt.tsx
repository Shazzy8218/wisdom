// CAE — In-lesson Active Recall pause. Forces retrieval before continuing.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Eye, Check } from "lucide-react";

interface Props {
  prompt: string;
  ideal: string;
}

export default function ActiveRecallPrompt({ prompt, ideal }: Props) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-4 border border-primary/25 bg-gradient-to-br from-primary/[0.05] to-transparent"
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Recall · Stop and retrieve</p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{prompt}</p>

      {!submitted ? (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="In your own words..."
            rows={3}
            className="mt-3 w-full bg-surface-2 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/40 focus:outline-none resize-none"
          />
          <button
            onClick={() => setSubmitted(true)}
            disabled={answer.trim().length < 5}
            className="mt-2 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-40 transition-opacity flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Lock answer
          </button>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-accent-green mb-1">Your retrieval</p>
          <p className="text-sm text-foreground/85 leading-relaxed italic">"{answer}"</p>
        </div>
      )}

      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <button
              onClick={() => setRevealed(v => !v)}
              className="mt-3 flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3 w-3" /> {revealed ? "Hide" : "Reveal"} reference
            </button>
            {revealed && (
              <div className="mt-2 glass-card p-3 border border-border/40 bg-surface-2/50">
                <p className="text-xs text-foreground/85 leading-relaxed">{ideal}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
