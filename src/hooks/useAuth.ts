import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Auth hook — manages session restore + auth state changes

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionResolved = false;

    const applySession = (nextSession: Session | null, forceReady = false) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (forceReady || initialSessionResolved) {
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session: restoredSession } }) => {
        initialSessionResolved = true;
        applySession(restoredSession, true);
      })
      .catch(() => {
        initialSessionResolved = true;
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    // Auto-derive a friendly default name from the email if the user didn't provide one.
    // E.g. "jane.doe@example.com" -> "Jane Doe"
    const fallbackFromEmail = (() => {
      const raw = (email.split("@")[0] || "").trim();
      if (!raw) return "";
      return raw
        .replace(/[._-]+/g, " ")
        .replace(/\d+/g, "")
        .trim()
        .split(/\s+/)
        .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : ""))
        .join(" ");
    })();
    const finalName = (displayName || "").trim() || fallbackFromEmail;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: finalName },
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
