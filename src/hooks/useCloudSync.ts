// Hook to sync all user data from cloud on login
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncChatHistoryToCloud, resetChatCloudCache } from "@/lib/chat-history";
import { syncPersonalizedLessons, resetPersonalizedLessonsSync } from "@/lib/personalized-lessons";
import { loadCloudProgressOnLogin, resetCloudLoadedFlag } from "@/hooks/useProgress";

let syncing = false;

export function useCloudSync() {
  const syncedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user && !syncing) {
        syncing = true;
        try {
          // Sync all data from cloud in parallel
          await Promise.all([
            loadCloudProgressOnLogin(),
            syncChatHistoryToCloud(),
            syncPersonalizedLessons(),
          ]);
        } catch (e) {
          console.error("[CloudSync] Error:", e);
        } finally {
          syncing = false;
          syncedRef.current = true;
        }
      }
      if (event === "SIGNED_OUT") {
        resetCloudLoadedFlag();
        resetChatCloudCache();
        resetPersonalizedLessonsSync();
        syncedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Also sync on mount if already logged in
  useEffect(() => {
    if (syncedRef.current || syncing) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !syncedRef.current && !syncing) {
        syncing = true;
        Promise.all([
          loadCloudProgressOnLogin(),
          syncChatHistoryToCloud(),
          syncPersonalizedLessons(),
        ]).catch(e => console.error("[CloudSync] Error:", e))
          .finally(() => { syncing = false; syncedRef.current = true; });
      }
    });
  }, []);
}
