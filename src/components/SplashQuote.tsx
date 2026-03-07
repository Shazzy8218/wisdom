import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QUOTES } from "@/lib/data";

const SPLASH_SEEN_KEY = "wisdom-splash-quotes-v2";

interface SplashQuoteProps {
  onDismiss: () => void;
}

export default function SplashQuote({ onDismiss }: SplashQuoteProps) {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const seen = JSON.parse(localStorage.getItem(SPLASH_SEEN_KEY) || "[]") as number[];
    const available = QUOTES.map((_, i) => i).filter((i) => !seen.includes(i));
    if (available.length === 0) {
      // All exhausted — just pick one but don't reset (truly never repeat once pool is out)
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    } else {
      const pick = available[Math.floor(Math.random() * available.length)];
      setQuote(QUOTES[pick]);
      localStorage.setItem(SPLASH_SEEN_KEY, JSON.stringify([...seen, pick]));
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={onDismiss}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background cursor-pointer film-grain"
      >
        <div className="max-w-md px-8 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <span className="section-label text-primary">Wisdom AI</span>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="editorial-divider mx-auto w-16"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
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
            transition={{ delay: 1.2 }}
            className="text-caption text-text-tertiary tracking-wider"
          >
            Built for long-term thinkers.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2 }}
            className="text-micro text-muted-foreground"
          >
            TAP TO CONTINUE
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
