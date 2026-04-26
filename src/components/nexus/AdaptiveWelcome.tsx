// THE KNOWLEDGE NEXUS — Adaptive Welcome (Intuitive Intelligence Portal)
// Persona-driven welcome question, centered "Next Strategic Move", confidence meter.
// Cached for 1h per user.

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Compass, Volume2, RefreshCw, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FLAGSHIP_MODULES, getFlagshipModule } from "@/lib/nexus-flagship";
import { toast } from "@/hooks/use-toast";

interface WelcomePayload {
  generatedAt: number;
  welcomeLine: string;
  question: string;
  tag: string;
  confidence: number;
  action: { moduleId: string; title: string; valueProposition: string };
  hasGoal: boolean;
}

const STORAGE_KEY = "nexus-adaptive-welcome-v1";
const TTL_MS = 60 * 60 * 1000; // 1h

function readCached(): WelcomePayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as WelcomePayload;
    if (Date.now() - c.generatedAt < TTL_MS) return c;
    return null;
  } catch { return null; }
}

const TAG_LABELS: Record<string, { label: string; color: string }> = {
  "stalled-goal": { label: "Goal recovery", color: "text-amber-400" },
  "fresh-direction": { label: "New trajectory", color: "text-primary" },
  "momentum-amplify": { label: "Momentum amplifier", color: "text-accent-green" },
  "skill-gap": { label: "Gap close", color: "text-rose-400" },
  "first-strike": { label: "First strike", color: "text-accent-gold" },
};

export default function AdaptiveWelcome() {
  const { profile } = useUserProfile();
  const [payload, setPayload] = useState<WelcomePayload | null>(() => readCached());
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const flagships = FLAGSHIP_MODULES.map(m => ({
    id: m.id, pillar: m.pillar, title: m.title, hook: m.hook, tags: m.tags,
  }));

  const fetchWelcome = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCached();
      if (cached) { setPayload(cached); return; }
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-welcome", {
        body: { flagships, displayName: profile.displayName || "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPayload(data);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    } catch (err) {
      console.error("[AdaptiveWelcome]", err);
    } finally {
      setLoading(false);
    }
  }, [flagships, profile.displayName]);

  useEffect(() => {
    if (!payload) fetchWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakWelcome = useCallback(async () => {
    if (!payload || speaking) return;
    setSpeaking(true);
    try {
      const text = `${payload.welcomeLine} ${payload.question}`;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId: "kPtEHAvRnjUJFv7SK9WI" }),
      });
      if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);
      const blob = await resp.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(audioUrl); };
      await audio.play();
    } catch (err) {
      console.error("[Welcome TTS]", err);
      toast({ title: "Voice unavailable", description: "Try again in a moment.", variant: "destructive" });
      setSpeaking(false);
    }
  }, [payload, speaking]);

  const tagMeta = payload ? TAG_LABELS[payload.tag] || TAG_LABELS["first-strike"] : null;
  const flagship = payload?.action.moduleId ? getFlagshipModule(payload.action.moduleId) : null;

  return (
    <div className="px-5 pt-4 pb-2">
      <AnimatePresence mode="wait">
        {loading && !payload && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-5 flex items-center gap-3 border border-primary/15"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Synthesizing your welcome…</p>
          </motion.div>
        )}

        {payload && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative glass-card p-5 border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-accent-gold/[0.04] overflow-hidden"
          >
            <div className="absolute -top-12 -left-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-accent-gold/12 blur-3xl pointer-events-none" />

            <div className="relative">
              {/* Tag + actions */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`h-3 w-3 ${tagMeta?.color || "text-primary"}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tagMeta?.color || "text-primary"}`}>
                    {tagMeta?.label || "Welcome"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={speakWelcome}
                    disabled={speaking}
                    aria-label="Hear welcome"
                    className="h-7 w-7 rounded-lg hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {speaking ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => fetchWelcome(true)}
                    disabled={loading}
                    aria-label="Refresh welcome"
                    className="h-7 w-7 rounded-lg hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <p className="font-display text-lg font-bold text-foreground leading-tight">
                {payload.welcomeLine}
              </p>
              <p className="text-sm text-foreground/85 mt-1.5 leading-relaxed italic">
                "{payload.question}"
              </p>

              {/* Centralized Next Strategic Move */}
              {flagship && (
                <Link to={`/nexus/module/${flagship.id}`} className="block mt-4 group">
                  <div className="rounded-xl border border-primary/30 bg-background/60 backdrop-blur-sm p-3.5 hover:border-primary/60 transition-all">
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-primary mb-1.5">Next strategic move</p>
                    <p className="text-sm font-bold text-foreground leading-snug">{payload.action.title}</p>
                    <p className="text-[11px] text-foreground/75 mt-1.5 leading-relaxed">{payload.action.valueProposition}</p>
                    <div className="flex items-center gap-1 mt-2.5 text-[10px] uppercase tracking-wider font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      Begin <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Confidence meter */}
              <div className="mt-3.5 flex items-center gap-2">
                <Activity className="h-3 w-3 text-muted-foreground/70" />
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/80">
                  AI confidence
                </p>
                <div className="flex-1 h-[3px] rounded-full bg-surface-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${payload.confidence}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      payload.confidence >= 75 ? "bg-accent-green" :
                      payload.confidence >= 50 ? "bg-primary" : "bg-amber-400"
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-foreground/80 tabular-nums">{payload.confidence}</span>
              </div>

              {/* "What's Your Edge?" gamified CTA — show prominently when no goal or confidence is low */}
              {(!payload.hasGoal || payload.confidence < 55) && (
                <Link
                  to="/goals?intent=loa"
                  className="mt-3 flex items-center gap-2 rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] hover:bg-accent-gold/[0.1] transition-colors p-3 group"
                >
                  <Compass className="h-4 w-4 text-accent-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-tight">What's Your Edge?</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">2-min diagnostic → personalized trajectory</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-accent-gold group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
