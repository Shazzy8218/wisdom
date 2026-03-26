import { useState, useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSpeechRecognitionCtor } from "@/lib/owl-voice";

const SCRIBE_CONNECT_TIMEOUT_MS = 12000;

interface VoiceChatProps {
  onTranscript: (text: string) => void;
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

export default function VoiceChat({ onTranscript, isStreaming }: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBrowserListening, setIsBrowserListening] = useState(false);
  const [partialText, setPartialText] = useState("");
  const browserRecognitionRef = useRef<SpeechRecognition | null>(null);
  const browserTranscriptRef = useRef("");
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimedOutRef = useRef(false);
  const manualBrowserStopRef = useRef(false);

  const clearConnectTimeout = useCallback(() => {
    if (!connectTimeoutRef.current) return;
    clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = null;
  }, []);

  const stopBrowserRecognition = useCallback(() => {
    const recognition = browserRecognitionRef.current;
    if (!recognition) return;
    manualBrowserStopRef.current = true;
    setIsBrowserListening(false);
    recognition.stop();
  }, []);

  const startBrowserRecognition = useCallback(async () => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) throw new Error("Browser speech recognition is unavailable.");

    return await new Promise<boolean>((resolve, reject) => {
      let started = false;
      let settled = false;
      const recognition = new RecognitionCtor();
      browserRecognitionRef.current = recognition;
      browserTranscriptRef.current = "";
      manualBrowserStopRef.current = false;

      const settleResolve = (value: boolean) => { if (settled) return; settled = true; resolve(value); };
      const settleReject = (error: Error) => { if (settled) return; settled = true; reject(error); };
      const cleanup = () => {
        recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
        if (browserRecognitionRef.current === recognition) browserRecognitionRef.current = null;
      };

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

      recognition.onstart = () => { started = true; setIsBrowserListening(true); setIsConnecting(false); settleResolve(true); };

      recognition.onresult = (event) => {
        let finalTranscript = browserTranscriptRef.current;
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript?.trim();
          if (!transcript) continue;
          if (event.results[i].isFinal) finalTranscript = `${finalTranscript} ${transcript}`.trim();
          else interimTranscript = transcript;
        }
        browserTranscriptRef.current = finalTranscript;
        setPartialText(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        const message = mapSpeechRecognitionError(event.error);
        const shouldIgnore = manualBrowserStopRef.current || event.error === "aborted";
        setIsBrowserListening(false); setIsConnecting(false); setPartialText(""); cleanup();
        if (!started) { shouldIgnore ? settleResolve(false) : settleReject(new Error(message)); return; }
        if (!shouldIgnore && event.error !== "no-speech") {
          toast({ title: "Voice input unavailable", description: message, variant: "destructive" });
        }
      };

      recognition.onend = () => {
        const finalTranscript = browserTranscriptRef.current.trim();
        setIsBrowserListening(false); setIsConnecting(false); setPartialText(""); cleanup();
        if (finalTranscript) onTranscript(finalTranscript);
        if (!started) settleReject(new Error("Voice input could not start."));
      };

      recognition.start();
    });
  }, [onTranscript]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => { clearConnectTimeout(); connectTimedOutRef.current = false; setIsConnecting(false); },
    onDisconnect: () => { clearConnectTimeout(); setIsConnecting(false); setPartialText(""); },
    onPartialTranscript: (data) => setPartialText(data.text),
    onCommittedTranscript: (data) => { if (data.text.trim()) onTranscript(data.text.trim()); setPartialText(""); },
    onError: (error) => {
      console.error("Voice session error:", error);
      clearConnectTimeout(); setIsConnecting(false); setPartialText("");
      if (connectTimedOutRef.current) return;
      toast({ title: "Voice input unavailable", description: error instanceof Error ? error.message : "Voice transcription ran into a problem.", variant: "destructive" });
    },
  });

  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  useEffect(() => {
    return () => { clearConnectTimeout(); stopBrowserRecognition(); scribeRef.current.disconnect(); setIsBrowserListening(false); };
  }, [clearConnectTimeout, stopBrowserRecognition]);

  const startScribeListening = useCallback(async () => {
    scribe.disconnect();
    const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
    if (error) throw new Error(error.message || "Could not start voice transcription");
    if (!data?.token) throw new Error("No token received");
    connectTimeoutRef.current = setTimeout(() => {
      if (scribeRef.current.isConnected || scribeRef.current.isTranscribing) return;
      connectTimedOutRef.current = true; setIsConnecting(false); scribeRef.current.disconnect();
      toast({ title: "Voice input timeout", description: "The microphone session took too long to start. If you're testing inside the embedded preview, open the standalone app and try again.", variant: "destructive" });
    }, SCRIBE_CONNECT_TIMEOUT_MS);
    await scribe.connect({ token: data.token, microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    clearConnectTimeout(); setIsConnecting(false);
  }, [clearConnectTimeout, scribe]);

  const isListening = isBrowserListening || scribe.isConnected || scribe.isTranscribing;
  const isMicBusy = isConnecting || scribe.status === "connecting";

  const startListening = useCallback(async () => {
    if (isMicBusy || isListening) return;
    connectTimedOutRef.current = false; setIsConnecting(true); setPartialText(""); clearConnectTimeout();
    try {
      const nativeRecognition = getSpeechRecognitionCtor();
      if (nativeRecognition) {
        try {
          const started = await startBrowserRecognition();
          if (started) return;
        } catch (nativeErr: any) {
          if (/allow microphone|No microphone/i.test(nativeErr?.message || "")) throw nativeErr;
          console.warn("Browser speech fallback failed, trying ElevenLabs Scribe:", nativeErr);
        }
      }
      await startScribeListening();
    } catch (err: any) {
      clearConnectTimeout(); setIsConnecting(false); setPartialText("");
      if (connectTimedOutRef.current) return;
      console.error("Voice start failed:", err);
      const description = err?.name === "NotAllowedError" ? "Please allow microphone access to use voice input."
        : err?.name === "NotFoundError" ? "No microphone was found on this device."
        : err?.message === "Failed to fetch" ? "Voice services are not reachable right now. Please try again in a few seconds."
        : err?.message || "Please allow microphone access and try again.";
      toast({ title: err?.name === "NotAllowedError" ? "Microphone access required" : "Voice input unavailable", description, variant: "destructive" });
    }
  }, [clearConnectTimeout, isListening, isMicBusy, startBrowserRecognition, startScribeListening]);

  const stopListening = useCallback(() => {
    clearConnectTimeout(); connectTimedOutRef.current = false; stopBrowserRecognition();
    scribe.disconnect(); setIsConnecting(false); setIsBrowserListening(false); setPartialText("");
  }, [clearConnectTimeout, scribe, stopBrowserRecognition]);

  return (
    <>
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isMicBusy || isStreaming}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
          isListening ? "animate-pulse bg-destructive/10 text-destructive"
            : isMicBusy ? "bg-muted/50 text-muted-foreground"
            : "text-muted-foreground hover:bg-muted/50"
        }`}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isMicBusy ? <Loader2 className="h-4 w-4 animate-spin" />
          : isListening ? <MicOff className="h-4 w-4" />
          : <Mic className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {isListening && partialText && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 px-5 pb-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary/80">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="truncate">{partialText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { VoiceChat };
