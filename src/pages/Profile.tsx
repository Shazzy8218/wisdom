import { useState } from "react";
import { motion } from "framer-motion";
import { User, Wallet, Settings, Crown, ChevronRight, Sparkles, BarChart3, LogOut, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { profile, updateProfile } = useUserProfile();
  const { progress } = useProgress();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(profile.displayName);
  const navigate = useNavigate();

  const handleSaveName = () => {
    updateProfile({ displayName: nameValue.trim() });
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("wisdom-cloud-progress-loaded");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Profile</p>
        <h1 className="font-display text-h1 text-foreground">You</h1>
      </div>

      {/* User Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-4 glass-card p-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input value={nameValue} onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
                autoFocus
                className="flex-1 rounded-lg bg-surface-2 border border-border px-2 py-1 text-body text-foreground outline-none focus:border-primary/40" />
              <button onClick={handleSaveName} className="text-caption text-primary font-medium">Save</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-h3 text-foreground">{profile.displayName || "Learner"}</h2>
              <button onClick={() => { setNameValue(profile.displayName); setEditing(true); }}
                className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
          <p className="text-caption text-muted-foreground">{profile.plan === "pro" ? "Pro" : "Free"} Plan · {profile.learningStyle} learner</p>
        </div>
      </motion.div>

      {/* Scoreboard Card */}
      <div className="px-5 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link to="/scoreboard"
            className="glass-card p-5 flex items-center gap-4 hover:border-primary/20 transition-all block border-accent-gold/15">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gold/10">
              <BarChart3 className="h-5 w-5 text-accent-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-foreground">Scoreboard</p>
              <p className="text-caption text-muted-foreground">Tokens · Streak · Mastery · Daily Wisdom</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </motion.div>
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Learning Style */}
      <div className="px-5 mb-4">
        <p className="section-label mb-3">Learning Style</p>
        <div className="flex gap-2">
          {(["visual", "reader", "hands-on"] as const).map(style => (
            <button key={style} onClick={() => updateProfile({ learningStyle: style })}
              className={`flex-1 rounded-xl px-3 py-2.5 text-caption font-medium transition-all ${
                profile.learningStyle === style
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
              }`}>
              {style === "visual" ? "👁 Visual" : style === "reader" ? "📖 Reader" : "🛠 Hands-on"}
            </button>
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-4" />

      {/* Menu */}
      <div className="px-5 space-y-1.5">
        {[
          { icon: Wallet, label: "Wisdom Wallet", subtitle: `${progress.tokens} tokens`, to: "/wallet" },
          { icon: Sparkles, label: "Token Store", subtitle: "Unlock content", to: "/store" },
          { icon: Crown, label: "Upgrade to Pro", subtitle: "Unlock all tracks", to: "/upgrade", accent: true },
          { icon: Settings, label: "Settings", subtitle: "Memory, privacy, data", to: "/settings" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}>
            <Link to={item.to}
              className={`w-full glass-card p-4 flex items-center gap-4 text-left transition-all block ${
                item.accent ? "border-primary/20 hover:border-primary/40" : "hover:border-primary/10"
              }`}>
              <item.icon className={`h-4.5 w-4.5 ${item.accent ? "text-primary" : "text-text-tertiary"}`} strokeWidth={1.5} />
              <div className="flex-1">
                <p className={`text-body font-medium ${item.accent ? "text-primary" : "text-foreground"}`}>{item.label}</p>
                <p className="text-caption text-muted-foreground">{item.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Sign Out */}
      <div className="px-5 mt-6">
        <button onClick={handleSignOut}
          className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-destructive/20 transition-all">
          <LogOut className="h-4.5 w-4.5 text-destructive/70" strokeWidth={1.5} />
          <p className="text-body font-medium text-destructive/70">Sign Out</p>
        </button>
      </div>
    </div>
  );
}
