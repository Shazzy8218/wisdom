// THE KNOWLEDGE NEXUS — Strategic Serendipity (dashboard card + deep-dive)
// One AI-generated cross-domain insight per day, cached locally by date.

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, ArrowRight, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface SerendipityCard {
  generatedAt: number;
  forDate: string;
  primaryGoal: string | null;
  title: string;
  sourceDomain: string;
  keyTakeaway: string;
  whyThisMattersToYou: string;
  actionableImplications: string[];
  relatedNexusTags?: string[];
}

const STORAGE_KEY = "nexus-serendipity-card-v1";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readCached(): SerendipityCard | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as SerendipityCard;
    if (c?.forDate === todayStr()) return c;
    return null;
  } catch {
    return null;
  }
}

function writeCached(c: SerendipityCard) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function useSerendipityCard() {
  const [card, setCard] = useState<SerendipityCard | null>(() => readCached());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchToday = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCached();
      if (cached) {
        setCard(cached);
        return cached;
      }
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-serendipity");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      writeCached(data);
      setCard(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load.";
      setErr(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!card) fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { card, loading, err, refresh: () => fetchToday(true) };
}

/* ─────────── Dashboard card (compact) ─────────── */

export function SerendipityDashboardCard({ delay = 0.25 }: { delay?: number }) {
  const { card, loading } = useSerendipityCard();

  if (loading && !card) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="mx-5 mb-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Synthesizing today's serendipity…</p>
      </motion.div>
    );
  }

  if (!card) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="mx-5 mb-4">
      <Link
        to="/nexus#serendipity"
        className="block relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-accent-gold/[0.04] p-4 hover:border-primary/40 transition-all group"
      >
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-accent-gold/10 blur-2xl opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-2">
            <Compass className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Today's Serendipity</p>
          </div>
          <p className="font-display text-base font-bold text-foreground leading-snug">{card.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 italic">from {card.sourceDomain}</p>
          <p className="text-xs text-foreground/85 mt-2 leading-relaxed line-clamp-2">{card.keyTakeaway}</p>
          <div className="flex items-center gap-1 mt-3 text-[10px] uppercase tracking-wider font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            Explore the connection <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────── Deep-dive (Nexus page) — Strategic Serendipity Console ─────────── */

const CLAIMED_KEY = "nexus-serendipity-claimed-v1";
function isClaimedToday(): boolean {
  try { return localStorage.getItem(CLAIMED_KEY) === todayStr(); } catch { return false; }
}

export function SerendipityDeepDive() {
  const { card, loading, err, refresh } = useSerendipityCard();
  const [claimed, setClaimed] = useState<boolean>(() => isClaimedToday());
  const [biasOpen, setBiasOpen] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    try { localStorage.setItem(CLAIMED_KEY, todayStr()); } catch {}
    setClaimed(true);
    // Award tokens via existing progress hook would require import; keep lightweight here
    try {
      const ev = new CustomEvent("wisdom:award-tokens", { detail: { tokens: 5, reason: "serendipity-claim" } });
      window.dispatchEvent(ev);
    } catch {}
  };

  return (
    <section id="serendipity" className="px-5 scroll-mt-20">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Compass className="h-3.5 w-3.5 text-accent-gold" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Strategic Serendipity Console</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground">Today's Cross-Domain Insight</h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
        One unexpected, defensible insight to break the filter bubble.
      </p>

      {loading && !card && (
        <div className="glass-card p-6 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Synthesizing…</p>
        </div>
      )}
      {err && !card && (
        <div className="glass-card p-4 text-xs text-rose-400">{err}</div>
      )}
      {card && (
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border border-accent-gold/25 bg-gradient-to-br from-accent-gold/[0.05] via-transparent to-primary/[0.05] relative overflow-hidden"
        >
          {/* Animated data-stream background */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <motion.div
              className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-accent-gold/20 blur-3xl"
              animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Subtle scan line */}
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent"
              initial={{ top: "0%" }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3 w-3 text-accent-gold" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">Source domain · {card.sourceDomain}</p>
            </div>
            <h3 className="font-display text-xl font-black text-foreground leading-tight">{card.title}</h3>
            <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{card.keyTakeaway}</p>

            <div className="editorial-divider my-4" />

            <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1.5">
              Why this matters to you{card.primaryGoal ? ` · ${card.primaryGoal}` : ""}
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{card.whyThisMattersToYou}</p>

            {card.actionableImplications?.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-accent-green mb-2">This week, do this</p>
                <ul className="space-y-1.5">
                  {card.actionableImplications.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed">
                      <ChevronRight className="h-3 w-3 mt-1 shrink-0 text-accent-green" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cognitive Bias Interrupt */}
            <button
              onClick={() => setBiasOpen(v => !v)}
              className="mt-4 w-full text-left rounded-xl border border-primary/25 bg-primary/[0.05] hover:bg-primary/[0.08] transition-colors p-3"
            >
              <p className="text-[9px] uppercase tracking-wider font-bold text-primary mb-1">Cognitive bias interrupt</p>
              <p className="text-xs text-foreground/90 italic leading-snug">
                Did you ever consider {card.sourceDomain.toLowerCase()} principles could apply to your current strategy?
              </p>
              {biasOpen && (
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Hold this question for 30 seconds before dismissing. Most operator blind spots dissolve under deliberate cross-domain pressure.
                </p>
              )}
            </button>

            {/* Claim for tokens (gamified discovery) */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleClaim}
                disabled={claimed}
                className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  claimed
                    ? "bg-accent-green/15 text-accent-green cursor-default"
                    : "bg-accent-gold text-background hover:bg-accent-gold/90"
                }`}
              >
                {claimed ? "✓ Claimed today" : "Claim insight · +5 tokens"}
              </button>
            </div>

            {card.relatedNexusTags && card.relatedNexusTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {card.relatedNexusTags.map((t, i) => (
                  <span key={i} className="text-[10px] bg-surface-2 rounded-full px-2 py-0.5 text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.article>
      )}
    </section>
  );
}
