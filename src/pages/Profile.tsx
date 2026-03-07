import { useState } from "react";
import { motion } from "framer-motion";
import { User, Wallet, BookOpen, Settings, Crown, ChevronRight, Sparkles, Wrench, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgress } from "@/hooks/useProgress";
import HiddenOwl from "@/components/HiddenOwl";

export default function Profile() {
  const { profile, updateProfile } = useUserProfile();
  const { progress } = useProgress();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(profile.displayName);

  const handleSaveName = () => {
    updateProfile({ displayName: nameValue.trim() });
    setEditing(false);
  };

  const masteryAvg = Object.values(progress.masteryScores).length > 0
    ? Math.round(Object.values(progress.masteryScores).reduce((a, b) => a + b, 0) / Object.values(progress.masteryScores).length)
    : 0;

  const MENU_ITEMS = [
    { icon: Wallet, label: "Wisdom Wallet", subtitle: `${progress.tokens} tokens`, to: "/wallet" },
    { icon: Sparkles, label: "Token Store", subtitle: "Unlock content", to: "/store" },
    { icon: BookOpen, label: "My Learning", subtitle: `${progress.completedLessons.length} lessons completed`, to: "/library" },
    { icon: Wrench, label: "Playground", subtitle: "Test & compare prompts", to: "/playground" },
    { icon: Crown, label: "Upgrade to Pro", subtitle: "Unlock all tracks", to: "/upgrade", accent: true },
    { icon: Settings, label: "Settings", subtitle: "Memory, notifications", to: "/settings" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6 relative">
        <HiddenOwl locationId="profile-avatar" className="absolute right-6 bottom-8" size={16} />
        <p className="section-label text-primary mb-2">Profile</p>
        <h1 className="font-display text-h1 text-foreground">Your Journey</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-6 glass-card p-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-7 w-7 text-primary" />
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
          <p className="text-caption text-muted-foreground">{profile.learningStyle} learner · {progress.streak} day streak · {profile.plan === "pro" ? "Pro" : "Free"} Plan</p>
        </div>
      </motion.div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        {[
          { val: String(progress.tokens), label: "Tokens" },
          { val: String(progress.streak), label: "Streak" },
          { val: `${masteryAvg}%`, label: "Mastery" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-4 text-center">
            <p className="font-display text-h2 text-foreground">{s.val}</p>
            <p className="section-label mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Learning Style Selector */}
      <div className="px-5 mb-6">
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

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-2">
        {MENU_ITEMS.map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}>
            <Link to={item.to}
              className={`w-full glass-card p-5 flex items-center gap-4 text-left transition-all duration-200 block ${
                item.accent ? "border-primary/20 glow-red hover:border-primary/40" : "hover:border-primary/10"
              }`}>
              <item.icon className={`h-5 w-5 ${item.accent ? "text-primary" : "text-text-tertiary"}`} strokeWidth={1.5} />
              <div className="flex-1">
                <p className={`text-body font-medium ${item.accent ? "text-primary" : "text-foreground"}`}>{item.label}</p>
                <p className="text-caption text-muted-foreground">{item.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
