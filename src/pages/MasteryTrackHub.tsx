import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, CheckCircle2, Crown, BookOpen } from "lucide-react";
import { getMasteryTrack } from "@/lib/mastery-tracks";

export default function MasteryTrackHub() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getMasteryTrack(trackId || "");
  const navigate = useNavigate();

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="h-3 w-3 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold">Mastery Track</p>
          </div>
          <h1 className="font-display text-lg font-bold text-foreground leading-tight">{track.name}</h1>
        </div>
        <span className="text-2xl">{track.icon}</span>
      </div>

      {/* Value Prop */}
      <div className="px-5 mb-4">
        <p className="text-body text-muted-foreground leading-relaxed">{track.tagline}</p>
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Ultimate Value Proposition */}
      <div className="px-5 mb-5">
        <div className="glass-card p-5 border-accent-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
            <p className="text-micro font-bold text-accent-gold uppercase tracking-wider">Ultimate Value</p>
          </div>
          <p className="text-caption text-foreground leading-relaxed font-medium">{track.valueProp}</p>
        </div>
      </div>

      {/* Key Pillars */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <p className="text-micro font-bold text-primary uppercase tracking-wider">Key Pillars</p>
        </div>
        <div className="space-y-2">
          {track.pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-micro font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-semibold text-foreground mb-1">{pillar.title}</p>
                  <p className="text-micro text-muted-foreground leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Why College Level */}
      <div className="px-5 mb-6">
        <div className="glass-card p-5 border-primary/15">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <p className="text-micro font-bold text-primary uppercase tracking-wider">Why This Achieves College-Level Value</p>
          </div>
          <p className="text-caption text-muted-foreground leading-relaxed">{track.whyCollegeLevel}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5">
        <Link
          to={`/mastery/${trackId}/start`}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-semibold text-primary hover:border-primary/20 transition-all block text-center"
        >
          <Sparkles className="h-4 w-4" />
          Start This Mastery Track
        </Link>
      </div>
    </div>
  );
}
