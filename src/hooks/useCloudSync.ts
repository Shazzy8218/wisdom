// Hook to sync all user data from cloud on login
import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { syncChatHistoryToCloud, resetChatCloudCache } from "@/lib/chat-history";
import { syncPersonalizedLessons, resetPersonalizedLessonsSync } from "@/lib/personalized-lessons";
import { loadCloudProgressOnLogin, resetCloudLoadedFlag } from "@/hooks/useProgress";

let syncing = false;

export function useCloudSync(user: User | null, authReady: boolean) {
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      resetCloudLoadedFlag();
      resetChatCloudCache();
      resetPersonalizedLessonsSync();
      syncedUserIdRef.current = null;
      syncing = false;
      return;
    }

    if (syncing || syncedUserIdRef.current === user.id) return;

    let cancelled = false;
    syncing = true;

    Promise.all([
      loadCloudProgressOnLogin(),
      syncChatHistoryToCloud(),
      syncPersonalizedLessons(),
    ])
      .catch((e) => console.error("[CloudSync] Error:", e))
      .finally(() => {
        syncing = false;
        if (!cancelled) syncedUserIdRef.current = user.id;
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, user]);
}
