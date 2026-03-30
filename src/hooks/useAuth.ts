import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthSnapshot {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

let authSnapshot: AuthSnapshot = {
  user: null,
  session: null,
  loading: true,
};

let authInitialized = false;
let initialSessionResolved = false;
const authListeners = new Set<() => void>();

function emitAuthSnapshot(nextSnapshot: AuthSnapshot) {
  authSnapshot = nextSnapshot;
  authListeners.forEach((listener) => listener());
}

function initializeAuth() {
  if (authInitialized) return;
  authInitialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    emitAuthSnapshot({
      user: session?.user ?? null,
      session,
      loading: !initialSessionResolved,
    });
  });

  void supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      initialSessionResolved = true;
      emitAuthSnapshot({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    })
    .catch(() => {
      initialSessionResolved = true;
      emitAuthSnapshot({
        user: null,
        session: null,
        loading: false,
      });
    });
}

function subscribeToAuth(listener: () => void) {
  initializeAuth();
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
}

function getAuthSnapshot() {
  initializeAuth();
  return authSnapshot;
}

export function useAuth() {
  const { user, session, loading } = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getAuthSnapshot,
  );

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      void supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", data.user.id);
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { user, session, loading, signUp, signIn, signOut };
}
