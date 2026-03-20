import { useState, useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

interface VoiceChatProps {
  onTranscript: (text: string) => void;
  lastAssistantMessage?: string;
  isStreaming?: boolean;
}

export default function VoiceChat({ onTranscript, lastAssistantMessage, isStreaming }: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [partialText, setPartialText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");
  const lastHandledAssistantMessageRef = useRef("");

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

  const stopSpeaking = useCallback(() => {
    releaseCurrentAudio();
    setIsSpeaking(false);
  }, [releaseCurrentAudio]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setPartialText(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim());
        setPartialText("");
      }
    },
  });

  useEffect(() => {
    return () => {
      scribe.disconnect();
      releaseCurrentAudio();
    };
  }, [releaseCurrentAudio, scribe]);

  const startListening = useCallback(async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    stopSpeaking();

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStream.getTracks().forEach((track) => track.stop());

      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error) throw new Error(error.message || "Could not start voice transcription");
      if (!data?.token) throw new Error("No token received");

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setIsListening(true);
    } catch (err: any) {
      console.error("Voice start failed:", err);

      const description = err?.name === "NotAllowedError"
        ? "Please allow microphone access to use voice input."
        : err?.message === "Failed to fetch"
          ? "Voice services are not reachable right now. Please try again in a few seconds."
          : err?.message || "Please allow microphone access and try again.";

      toast({
        title: err?.name === "NotAllowedError" ? "Microphone access required" : "Voice input unavailable",
        description,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, scribe, stopSpeaking]);

  const stopListening = useCallback(() => {
    scribe.disconnect();
    setIsListening(false);
    setPartialText("");
  }, [scribe]);

  const speakText = useCallback(async (text: string) => {
    if (!text || !ttsEnabled || text === lastSpokenRef.current) return;

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "code block omitted")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`~>|]/g, "")
      .trim();

    if (!cleanText || cleanText.length > 2000) return;

    lastSpokenRef.current = text;
    setIsSpeaking(true);

    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => "");
        throw new Error(errorText || `TTS failed: ${resp.status}`);
      }

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      releaseCurrentAudio();

      const audio = new Audio(audioUrl);
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
    } catch (err) {
      console.error("TTS error:", err);
      lastSpokenRef.current = "";
      setIsSpeaking(false);
      toast({
        title: "Owl voice unavailable",
        description: "I couldn't play Owl's voice just now. Try sending the message again.",
        variant: "destructive",
      });
    }
  }, [releaseCurrentAudio, ttsEnabled]);

  useEffect(() => {
    if (isStreaming || !lastAssistantMessage) return;
    if (lastAssistantMessage === lastHandledAssistantMessageRef.current) return;

    lastHandledAssistantMessageRef.current = lastAssistantMessage;
    void speakText(lastAssistantMessage);
  }, [isStreaming, lastAssistantMessage, speakText]);

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
          disabled={isConnecting || isStreaming}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
            isListening
              ? "animate-pulse bg-destructive/10 text-destructive"
              : isConnecting
                ? "bg-muted/50 text-muted-foreground"
                : "text-muted-foreground hover:bg-muted/50"
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isConnecting ? (
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
