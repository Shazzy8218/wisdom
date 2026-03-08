// Debug panel for persistence health checks
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadCachedProgress } from "@/lib/progress";
import { loadChatThreads } from "@/lib/chat-history";
import { loadPersonalizedLessons } from "@/lib/personalized-lessons";

interface DebugInfo {
  userId: string;
  email: string;
  chatThreadCount: number;
  tokenBalance: number;
  streak: number;
  xp: number;
  masteryLoaded: boolean;
  goalsCount: number;
  personalizedLessonsCount: number;
  completedLessons: number;
  lastCloudSync: string;
  errors: string[];
}

export default function PersistenceDebug() {
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const errors: string[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setInfo(null);
      setLoading(false);
      return;
    }

    const progress = loadCachedProgress();
    const threads = loadChatThreads();
    const lessons = loadPersonalizedLessons();

    // Check cloud progress
    const { data: cloudProgress, error: progressErr } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (progressErr) errors.push(`Progress: ${progressErr.message}`);
    if (!cloudProgress) errors.push("No cloud progress row found");

    // Check cloud goals
    const { data: goals, error: goalsErr } = await supabase
      .from("user_goals")
      .select("id")
      .eq("user_id", user.id);
    if (goalsErr) errors.push(`Goals: ${goalsErr.message}`);

    // Check cloud chats
    const { data: cloudThreads, error: chatErr } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("user_id", user.id);
    if (chatErr) errors.push(`Chats: ${chatErr.message}`);

    setInfo({
      userId: user.id,
      email: user.email || "",
      chatThreadCount: threads.length,
      tokenBalance: progress.tokens,
      streak: progress.streak,
      xp: progress.xp,
      masteryLoaded: Object.keys(progress.masteryScores).length > 0,
      goalsCount: goals?.length || 0,
      personalizedLessonsCount: lessons.length,
      completedLessons: progress.completedLessons.length,
      lastCloudSync: cloudProgress?.updated_at || "never",
      errors,
    });
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  if (!info) return <div className="p-4 text-muted-foreground text-xs">Not logged in</div>;

  return (
    <div className="p-4 space-y-2 text-xs font-mono bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground">🔧 Persistence Debug</h3>
        <button onClick={refresh} disabled={loading} className="text-primary text-xs underline">
          {loading ? "…" : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="text-muted-foreground">User ID:</span>
        <span className="text-foreground truncate">{info.userId.slice(0, 12)}…</span>
        <span className="text-muted-foreground">Email:</span>
        <span className="text-foreground truncate">{info.email}</span>
        <span className="text-muted-foreground">Chat threads:</span>
        <span className="text-foreground">{info.chatThreadCount}</span>
        <span className="text-muted-foreground">Tokens:</span>
        <span className="text-foreground">{info.tokenBalance}</span>
        <span className="text-muted-foreground">Streak:</span>
        <span className="text-foreground">{info.streak}</span>
        <span className="text-muted-foreground">XP:</span>
        <span className="text-foreground">{info.xp}</span>
        <span className="text-muted-foreground">Completed lessons:</span>
        <span className="text-foreground">{info.completedLessons}</span>
        <span className="text-muted-foreground">Mastery loaded:</span>
        <span className={info.masteryLoaded ? "text-green-500" : "text-yellow-500"}>{info.masteryLoaded ? "✅ Yes" : "⚠️ No"}</span>
        <span className="text-muted-foreground">Goals:</span>
        <span className="text-foreground">{info.goalsCount}</span>
        <span className="text-muted-foreground">Personalized lessons:</span>
        <span className="text-foreground">{info.personalizedLessonsCount}</span>
        <span className="text-muted-foreground">Last cloud sync:</span>
        <span className="text-foreground truncate">{info.lastCloudSync === "never" ? "❌ never" : new Date(info.lastCloudSync).toLocaleString()}</span>
      </div>
      {info.errors.length > 0 && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive">
          <strong>Errors:</strong>
          {info.errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}
    </div>
  );
}
