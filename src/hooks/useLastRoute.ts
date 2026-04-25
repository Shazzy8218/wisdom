import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const KEY = "wisdom-last-route";

// Routes we never want to auto-restore the user into
const SKIP_PREFIXES = ["/auth", "/reset-password", "/privacy", "/support"];

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some(p => path === p || path.startsWith(p + "/"));
}

/**
 * Persists the current route and, on first mount after a fresh app load,
 * restores the user to their last-visited route so chats/pages stay open
 * across browser/app restarts.
 */
export function useLastRoute(enabled: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  // Restore once on mount
  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const last = localStorage.getItem(KEY);
      const current = location.pathname + location.search;
      // Only restore if user just landed on the root and a meaningful last route exists
      if (
        last &&
        last !== current &&
        !shouldSkip(last) &&
        (location.pathname === "/" && !location.search)
      ) {
        navigate(last, { replace: true });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save on every route change
  useEffect(() => {
    if (!enabled) return;
    const path = location.pathname + location.search;
    if (shouldSkip(path)) return;
    try {
      localStorage.setItem(KEY, path);
    } catch {
      /* ignore */
    }
  }, [location.pathname, location.search, enabled]);
}
