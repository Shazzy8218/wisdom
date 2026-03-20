import { useState, useCallback, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const SCRIBE_TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`;

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
  const lastSpokenRef = useRef<string>("");

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
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

  const startListening = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const resp = await fetch(SCRIBE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const data = await resp.json();
      if (!data?.token) throw new Error("No token received");

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setIsListening(true);
    } catch (err: any) {
      console.error("Voice start failed:", err);
      toast({
        title: "Microphone access failed",
        description: err.message || "Please allow microphone access and try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, isConnecting]);

  const stopListening = useCallback(() => {
    scribe.disconnect();
    setIsListening(false);
    setPartialText("");
  }, [scribe]);

  const speakText = useCallback(async (text: string) => {
    if (!text || !ttsEnabled || text === lastSpokenRef.current) return;
    
    // Strip markdown for cleaner speech
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

      if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const toggleTts = useCallback(() => {
    if (ttsEnabled && isSpeaking) stopSpeaking();
    setTtsEnabled(!ttsEnabled);
  }, [ttsEnabled, isSpeaking, stopSpeaking]);

  return (
    <>
      {/* Floating voice controls */}
      <div className="flex items-center gap-1.5">
        {/* TTS toggle */}
        <button
          onClick={toggleTts}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
            ttsEnabled ? "hover:bg-muted/50 text-primary" : "hover:bg-muted/50 text-muted-foreground"
          }`}
          title={ttsEnabled ? "Mute Owl voice" : "Unmute Owl voice"}
        >
          {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isConnecting || isStreaming}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
            isListening
              ? "bg-destructive/10 text-destructive animate-pulse"
              : isConnecting
                ? "bg-muted/50 text-muted-foreground"
                : "hover:bg-muted/50 text-muted-foreground"
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

      {/* Partial transcript indicator */}
      <AnimatePresence>
        {isListening && partialText && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 px-5 pb-2"
          >
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary/80 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="truncate">{partialText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 px-5 pb-2"
          >
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary/80 flex items-center gap-2">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span>Owl is speaking…</span>
              <button onClick={stopSpeaking} className="ml-auto text-muted-foreground hover:text-foreground text-[10px]">
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export the speak function for external use
export { VoiceChat };
