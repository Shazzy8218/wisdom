import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Trash2, Eye, RotateCcw, Wifi, Loader2, CheckCircle, XCircle, LogOut, Shield, HelpCircle, Download, AlertTriangle, Target, Layers, Activity, MessageSquare, Smartphone, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { streamChat, generateLesson, generateGameQuestion } from "@/lib/ai-stream";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useCalibration } from "@/hooks/useCalibration";
import HiddenOwl from "@/components/HiddenOwl";

interface MemoryToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const MEMORY_TOGGLES: MemoryToggle[] = [
  { id: "useActivity", label: "Personalize using my activity", description: "Owl sees your mastery, streaks, favorites, and weak spots", icon: "📊" },
  { id: "useChatHistory", label: "Use my chat history", description: "Owl remembers your recent conversation topics", icon: "💬" },
  { id: "goals", label: "Remember goals", description: "Owl references your learning goals in responses", icon: "🎯" },
  { id: "style", label: "Remember explanation style", description: "Owl adapts to your preferred teaching approach", icon: "🧠" },
  { id: "industry", label: "Remember industry/tools", description: "Owl references your industry context", icon: "🏭" },
  { id: "workflows", label: "Remember saved workflows", description: "Owl recalls your custom workflows", icon: "⚙️" },
];

const SETTINGS_KEY = "wisdom-settings";

function loadSettings(): Record<string, any> {
  try { 
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (!s.tonePreference) s.tonePreference = localStorage.getItem("wisdom-tone-preference") || "ruthless";
    return s;
  } catch { return { tonePreference: "ruthless" }; }
}

function saveSettings(s: Record<string, boolean>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function AIConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{ chat?: any; lesson?: any; game?: any }>({});

  const runTest = async () => {
    setTesting(true);
    setResults({});
    const r: any = {};
    const chatStart = Date.now();
    try {
      let response = "";
      await streamChat({
        messages: [{ role: "user", content: "Reply with exactly the word CONNECTED." }],
        onDelta: (t) => { response += t; },
        onDone: () => {},
        onError: (e) => { r.chat = { error: e }; },
      });
      r.chat = { ok: true, response: response.trim(), latency: Date.now() - chatStart };
    } catch (e: any) {
      r.chat = { error: e.message, latency: Date.now() - chatStart };
    }
    setResults({ ...r });
    const lessonStart = Date.now();
    try {
      const lesson = await generateLesson({ track: "Management", difficulty: "beginner" });
      r.lesson = { ok: true, title: lesson.title, latency: Date.now() - lessonStart };
    } catch (e: any) {
      r.lesson = { error: e.message, latency: Date.now() - lessonStart };
    }
    setResults({ ...r });
    const gameStart = Date.now();
    try {
      await generateGameQuestion({ gameType: "hallucination-hunter" });
      r.game = { ok: true, latency: Date.now() - gameStart };
    } catch (e: any) {
      r.game = { error: e.message, latency: Date.now() - gameStart };
    }
    setResults({ ...r });
    setTesting(false);
  };

  const StatusIcon = ({ ok }: { ok?: boolean }) =>
    ok === undefined ? null : ok ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-primary" />;

  return (
    <div className="space-y-3">
      <button onClick={runTest} disabled={testing}
        className="glass-card p-4 w-full flex items-center justify-center gap-2 text-body font-medium text-foreground hover:border-primary/30 transition-all disabled:opacity-50">
        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
        {testing ? "Testing..." : "Test AI Connection"}
      </button>
      {Object.entries(results).map(([key, val]: [string, any]) => (
        <div key={key} className="glass-card p-3 text-micro">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon ok={val?.ok} />
            <span className="font-medium text-foreground capitalize">{key}</span>
            {val?.latency && <span className="text-muted-foreground ml-auto">{val.latency}ms</span>}
          </div>
          {val?.response && <p className="text-muted-foreground truncate">Response: {val.response}</p>}
          {val?.title && <p className="text-muted-foreground truncate">Lesson: {val.title}</p>}
          {val?.error && <p className="text-primary truncate">Error: {val.error}</p>}
        </div>
      ))}
    </div>
  );
}

// What Owl Knows panel
function OwlKnowledgeView() {
  const { progress } = useProgress();
  const scores = progress.masteryScores || {};
  const vals = Object.values(scores) as number[];
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

  const items = [
    { label: "Streak", value: `${progress.streak} days` },
    { label: "Tokens", value: String(progress.tokens) },
    { label: "XP", value: String(progress.xp) },
    { label: "Overall Mastery", value: `${avg}%` },
    { label: "Lessons Completed", value: String(progress.completedLessons?.length || 0) },
    { label: "Favorites", value: String(progress.favorites?.length || 0) },
    { label: "Categories Tracked", value: String(Object.keys(scores).length) },
  ];

  return (
    <div className="glass-card p-4 space-y-2">
      <p className="section-label mb-2">What Owl knows about you</p>
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between py-1">
          <span className="text-caption text-muted-foreground">{item.label}</span>
          <span className="text-caption font-medium text-foreground">{item.value}</span>
        </div>
      ))}
      <p className="text-micro text-muted-foreground pt-2 border-t border-border mt-2">
        Owl uses this data only when you enable the toggles above. Disable any toggle to remove that context from AI responses.
      </p>
    </div>
  );
}

