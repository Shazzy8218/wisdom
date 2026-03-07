import { useState, useCallback, useSyncExternalStore } from "react";
import { loadProgress, saveProgress, type UserProgress } from "@/lib/progress";

let listeners: (() => void)[] = [];
let cachedProgress: UserProgress = loadProgress();

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

function getSnapshot() {
  return cachedProgress;
}

export function refreshProgress() {
  cachedProgress = loadProgress();
  listeners.forEach(l => l());
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot);

  const update = useCallback((updater: (p: UserProgress) => UserProgress) => {
    cachedProgress = updater(cachedProgress);
    saveProgress(cachedProgress);
    listeners.forEach(l => l());
  }, []);

  return { progress, update, refresh: refreshProgress };
}
