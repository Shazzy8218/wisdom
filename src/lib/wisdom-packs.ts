// Auto-save Wisdom Packs from Task Mode AI responses

export interface WisdomPack {
  id: string;
  timestamp: number;
  wisdomLine: string;
  microLesson: { hook: string; concept: string; tryIt: string };
  drill: { question: string; options: string[]; answer: string };
  sourcePrompt: string;
}

const PACKS_KEY = "wisdom-packs";
const DRILLS_KEY = "wisdom-saved-drills";
const PROMPTS_KEY = "wisdom-saved-try-prompts";

export function loadWisdomPacks(): WisdomPack[] {
  try { return JSON.parse(localStorage.getItem(PACKS_KEY) || "[]"); } catch { return []; }
}

export function loadSavedDrills(): WisdomPack["drill"][] {
  try { return JSON.parse(localStorage.getItem(DRILLS_KEY) || "[]"); } catch { return []; }
}

export function loadSavedTryPrompts(): string[] {
  try { return JSON.parse(localStorage.getItem(PROMPTS_KEY) || "[]"); } catch { return []; }
}

export function parseAndSaveWisdomPack(assistantContent: string, userPrompt: string): WisdomPack | null {
  // Only parse task-mode structured responses
  if (!assistantContent.includes("WISDOM LINE") && !assistantContent.includes("💎")) return null;

  const wisdomMatch = assistantContent.match(/>\s*(.+?)(?:\n|$)/);
  const hookMatch = assistantContent.match(/\*\*Hook:\*\*\s*(.+?)(?:\n|$)/);
  const conceptMatch = assistantContent.match(/\*\*Key Concept:\*\*\s*(.+?)(?:\n|$)/);
  const tryItMatch = assistantContent.match(/\*\*Try It:\*\*\s*(.+?)(?:\n|$)/);
  const questionMatch = assistantContent.match(/\*\*Question:\*\*\s*(.+?)(?:\n|$)/);
  const answerMatch = assistantContent.match(/\*\*Answer:\*\*\s*(.+?)(?:\n|$)/);
  const optionsMatch = assistantContent.match(/\*\*A\)\*\*\s*(.+?)(?:\n|$)/);

  const wisdomLine = wisdomMatch?.[1]?.trim() || "";
  if (!wisdomLine) return null;

  const pack: WisdomPack = {
    id: `wp-${Date.now()}`,
    timestamp: Date.now(),
    wisdomLine,
    microLesson: {
      hook: hookMatch?.[1]?.trim() || "",
      concept: conceptMatch?.[1]?.trim() || "",
      tryIt: tryItMatch?.[1]?.trim() || "",
    },
    drill: {
      question: questionMatch?.[1]?.trim() || "",
      options: [],
      answer: answerMatch?.[1]?.trim() || "",
    },
    sourcePrompt: userPrompt,
  };

  // Parse drill options
  const optA = assistantContent.match(/\*\*A\)\*\*\s*(.+?)(?:\s*\*\*B\)|$)/s);
  const optB = assistantContent.match(/\*\*B\)\*\*\s*(.+?)(?:\s*\*\*C\)|$)/s);
  const optC = assistantContent.match(/\*\*C\)\*\*\s*(.+?)(?:\s*\*\*Answer|$)/s);
  pack.drill.options = [optA?.[1]?.trim(), optB?.[1]?.trim(), optC?.[1]?.trim()].filter(Boolean) as string[];

  // Save pack
  const packs = loadWisdomPacks();
  packs.unshift(pack);
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs.slice(0, 100)));

  // Save drill
  if (pack.drill.question) {
    const drills = loadSavedDrills();
    drills.unshift(pack.drill);
    localStorage.setItem(DRILLS_KEY, JSON.stringify(drills.slice(0, 100)));
  }

  // Save try-it prompt
  if (pack.microLesson.tryIt) {
    const prompts = loadSavedTryPrompts();
    prompts.unshift(pack.microLesson.tryIt);
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts.slice(0, 100)));
  }

  // Also save as wisdom snapshot
  try {
    const { saveWisdomSnapshot } = require("@/lib/wisdom-snapshots");
    saveWisdomSnapshot({
      id: pack.id,
      title: userPrompt.slice(0, 60),
      mentalModel: pack.microLesson.concept,
      keyInsight: pack.wisdomLine,
      bragLine: pack.microLesson.hook,
      category: "Task Mode",
      completedAt: Date.now(),
    });
  } catch {}

  return pack;
}

export function deleteWisdomPack(id: string) {
  const packs = loadWisdomPacks().filter(p => p.id !== id);
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
}
