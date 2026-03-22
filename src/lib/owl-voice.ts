export const DEFAULT_OWL_VOICE_ID = "VsQmyFHffusQDewmHB5v";
export const OWL_PLAY_EVENT = "owl:play";
export const MAX_TTS_CHARS = 2000;

export interface OwlReplayDetail {
  text: string;
  force?: boolean;
}

export function sanitizeTextForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "code block omitted")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`~>|]/g, "")
    .trim();
}

export function requestOwlReplay(text: string, force = true) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OwlReplayDetail>(OWL_PLAY_EVENT, { detail: { text, force } }));
}

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function pickBrowserSpeechVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  return (
    voices.find((voice) => /google|samantha|daniel|serena|zira/i.test(voice.name)) ??
    voices.find((voice) => /en-/i.test(voice.lang)) ??
    voices[0]
  );
}
