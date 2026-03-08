import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, BookOpen, Target, DollarSign, Users, Sparkles } from "lucide-react";
import { getCoreTrack } from "@/lib/core-tracks";

export default function CoreTrackHub() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getCoreTrack(trackId || "");
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
          <p className="section-label text-primary">{track.icon} Core Track</p>
          <h1 className="font-display text-h3 text-foreground">{track.name}</h1>
        </div>
      </div>

      {/* Tagline */}
      <div className="px-5 mb-5">
        <p className="text-body text-muted-foreground leading-relaxed">{track.description}</p>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Info Cards */}
      <div className="px-5 space-y-3 mb-6">
        <InfoRow icon={Target} label="What you'll learn" value={track.outcome} />
        <InfoRow icon={DollarSign} label="Money angle" value={track.moneyAngle} />
        <InfoRow icon={Users} label="Who it's for" value={track.whoFor} />
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* Modules */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <p className="section-label text-primary">Modules</p>
        </div>
        <div className="space-y-1.5">
          {track.modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-3.5 flex items-center gap-3"
            >
              <span className="text-micro font-bold text-primary w-5 text-center">{i + 1}</span>
              <p className="text-caption text-foreground flex-1">{mod}</p>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-5" />

      {/* CTA */}
      <div className="px-5">
        <Link
          to="/"
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-body font-medium text-primary hover:border-primary/20 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Start Learning in AI Chat
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-micro font-bold text-primary uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-caption text-muted-foreground leading-relaxed">{value}</p>
    </div>
  );
}
