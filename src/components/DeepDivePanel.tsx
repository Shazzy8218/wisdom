import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, BookOpen, Target, ListChecks, Lightbulb, Users, ClipboardList, GraduationCap, ArrowRight } from "lucide-react";
import { type StarterLesson, type CategoryTrack } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface DeepDivePanelProps {
  lesson: StarterLesson;
  track: CategoryTrack;
  difficulty: string;
  onClose: () => void;
}

export default function DeepDivePanel({ lesson, track, difficulty, onClose }: DeepDivePanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `Generate a comprehensive Deep Dive Pack for this lesson:

LESSON: "${lesson.title}"
TOPIC: ${track.name}
DIFFICULTY: ${difficulty}
CONTENT: ${lesson.content || lesson.hook}
MENTAL MODEL: ${lesson.mentalModel || "N/A"}

Structure your response EXACTLY like this:

## 📖 Expanded Explanation
(Still simple, anyone can understand. 3-4 paragraphs.)

## 🌍 Real-World Scenarios
(At least 5 different scenarios where this applies. Number them.)

## 📋 Step-by-Step Playbook
(Do this → then this → then this. Numbered steps with clear actions.)

## ⚡ Advanced Tips
(For higher-level users. 4-5 tips.)

## ⚖️ Bad vs Good vs Elite
| Approach | What they do | Result |
|----------|-------------|--------|
| Bad | ... | ... |
| Good | ... | ... |
| Elite | ... | ... |

## 📝 Mini Case Study
(One realistic story, 2-3 paragraphs. Real-feeling names and situations.)

## 🏋️ Practice Tasks
(3 specific tasks the reader can do RIGHT NOW. Numbered.)

## 📄 Cheat Sheet
(Bullet summary of everything above. 8-10 bullets max.)

## 🎓 Teach It to Someone
(A prompt: "Explain [topic] to a friend in 60 seconds using this structure: ...")

## 🔗 Follow-Up Topics
(3 recommended next topics to explore.)

Keep everything practical, specific, and actionable. No motivational fluff. Teach like a street-smart mentor.` }
          ],
        }),
      });

      if (!resp.ok) throw new Error("Generation failed");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { fullText += c; setContent(fullText); }
          } catch {}
        }
      }
    } catch (e) {
      setError("Failed to generate deep dive. Try again.");
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="mb-5">
      <div className="glass-card border-primary/20 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display text-body font-semibold text-foreground">Deep Dive Pack</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-surface-hover transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          {!content && !loading && (
            <div className="text-center py-6">
              <BookOpen className="h-10 w-10 text-primary/30 mx-auto mb-3" />
              <p className="text-body text-muted-foreground mb-4">Get the full breakdown: scenarios, playbook, case study, practice tasks, and cheat sheet.</p>
              <button onClick={generate}
                className="rounded-xl bg-primary px-6 py-3 text-body font-semibold text-primary-foreground">
                Generate Deep Dive
              </button>
            </div>
          )}

          {loading && !content && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-body text-muted-foreground">Generating your deep dive...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <p className="text-body text-destructive mb-3">{error}</p>
              <button onClick={generate} className="rounded-xl bg-primary px-4 py-2 text-micro font-semibold text-primary-foreground">
                Retry
              </button>
            </div>
          )}

          {content && (
            <div className="prose prose-invert prose-sm max-w-none text-foreground
              prose-headings:font-display prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-table:text-sm
              prose-th:text-foreground prose-th:bg-surface-2 prose-th:p-2
              prose-td:text-muted-foreground prose-td:p-2 prose-td:border-border">
              <ReactMarkdown>{content}</ReactMarkdown>
              {loading && <Loader2 className="h-4 w-4 text-primary animate-spin mt-2" />}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
