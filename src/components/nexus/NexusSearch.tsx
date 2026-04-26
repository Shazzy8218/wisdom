// THE KNOWLEDGE NEXUS — Intelligent Semantic Search
// Natural-language search bar over flagship + mastery + foundation catalogs.
// Returns AI-ranked results with one-line "why it matters to you" + adaptive filter chips.

import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FLAGSHIP_MODULES } from "@/lib/nexus-flagship";
import { MASTERY_TRACKS } from "@/lib/mastery-tracks";
import { CORE_TRACKS } from "@/lib/core-tracks";

interface SearchResult {
  moduleId: string;
  kind: "flagship" | "mastery" | "track";
  title: string;
  whyItMatters: string;
  relevance: number;
}

interface SearchPayload {
  interpretation: string;
  results: SearchResult[];
  suggestedFilters: string[];
  rephrase: string;
}

function linkFor(kind: string, id: string): string {
  if (kind === "flagship") return `/nexus/module/${id}`;
  if (kind === "mastery") return `/mastery/${id}`;
  return `/track/${id}`;
}

export default function NexusSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const catalog = useMemo(() => [
    ...FLAGSHIP_MODULES.map(m => ({ id: m.id, kind: "flagship" as const, pillar: m.pillar, title: m.title, hook: m.hook, tags: m.tags, difficulty: m.difficulty })),
    ...MASTERY_TRACKS.map(t => ({ id: t.id, kind: "mastery" as const, title: t.name, hook: t.tagline })),
    ...CORE_TRACKS.map(t => ({ id: t.id, kind: "track" as const, title: t.name })),
  ], []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 3) return;
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-search", {
        body: { query: q.trim(), catalog },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPayload(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [catalog]);

  const clear = () => { setQuery(""); setPayload(null); setErr(null); };

  return (
    <section className="px-5">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Intelligent Discovery</p>
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-3">Ask Anything</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") runSearch(query); }}
          placeholder='e.g. "AI monetization for service businesses without ethical pitfalls"'
          className="w-full bg-surface-2 rounded-xl pl-9 pr-20 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button onClick={clear} className="h-6 w-6 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground" aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => runSearch(query)}
            disabled={loading || query.trim().length < 3}
            className="rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ask"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {payload && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 space-y-2"
          >
            {payload.interpretation && (
              <p className="text-[11px] text-muted-foreground italic px-1">→ {payload.interpretation}</p>
            )}

            {payload.suggestedFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {payload.suggestedFilters.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => { const next = `${query} ${f}`.trim(); setQuery(next); runSearch(next); }}
                    className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2.5 py-1 transition-colors"
                  >
                    + {f}
                  </button>
                ))}
              </div>
            )}

            {payload.results.length === 0 && payload.rephrase && (
              <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
                Try: <button onClick={() => { setQuery(payload.rephrase); runSearch(payload.rephrase); }} className="text-primary underline">{payload.rephrase}</button>
              </div>
            )}

            {payload.results.map((r, i) => (
              <Link
                key={r.moduleId + i}
                to={linkFor(r.kind, r.moduleId)}
                className="block rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</p>
                  <span className="text-[9px] font-bold text-accent-gold tabular-nums shrink-0">{r.relevance}/100</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{r.whyItMatters}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] uppercase tracking-wider font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </motion.div>
        )}
        {err && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-rose-400 px-1">{err}</motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
