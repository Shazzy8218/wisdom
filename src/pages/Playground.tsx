import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Copy, Save, ArrowLeftRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";

export default function Playground() {
  const [prompt, setPrompt] = useState("");
  const [outputA, setOutputA] = useState("");
  const [outputB, setOutputB] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const runPrompt = useCallback(async (target: "A" | "B") => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    const setter = target === "A" ? setOutputA : setOutputB;
    setter("");
    let content = "";

    await streamChat({
      messages: [{ role: "user", content: prompt }],
      mode: "default",
      onDelta: (chunk) => { content += chunk; setter(content); },
      onDone: () => setIsRunning(false),
      onError: (err) => { toast({ title: "Error", description: err, variant: "destructive" }); setIsRunning(false); },
    });
  }, [prompt]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Playground</p>
        <h1 className="font-display text-h1 text-foreground">Test &<br/>Compare</h1>
      </div>

      {/* Prompt Input */}
      <div className="px-5 mb-4">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Enter your prompt here..."
          className="w-full rounded-2xl border border-border bg-card p-4 text-body text-foreground placeholder:text-text-tertiary outline-none resize-none focus:border-primary/30 transition-colors" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-5 mb-6">
        <button onClick={() => runPrompt("A")} disabled={!prompt.trim() || isRunning}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-caption font-semibold text-primary-foreground disabled:opacity-30 transition-opacity">
          <Play className="h-3.5 w-3.5" /> Run
        </button>
        <button onClick={() => setCompareMode(!compareMode)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-caption font-medium transition-all ${
            compareMode ? "bg-primary/10 text-primary border border-primary/20" : "bg-surface-2 text-muted-foreground"
          }`}>
          <ArrowLeftRight className="h-3.5 w-3.5" /> A/B Compare
        </button>
        {compareMode && (
          <button onClick={() => runPrompt("B")} disabled={!prompt.trim() || isRunning}
            className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption font-medium text-muted-foreground disabled:opacity-30 hover:bg-surface-hover transition-all">
            <Play className="h-3.5 w-3.5" /> Run B
          </button>
        )}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Output */}
      <div className={`px-5 ${compareMode ? "grid grid-cols-2 gap-3" : ""}`}>
        {/* Output A */}
        <div>
          {compareMode && <p className="section-label mb-2">Output A</p>}
          {outputA ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
              <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_strong]:text-foreground">
                <ReactMarkdown>{outputA}</ReactMarkdown>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleCopy(outputA)} className="flex items-center gap-1 text-micro text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button className="flex items-center gap-1 text-micro text-muted-foreground hover:text-foreground transition-colors">
                  <Save className="h-3 w-3" /> Save
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Sparkles className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
              <p className="text-caption text-muted-foreground">Run a prompt to see output</p>
            </div>
          )}
        </div>

        {/* Output B */}
        {compareMode && (
          <div>
            <p className="section-label mb-2">Output B</p>
            {outputB ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
                <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_strong]:text-foreground">
                  <ReactMarkdown>{outputB}</ReactMarkdown>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button onClick={() => handleCopy(outputB)} className="flex items-center gap-1 text-micro text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-8 text-center">
                <Sparkles className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
                <p className="text-caption text-muted-foreground">Run B to compare</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