export default function Settings() {
  const { signOut } = useAuth();
  const { progress, update } = useProgress();
  const { calibration, updateCalibration } = useCalibration();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean>>(loadSettings);
  const [showMemory, setShowMemory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggle = (id: string) => {
    setSettings(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveSettings(next);
      return next;
    });
  };

  const handleResetMemory = () => {
    const cleared: Record<string, boolean> = {};
    MEMORY_TOGGLES.forEach(t => { cleared[t.id] = false; });
    setSettings(prev => { const next = { ...prev, ...cleared }; saveSettings(next); return next; });
    toast({ title: "Memory Reset", description: "All AI personalization has been cleared." });
  };

  const handleSignOut = async () => {
    try {
      const { resetCloudLoadedFlag } = await import("@/hooks/useProgress");
      resetCloudLoadedFlag();
      await signOut();
      navigate("/auth", { replace: true });
    } catch {
      toast({ title: "Error signing out", variant: "destructive" });
    }
  };

  const handleExportData = () => {
    const data = {
      progress,
      settings,
      chatHistory: JSON.parse(localStorage.getItem("wisdom-ai-chat-history") || "[]"),
      feedSeen: JSON.parse(localStorage.getItem("wisdom-feed-seen") || "[]"),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wisdom-ai-data.json"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported" });
  };

  const handleResetProgress = async () => {
    if (!showResetConfirm) { setShowResetConfirm(true); return; }
    const { resetCloudProgress } = await import("@/lib/progress");
    const fresh = await resetCloudProgress();
    update(() => fresh);
    localStorage.removeItem("wisdom-feed-seen");
    localStorage.removeItem("wisdom-unlocked-items");
    localStorage.removeItem("wisdom-favorites");
    localStorage.removeItem("wisdom-seen-quotes-v2");
    localStorage.removeItem("wisdom-owl-hunt");
    localStorage.removeItem("wisdom-ai-chat-history");
    localStorage.removeItem("wisdom-snapshots");
    localStorage.removeItem("wisdom-ai-progress");
    setShowResetConfirm(false);
    toast({ title: "Progress reset to zero", description: "All learning data, tokens, and history cleared." });
  };

  const handleDeleteAccount = () => {
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
    localStorage.clear();
    toast({ title: "Account deletion requested", description: "Your data will be removed within 30 days." });
    handleSignOut();
  };

  const enabledCount = MEMORY_TOGGLES.filter(t => settings[t.id]).length;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Settings</p>
        <h1 className="font-display text-h1 text-foreground">Preferences</h1>
      </div>

      {/* AI Personalization */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="section-label text-primary">Owl Personalization</h2>
        </div>
        <p className="text-caption text-muted-foreground mb-1">Control what Owl knows about you. All toggles are OFF by default.</p>
        <p className="text-micro text-muted-foreground mb-4">{enabledCount} of {MEMORY_TOGGLES.length} active</p>
        
        <div className="space-y-2">
          {MEMORY_TOGGLES.map((toggle, i) => (
            <motion.div key={toggle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-4 flex items-center gap-3">
              <span className="text-lg">{toggle.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-foreground">{toggle.label}</p>
                <p className="text-micro text-muted-foreground">{toggle.description}</p>
              </div>
              <button onClick={() => handleToggle(toggle.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings[toggle.id] ? "bg-primary" : "bg-surface-2 border border-border"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${settings[toggle.id] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowMemory(!showMemory)}
            className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <Eye className="h-3.5 w-3.5" /> {showMemory ? "Hide" : "View"} what Owl knows
          </button>
          <button onClick={handleResetMemory}
            className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-primary hover:bg-primary/10 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </button>
        </div>

        {showMemory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 overflow-hidden">
            <OwlKnowledgeView />
          </motion.div>
        )}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Owl Tone Preference */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="h-4 w-4 text-primary" />
          <h2 className="section-label text-primary">Owl Tone</h2>
        </div>
        <p className="text-caption text-muted-foreground mb-4">How Owl talks to you. Same sharp mind, different delivery.</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "ruthless", label: "🗡️ Ruthless Mentor", desc: "Maximum directness. No cushioning." },
            { id: "calm", label: "♟️ Calm Strategist", desc: "Quiet authority. Same precision." },
            { id: "wise", label: "🦉 Wise Friend", desc: "Warm but honest. Zero fluff." },
            { id: "balanced", label: "⚖️ Balanced", desc: "Adapts to the moment." },
          ] as const).map(tone => {
            const current = settings.tonePreference || "ruthless";
            return (
              <button key={tone.id} onClick={() => {
                localStorage.setItem("wisdom-tone-preference", tone.id);
                setSettings(prev => { const next = { ...prev, tonePreference: tone.id as any }; saveSettings(next); return next; });
              }}
                className={`rounded-xl p-3 text-left transition-all ${
                  current === tone.id ? "bg-primary text-primary-foreground" : "glass-card hover:border-primary/20"
                }`}>
                <p className="text-caption font-medium">{tone.label}</p>
                <p className={`text-micro mt-0.5 ${current === tone.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{tone.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Calibration Preferences */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="section-label text-primary">Calibration</h2>
        </div>
        <p className="text-caption text-muted-foreground mb-4">These shape how Owl responds to you.</p>
        <div className="space-y-3">
          <div className="glass-card p-4">
            <p className="text-body font-medium text-foreground mb-2">Goal Mode</p>
            <div className="flex gap-2">
              {(["income", "impact"] as const).map(mode => (
                <button key={mode} onClick={() => updateCalibration({ goalMode: mode })}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-caption font-medium transition-all ${
                    calibration.goalMode === mode ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
                  }`}>{mode === "income" ? "💰 Income" : "🚀 Impact"}</button>
              ))}
            </div>
          </div>
          <div className="glass-card p-4">
            <p className="text-body font-medium text-foreground mb-2">Output Mode</p>
            <div className="flex gap-2">
              {(["blueprints", "components"] as const).map(mode => (
                <button key={mode} onClick={() => updateCalibration({ outputMode: mode })}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-caption font-medium transition-all ${
                    calibration.outputMode === mode ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
                  }`}>{mode === "blueprints" ? "📐 Blueprints" : "🧩 Components"}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Display */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">Display</h2>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">Reduce Motion</p>
            <p className="text-micro text-muted-foreground">Minimize animations</p>
          </div>
          <button onClick={() => handleToggle("reduceMotion")}
            className={`relative h-6 w-11 rounded-full transition-colors ${settings.reduceMotion ? "bg-primary" : "bg-surface-2 border border-border"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${settings.reduceMotion ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="glass-card p-4 flex items-center gap-3 mt-2">
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">Notifications</p>
            <p className="text-micro text-muted-foreground">Streak reminders, new missions</p>
          </div>
          <button onClick={() => handleToggle("notifications")}
            className={`relative h-6 w-11 rounded-full transition-colors ${settings.notifications ? "bg-primary" : "bg-surface-2 border border-border"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${settings.notifications ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Links */}
      <div className="px-5 mb-6 space-y-2">
        <h2 className="section-label mb-4">Legal & Support</h2>
        <Link to="/privacy" className="glass-card p-4 flex items-center gap-3 hover:border-primary/10 transition-all block">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-body text-foreground">Privacy Policy</span>
        </Link>
        <Link to="/support" className="glass-card p-4 flex items-center gap-3 hover:border-primary/10 transition-all block">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-body text-foreground">Support & FAQ</span>
        </Link>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* AI Connection Test */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">AI Connection Test</h2>
        <AIConnectionTest />
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Account */}
      <div className="px-5 mb-6 space-y-2">
        <h2 className="section-label mb-4">Account</h2>
        <button onClick={handleExportData}
          className="w-full glass-card p-4 flex items-center gap-3 text-left hover:border-primary/10 transition-all">
          <Download className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-body font-medium text-foreground">Export My Data</p>
            <p className="text-micro text-muted-foreground">Download all your data as JSON</p>
          </div>
        </button>
        <button onClick={handleSignOut}
          className="w-full glass-card p-4 flex items-center gap-3 text-left hover:border-primary/10 transition-all">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <p className="text-body font-medium text-foreground">Sign Out</p>
        </button>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Danger Zone */}
      <div className="px-5 space-y-2">
        <h2 className="section-label mb-4 text-primary">Danger Zone</h2>
        <button onClick={handleResetProgress}
          className="w-full glass-card p-4 flex items-center gap-3 text-left border-primary/10 hover:border-primary/30 transition-all">
          <RotateCcw className="h-4 w-4 text-primary" />
          <div>
            <p className="text-body font-medium text-primary">{showResetConfirm ? "Tap again to confirm reset" : "Reset All Progress"}</p>
            <p className="text-micro text-muted-foreground">Tokens, streak, mastery back to zero</p>
          </div>
        </button>
        <button onClick={handleDeleteAccount}
          className="w-full glass-card p-4 flex items-center gap-3 text-left border-primary/20 hover:border-primary/40 transition-all">
          <Trash2 className="h-4 w-4 text-primary" />
          <div>
            <p className="text-body font-medium text-primary">{showDeleteConfirm ? "Tap again to confirm deletion" : "Delete My Account"}</p>
            <p className="text-micro text-muted-foreground">Permanently remove all data</p>
          </div>
        </button>
      </div>
      <div className="px-5 pb-8 flex justify-end">
        <HiddenOwl locationId="settings-footer" size={14} />
      </div>
    </div>
  );
}
