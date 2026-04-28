// CAE — DRO Phenomenon Preview. Live, current real-world signal tied to the module.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedPhenomenon, setCachedPhenomenon } from "@/lib/learning-optimizer";

interface Props { moduleId: string; moduleTitle: string; concept?: string }

export default function PhenomenonPreview({ moduleId, moduleTitle, concept }: Props) {
  const [data, setData] = useState<{ headline: string; takeaway: string; sourceUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = getCachedPhenomenon(moduleId);
    if (cached) { setData(cached); return; }
    setLoading(true);
    (async () => {
      try {
        const { data: res, error } = await supabase.functions.invoke("nexus-phenomenon", {
          body: { moduleTitle, concept: concept || moduleTitle },
        });
        if (!error && res && res.headline) {
          setData(res);
          setCachedPhenomenon(moduleId, res);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [moduleId, moduleTitle, concept]);

  if (loading) {
    return (
      <div className="glass-card p-3 border border-border/40 animate-pulse">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pulling live signal...</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-3 border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <div className="flex items-center gap-2 mb-1.5">
        <Radio className="h-3 w-3 text-primary animate-pulse" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Phenomenon · Last 30 days</p>
      </div>
      <p className="text-sm text-foreground/90 font-semibold leading-tight">{data.headline}</p>
      {data.takeaway && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">→ {data.takeaway}</p>}
      {data.sourceUrl && (
        <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
          Source <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </motion.div>
  );
}
