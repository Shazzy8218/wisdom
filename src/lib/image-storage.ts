// Image generation storage for Library

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageData: string; // base64 data URL or storage URL
  style?: string;
  createdAt: number;
}

const KEY = "wisdom-generated-images";

export function loadGeneratedImages(): GeneratedImage[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveGeneratedImage(img: Omit<GeneratedImage, "id" | "createdAt">): GeneratedImage {
  const images = loadGeneratedImages();
  const entry: GeneratedImage = {
    id: `img-${Date.now()}`,
    ...img,
    createdAt: Date.now(),
  };
  images.unshift(entry);
  // Keep max 50 to avoid localStorage bloat (base64 images are large)
  const trimmed = images.slice(0, 50);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // If localStorage is full, keep fewer
    localStorage.setItem(KEY, JSON.stringify(trimmed.slice(0, 10)));
  }
  return entry;
}

export function deleteGeneratedImage(id: string): void {
  const images = loadGeneratedImages().filter(i => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(images));
}
