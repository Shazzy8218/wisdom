import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getOwlHuntStatus } from "@/lib/owl-hunt";
import owlLogo from "@/assets/owl-logo.png";

export default function OwlHuntTracker() {
  const [status, setStatus] = useState(getOwlHuntStatus());

  useEffect(() => {
    const id = setInterval(() => setStatus(getOwlHuntStatus()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2/50 border border-border"
    >
      <img src={owlLogo} alt="Owl Hunt" className="w-4 h-4 opacity-70" />
      <span className="text-[10px] font-mono text-muted-foreground tracking-wide">
        {status.complete ? (
          <span className="text-accent-gold">Hunt Complete</span>
        ) : (
          <>
            <span className="text-accent-gold">{status.claimed}</span>
            <span className="opacity-50">/{status.max}</span>
          </>
        )}
      </span>
    </motion.div>
  );
}
