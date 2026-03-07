import { useState, useCallback, useSyncExternalStore, useEffect } from "react";
import { loadCachedProgress, saveCacheProgress, saveCloudProgress, fetchCloudProgress, type UserProgress } from "@/lib/progress";

let listeners: (() => void)[] = [];
let cachedProgress: UserProgress = loadCachedProgress();
let cloudLoaded = false;

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

function getSnapshot() {
  return cachedProgress;
}

function notifyAll() {
  listeners.forEach(l => l());
}

export function refreshProgress() {
  cachedProgress = loadCachedProgress();
  notifyAll();
}

/** Load progress from cloud on login, merging into cache */
export async function loadCloudProgressOnLogin() {
  if (cloudLoaded) return;
  const cloud = await fetchCloudProgress();
  if (cloud) {
    cachedProgress = cloud;
    saveCacheProgress(cloud);
    notifyAll();
  }
  cloudLoaded = true;
}

export function resetCloudLoadedFlag() {
  cloudLoaded = false;
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot);

  // On mount, fetch cloud progress once
  useEffect(() => {
    loadCloudProgressOnLogin();
  }, []);

  const update = useCallback((updater: (p: UserProgress) => UserProgress) => {
    cachedProgress = updater(cachedProgress);
    saveCacheProgress(cachedProgress);
    notifyAll();
    // Fire-and-forget cloud save
    saveCloudProgress(cachedProgress).catch(() => {});
  }, []);

  return { progress, update, refresh: refreshProgress };
}
