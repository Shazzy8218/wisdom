// CAE — Cross-domain analogy fetcher (CTA). Inline, on-demand button.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedAnalogy, setCachedAnalogy } from "@/lib/learning-optimizer";

interface Props { moduleId: string; sectionIdx: number; sectionHeading: string; sectionBody: string }

export default function AnalogyButton({ moduleId, sectionIdx, sectionHeading, sectionBody }: Props) {
  const [text, setText] = useState<string | null>(getCachedAnalogy(moduleId, sectionIdx));
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (text) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-analogy", {
        body: { sectionHeading, sectionBody },
      });
      if (!error && data?.text) {
        setText(data.text);
        setCachedAnalogy(moduleId, sectionIdx, data.text);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-2">
      {!text && (
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.05] hover:bg-primary/[0.1] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-all disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" /> {loading ? "Forging analogy..." : "Cross-domain analogy"}
        </button>
      )}
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 glass-card p-3 border-l-2 border-primary/40 bg-primary/[0.03]"
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Analogy</p>
            <p className="text-xs text-foreground/85 leading-relaxed italic">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
