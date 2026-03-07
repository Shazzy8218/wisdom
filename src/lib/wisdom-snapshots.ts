// Wisdom Snapshots — collectible 1-screen summary cards

export interface WisdomSnapshot {
  id: string;
  title: string;
  mentalModel: string;
  keyInsight: string;
  bragLine: string;
  category: string;
  completedAt: number;
}

const STORAGE_KEY = "wisdom-ai-snapshots";

export function loadSnapshots(): WisdomSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveWisdomSnapshot(snapshot: WisdomSnapshot): void {
  const snapshots = loadSnapshots();
  if (!snapshots.find(s => s.id === snapshot.id)) {
    snapshots.unshift(snapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }
}
