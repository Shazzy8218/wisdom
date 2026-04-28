// CAE — Hook: ensures recall prompts exist for a module. Tries AI, falls back deterministically.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { seedReviewsForModule, deriveFallbackPrompts } from "@/lib/learning-optimizer";
import type { FlagshipModule } from "@/lib/nexus-flagship";

const ATTEMPTED_KEY = "wisdom-cae-recall-attempted-v1";

function hasAttempted(moduleId: string): boolean {
  try {
    const arr = JSON.parse(localStorage.getItem(ATTEMPTED_KEY) || "[]");
    return Array.isArray(arr) && arr.includes(moduleId);
  } catch { return false; }
}
function markAttempted(moduleId: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(ATTEMPTED_KEY) || "[]");
    if (!arr.includes(moduleId)) {
      arr.push(moduleId);
      localStorage.setItem(ATTEMPTED_KEY, JSON.stringify(arr));
    }
  } catch { /* ignore */ }
}

export function useSeedRecallPrompts(mod: FlagshipModule | undefined) {
  const ranRef = useRef(false);
  useEffect(() => {
    if (!mod || ranRef.current || hasAttempted(mod.id)) return;
    ranRef.current = true;
    markAttempted(mod.id);

    // Seed deterministic fallback immediately so reviews exist even if AI fails
    seedReviewsForModule(mod, deriveFallbackPrompts(mod));

    // Then try AI — replace fallback with sharper prompts (idempotent: only adds new ids)
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("nexus-recall-prompt", {
          body: {
            moduleId: mod.id,
            moduleTitle: mod.title,
            sections: mod.sections.slice(0, 5).map(s => ({ heading: s.heading, body: s.body, operatorMove: s.operatorMove })),
          },
        });
        if (!error && Array.isArray(data?.prompts) && data.prompts.length > 0) {
          // AI prompts use ${mod.id}:r0..rN ids, fallback uses :s0..s3 — both coexist; cap noise
          const aiPrompts = data.prompts
            .filter((p: any) => p?.id && p?.prompt && p?.ideal)
            .slice(0, 4);
          if (aiPrompts.length > 0) {
            seedReviewsForModule(mod, aiPrompts);
          }
        }
      } catch { /* silent — fallback already seeded */ }
    })();
  }, [mod]);
}
