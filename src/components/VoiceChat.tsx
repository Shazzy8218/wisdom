import { useState, useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_OWL_VOICE_ID,
  MAX_TTS_CHARS,
  OWL_PLAY_EVENT,
  type OwlReplayDetail,
  getSpeechRecognitionCtor,
  pickBrowserSpeechVoice,
  sanitizeTextForSpeech,
} from "@/lib/owl-voice";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const SCRIBE_CONNECT_TIMEOUT_MS = 12000;

interface VoiceChatProps {
  onTranscript: (text: string) => void;
  lastAssistantMessage?: string;
  lastAssistantMessageId?: string;
  isStreaming?: boolean;
}

function mapSpeechRecognitionError(error: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Please allow microphone access to use voice input.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "Your browser's speech service is unreachable right now. Please try again.";
    case "no-speech":
      return "I didn't hear anything. Try again and speak right away.";
    default:
      return "Voice transcription ran into a problem.";
  }
}

export default function VoiceChat({ onTranscript, lastAssistantMessage, lastAssistantMessageId, isStreaming }: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBrowserListening, setIsBrowserListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [partialText, setPartialText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const browserRecognitionRef = useRef<SpeechRecognition | null>(null);
  const browserUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const browserTranscriptRef = useRef("");
  const lastSpokenRef = useRef("");
  const lastHandledAssistantMessageRef = useRef("");
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimedOutRef = useRef(false);
  const manualBrowserStopRef = useRef(false);
  const browserTtsFallbackRef = useRef(false);
  const browserTtsNoticeShownRef = useRef(false);

  const releaseCurrentAudio = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    const currentSrc = audioRef.current.src;
    audioRef.current.onended = null;
    audioRef.current.onerror = null;
    audioRef.current = null;

    if (currentSrc.startsWith("blob:")) {
      URL.revokeObjectURL(currentSrc);
    }
  }, []);

  const clearConnectTimeout = useCallback(() => {
    if (!connectTimeoutRef.current) return;
    clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = null;
  }, []);

  const stopSpeaking = useCallback(() => {
    releaseCurrentAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    browserUtteranceRef.current = null;
    setIsSpeaking(false);
  }, [releaseCurrentAudio]);

  const stopBrowserRecognition = useCallback(() => {
    const recognition = browserRecognitionRef.current;
    if (!recognition) return;

    manualBrowserStopRef.current = true;
    setIsBrowserListening(false);
    recognition.stop();
  }, []);

  const startBrowserRecognition = useCallback(async () => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      throw new Error("Browser speech recognition is unavailable.");
    }

    return await new Promise<boolean>((resolve, reject) => {
      let started = false;
      let settled = false;
      const recognition = new RecognitionCtor();
      browserRecognitionRef.current = recognition;
      browserTranscriptRef.current = "";
      manualBrowserStopRef.current = false;

      const settleResolve = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const settleReject = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      const cleanup = () => {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        if (browserRecognitionRef.current === recognition) {
          browserRecognitionRef.current = null;
        }
      };

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

      recognition.onstart = () => {
        started = true;
        setIsBrowserListening(true);
        setIsConnecting(false);
        settleResolve(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = browserTranscriptRef.current;
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript?.trim();
          if (!transcript) continue;

          if (event.results[i].isFinal) {
            finalTranscript = `${finalTranscript} ${transcript}`.trim();
          } else {
            interimTranscript = transcript;
          }
        }

        browserTranscriptRef.current = finalTranscript;
        setPartialText(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        const message = mapSpeechRecognitionError(event.error);
        const shouldIgnore = manualBrowserStopRef.current || event.error === "aborted";

        setIsBrowserListening(false);
        setIsConnecting(false);
        setPartialText("");
        cleanup();

        if (!started) {
          if (shouldIgnore) {
            settleResolve(false);
          } else {
            settleReject(new Error(message));
          }
          return;
        }

        if (!shouldIgnore && event.error !== "no-speech") {
          toast({
            title: "Voice input unavailable",
            description: message,
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        const finalTranscript = browserTranscriptRef.current.trim();

        setIsBrowserListening(false);
        setIsConnecting(false);
        setPartialText("");
        cleanup();

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }

        if (!started) {
          settleReject(new Error("Voice input could not start."));
        }
      };

      recognition.start();
    });
  }, [onTranscript]);

  const speakWithBrowserVoice = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      throw new Error("Browser speech is unavailable");
    }

    releaseCurrentAudio();
    window.speechSynthesis.cancel();

    await new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = pickBrowserSpeechVoice();

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 1.02;
      utterance.pitch = 0.92;
      utterance.volume = 1;
      browserUtteranceRef.current = utterance;

      utterance.onend = () => {
        browserUtteranceRef.current = null;
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        browserUtteranceRef.current = null;
        setIsSpeaking(false);
        reject(new Error("Browser speech failed"));
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }, [releaseCurrentAudio]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => {
      clearConnectTimeout();
      connectTimedOutRef.current = false;
      setIsConnecting(false);
    },
    onDisconnect: () => {
      clearConnectTimeout();
      setIsConnecting(false);
      setPartialText("");
    },
    onPartialTranscript: (data) => {
      setPartialText(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim());
      }
      setPartialText("");
    },
    onError: (error) => {
      console.error("Voice session error:", error);
      clearConnectTimeout();
      setIsConnecting(false);
      setPartialText("");

      if (connectTimedOutRef.current) return;

      toast({
        title: "Voice input unavailable",
        description: error instanceof Error ? error.message : "Voice transcription ran into a problem.",
        variant: "destructive",
      });
    },
  });

  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  useEffect(() => {
    return () => {
      clearConnectTimeout();
      stopBrowserRecognition();
      scribeRef.current.disconnect();
      releaseCurrentAudio();
      setIsBrowserListening(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearConnectTimeout, releaseCurrentAudio, stopBrowserRecognition]);

  const startScribeListening = useCallback(async () => {
    scribe.disconnect();

    const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
    if (error) throw new Error(error.message || "Could not start voice transcription");
    if (!data?.token) throw new Error("No token received");

    connectTimeoutRef.current = setTimeout(() => {
      if (scribeRef.current.isConnected || scribeRef.current.isTranscribing) return;

      connectTimedOutRef.current = true;
      setIsConnecting(false);
      scribeRef.current.disconnect();

      toast({
        title: "Voice input timeout",
        description: "The microphone session took too long to start. If you're testing inside the embedded preview, open the standalone app and try again.",
        variant: "destructive",
      });
    }, SCRIBE_CONNECT_TIMEOUT_MS);

    await scribe.connect({
      token: data.token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    clearConnectTimeout();
    setIsConnecting(false);
  }, [clearConnectTimeout, scribe]);

  const startListening = useCallback(async () => {
    if (isMicBusy || isListening) return;

    connectTimedOutRef.current = false;
    setIsConnecting(true);
    setPartialText("");
    stopSpeaking();
    clearConnectTimeout();

    try {
      const nativeRecognition = getSpeechRecognitionCtor();

      if (nativeRecognition) {
        try {
          const started = await startBrowserRecognition();
          if (started) return;
        } catch (nativeErr: any) {
          const nativeErrorMessage = nativeErr?.message || "Voice input unavailable";
          const shouldAvoidScribeFallback = /allow microphone|No microphone/i.test(nativeErrorMessage);

          if (shouldAvoidScribeFallback) {
            throw nativeErr;
          }

          console.warn("Browser speech fallback failed, falling back to ElevenLabs Scribe:", nativeErr);
        }
      }

      await startScribeListening();
    } catch (err: any) {
      clearConnectTimeout();
      setIsConnecting(false);
      setPartialText("");

      if (connectTimedOutRef.current) return;

      console.error("Voice start failed:", err);

      const description = err?.name === "NotAllowedError"
        ? "Please allow microphone access to use voice input."
        : err?.name === "NotFoundError"
          ? "No microphone was found on this device."
          : err?.message === "Failed to fetch"
            ? "Voice services are not reachable right now. Please try again in a few seconds."
            : err?.message || "Please allow microphone access and try again.";

      toast({
        title: err?.name === "NotAllowedError" ? "Microphone access required" : "Voice input unavailable",
        description,
        variant: "destructive",
      });
    }
  }, [clearConnectTimeout, isListening, isMicBusy, startBrowserRecognition, startScribeListening, stopSpeaking]);

  const stopListening = useCallback(() => {
    clearConnectTimeout();
    connectTimedOutRef.current = false;
    stopBrowserRecognition();
    scribe.disconnect();
    setIsConnecting(false);
    setIsBrowserListening(false);
    setPartialText("");
  }, [clearConnectTimeout, scribe, stopBrowserRecognition]);

  const speakText = useCallback(async (text: string, options?: { force?: boolean }) => {
    if (!text || (!ttsEnabled && !options?.force)) return;
    if (!options?.force && text === lastSpokenRef.current) return;

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText || cleanText.length > MAX_TTS_CHARS) return;

    if (!options?.force) {
      lastSpokenRef.current = text;
    }

    try {
      if (browserTtsFallbackRef.current) {
        await speakWithBrowserVoice(cleanText);
        return;
      }

      setIsSpeaking(true);
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText, voiceId: DEFAULT_OWL_VOICE_ID }),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => "");
        throw new Error(errorText || `TTS failed: ${resp.status}`);
      }

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      releaseCurrentAudio();

      const audio = new Audio(audioUrl);
      audio.preload = "auto";
      audioRef.current = audio;

      audio.onended = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err: any) {
      console.error("TTS error:", err);
      setIsSpeaking(false);

      const errorMessage = typeof err?.message === "string" ? err.message : "";
      if (/401|detected_unusual_activity/i.test(errorMessage)) {
        browserTtsFallbackRef.current = true;
      }

      try {
        await speakWithBrowserVoice(cleanText);

        if (!browserTtsNoticeShownRef.current) {
          browserTtsNoticeShownRef.current = true;
          toast({
            title: "Using device voice",
            description: "Your custom Owl voice is temporarily unavailable, so I switched to your device's built-in voice for reliable playback.",
          });
        }
        return;
      } catch (fallbackError) {
        console.error("Browser TTS fallback error:", fallbackError);
        lastSpokenRef.current = "";
        setIsSpeaking(false);
        toast({
          title: "Owl voice unavailable",
          description: "I couldn't play Owl's voice just now. Try again once audio output is enabled on your device.",
          variant: "destructive",
        });
      }
    }
  }, [releaseCurrentAudio, speakWithBrowserVoice, ttsEnabled]);

  useEffect(() => {
    if (isStreaming || !lastAssistantMessage) return;
    const handledKey = lastAssistantMessageId || lastAssistantMessage;
    if (handledKey === lastHandledAssistantMessageRef.current) return;

    lastHandledAssistantMessageRef.current = handledKey;
    void speakText(lastAssistantMessage);
  }, [isStreaming, lastAssistantMessage, lastAssistantMessageId, speakText]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OwlReplayDetail>).detail;
      if (!detail?.text) return;

      void speakText(detail.text, { force: detail.force });
    };

    window.addEventListener(OWL_PLAY_EVENT, handler as EventListener);
    return () => window.removeEventListener(OWL_PLAY_EVENT, handler as EventListener);
  }, [speakText]);

  const isListening = isBrowserListening || scribe.isConnected || scribe.isTranscribing;
  const isMicBusy = isConnecting || scribe.status === "connecting";

  const toggleTts = useCallback(() => {
    if (ttsEnabled && isSpeaking) stopSpeaking();
    setTtsEnabled((prev) => !prev);
  }, [ttsEnabled, isSpeaking, stopSpeaking]);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTts}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
            ttsEnabled ? "text-primary hover:bg-muted/50" : "text-muted-foreground hover:bg-muted/50"
          }`}
          title={ttsEnabled ? "Mute Owl voice" : "Unmute Owl voice"}
        >
          {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isMicBusy || isStreaming}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
            isListening
              ? "animate-pulse bg-destructive/10 text-destructive"
              : isMicBusy
                ? "bg-muted/50 text-muted-foreground"
                : "text-muted-foreground hover:bg-muted/50"
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isMicBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isListening && partialText && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 px-5 pb-2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary/80">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="truncate">{partialText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 px-5 pb-2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary/80">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span>Owl is speaking…</span>
              <button onClick={stopSpeaking} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { VoiceChat };
