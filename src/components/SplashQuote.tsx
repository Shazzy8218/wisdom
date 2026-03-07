import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QUOTES } from "@/lib/data";
import owlLogo from "@/assets/owl-logo.png";

const SPLASH_SEEN_KEY = "wisdom-splash-quotes-v2";

interface SplashQuoteProps {
  onDismiss: () => void;
}

function getUnseenSplashQuote(): string {
  const seen = JSON.parse(localStorage.getItem(SPLASH_SEEN_KEY) || "[]") as number[];
  const available = QUOTES.map((_, i) => i).filter((i) => !seen.includes(i));
  if (available.length === 0) {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  localStorage.setItem(SPLASH_SEEN_KEY, JSON.stringify([...seen, pick]));
  return QUOTES[pick];
}

export default function SplashQuote({ onDismiss }: SplashQuoteProps) {
  const [quote] = useState(() => getUnseenSplashQuote());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      >
        <div className="max-w-md px-8 text-center space-y-8">
          {/* Owl Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <img
              src={owlLogo}
              alt="Wisdom AI"
              className="w-20 h-20 mx-auto drop-shadow-[0_0_20px_hsl(45,90%,55%,0.35)]"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <span className="section-label text-accent-gold tracking-[0.2em]">WISDOM AI</span>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            className="editorial-divider mx-auto w-16"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="font-display text-h3 font-bold text-foreground leading-tight"
          >
            "{quote}"
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
            className="editorial-divider mx-auto w-16"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-caption text-text-tertiary tracking-wider"
          >
            Built for long-term thinkers.
          </motion.p>

          {/* Tap to continue BUTTON (not anywhere-tap) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 10 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={onDismiss}
              disabled={!ready}
              className="mt-4 px-8 py-3 rounded-full border border-border bg-surface-2/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all tracking-widest uppercase"
            >
              Tap to continue
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
