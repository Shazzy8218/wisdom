import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "lucide-react";
import { ANALYTICAL_FLAGS, getUserFlags, toggleUserFlag, type AnalyticalFlag } from "@/lib/feed-cards";

interface Props {
  cardId: string;
}

export default function AnalyticalFlagBar({ cardId }: Props) {
  const [flags, setFlags] = useState<AnalyticalFlag[]>(() => getUserFlags(cardId));
  const [open, setOpen] = useState(false);

  const handleToggle = (flag: AnalyticalFlag) => {
    const updated = toggleUserFlag(cardId, flag);
    setFlags(updated);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
      >
        <Tag className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold">Flag</span>
        {flags.length > 0 && (
          <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
            {flags.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 w-56 rounded-xl bg-surface-2 border border-border p-2 shadow-xl z-50"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-1 mb-1">
              Analytical Flags
            </p>
            {(Object.entries(ANALYTICAL_FLAGS) as [AnalyticalFlag, typeof ANALYTICAL_FLAGS[AnalyticalFlag]][]).map(([key, meta]) => {
              const active = flags.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleToggle(key)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all text-caption ${
                    active
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span className={active ? "text-primary font-semibold" : "text-muted-foreground"}>
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
