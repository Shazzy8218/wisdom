// Owl Hunt Easter Egg System
// +3 tokens per owl, max 3/day, resets every 24h local time

const STORAGE_KEY = "wisdom-owl-hunt";
const TOKENS_PER_OWL = 3;
const MAX_OWLS_PER_DAY = 3;

// All possible spawn locations
const ALL_SPAWN_LOCATIONS = [
  "home-quote",
  "feed-header",
  "library-top",
  "profile-avatar",
  "mastery-chart",
  "games-header",
  "settings-footer",
  "paths-header",
  "wallet-header",
  "chat-header",
] as const;

export type OwlSpawnId = (typeof ALL_SPAWN_LOCATIONS)[number];

export interface OwlHuntState {
  date: string; // YYYY-MM-DD local
  spawnLocations: OwlSpawnId[];
  claimedIds: OwlSpawnId[];
  totalClaimed: number;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultState(): OwlHuntState {
  return {
    date: getTodayStr(),
    spawnLocations: pickRandomSpawns(),
    claimedIds: [],
    totalClaimed: 0,
  };
}

function pickRandomSpawns(): OwlSpawnId[] {
  const shuffled = [...ALL_SPAWN_LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, MAX_OWLS_PER_DAY) as OwlSpawnId[];
}

export function loadOwlHunt(): OwlHuntState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return resetAndSave();
    const state: OwlHuntState = JSON.parse(raw);
    // Check if we need a daily reset
    if (state.date !== getTodayStr()) {
      return resetAndSave();
    }
    return state;
  } catch {
    return resetAndSave();
  }
}

function resetAndSave(): OwlHuntState {
  const state = getDefaultState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function saveState(state: OwlHuntState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Check if an owl should be visible at a given spawn location */
export function isOwlVisible(locationId: OwlSpawnId): boolean {
  const state = loadOwlHunt();
  if (state.totalClaimed >= MAX_OWLS_PER_DAY) return false;
  if (state.claimedIds.includes(locationId)) return false;
  return state.spawnLocations.includes(locationId);
}

/** Claim an owl. Returns tokens awarded (3) or 0 if already claimed/maxed */
export function claimOwl(locationId: OwlSpawnId): number {
  const state = loadOwlHunt();
  if (state.totalClaimed >= MAX_OWLS_PER_DAY) return 0;
  if (state.claimedIds.includes(locationId)) return 0;
  if (!state.spawnLocations.includes(locationId)) return 0;

  state.claimedIds.push(locationId);
  state.totalClaimed += 1;
  saveState(state);

  // Award tokens in progress
  try {
    const prog = JSON.parse(localStorage.getItem("wisdom-ai-progress") || "{}");
    prog.tokens = (prog.tokens || 0) + TOKENS_PER_OWL;
    localStorage.setItem("wisdom-ai-progress", JSON.stringify(prog));
  } catch {}

  return TOKENS_PER_OWL;
}

export function getOwlHuntStatus(): { claimed: number; max: number; complete: boolean } {
  const state = loadOwlHunt();
  return {
    claimed: state.totalClaimed,
    max: MAX_OWLS_PER_DAY,
    complete: state.totalClaimed >= MAX_OWLS_PER_DAY,
  };
}
