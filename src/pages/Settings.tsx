import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Trash2, Eye, RotateCcw, Wifi, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { streamChat, generateLesson, generateGameQuestion } from "@/lib/ai-stream";
import HiddenOwl from "@/components/HiddenOwl";

interface MemoryToggle {
  id: string;
  label: string;
  description: string;
}

const MEMORY_TOGGLES: MemoryToggle[] = [
  { id: "goals", label: "Remember goals", description: "AI remembers your learning goals" },
  { id: "style", label: "Remember explanation style", description: "AI adapts to your preferred teaching style" },
  { id: "industry", label: "Remember industry/tools", description: "AI references your industry context" },
  { id: "workflows", label: "Remember saved workflows", description: "AI recalls your custom workflows" },
];

function AIConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{ chat?: any; lesson?: any; game?: any }>({});

  const runTest = async () => {
    setTesting(true);
    setResults({});
    const r: any = {};

    // Test chat
    const chatStart = Date.now();
    try {
      let response = "";
      await streamChat({
        messages: [{ role: "user", content: "Reply with exactly the word CONNECTED." }],
        onDelta: (t) => { response += t; },
        onDone: () => {},
        onError: (e) => { r.chat = { error: e }; },
      });
      r.chat = { ok: true, response: response.trim(), latency: Date.now() - chatStart };
    } catch (e: any) {
      r.chat = { error: e.message, latency: Date.now() - chatStart };
    }
    setResults({ ...r });

    // Test lesson generation
    const lessonStart = Date.now();
    try {
      const lesson = await generateLesson({ track: "Management", difficulty: "beginner" });
      r.lesson = { ok: true, title: lesson.title, latency: Date.now() - lessonStart };
    } catch (e: any) {
      r.lesson = { error: e.message, latency: Date.now() - lessonStart };
    }
    setResults({ ...r });

    // Test game question
    const gameStart = Date.now();
    try {
      const q = await generateGameQuestion({ gameType: "hallucination-hunter" });
      r.game = { ok: true, latency: Date.now() - gameStart };
    } catch (e: any) {
      r.game = { error: e.message, latency: Date.now() - gameStart };
    }
    setResults({ ...r });
    setTesting(false);
  };

  const StatusIcon = ({ ok }: { ok?: boolean }) =>
    ok === undefined ? null : ok ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-primary" />;

  return (
    <div className="space-y-3">
      <button onClick={runTest} disabled={testing}
        className="glass-card p-4 w-full flex items-center justify-center gap-2 text-body font-medium text-foreground hover:border-primary/30 transition-all disabled:opacity-50">
        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
        {testing ? "Testing..." : "Test AI Connection"}
      </button>
      {Object.entries(results).map(([key, val]: [string, any]) => (
        <div key={key} className="glass-card p-3 text-micro">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon ok={val?.ok} />
            <span className="font-medium text-foreground capitalize">{key}</span>
            {val?.latency && <span className="text-muted-foreground ml-auto">{val.latency}ms</span>}
          </div>
          {val?.response && <p className="text-muted-foreground truncate">Response: {val.response}</p>}
          {val?.title && <p className="text-muted-foreground truncate">Lesson: {val.title}</p>}
          {val?.error && <p className="text-primary truncate">Error: {val.error}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetMemory = () => {
    setToggles({});
    toast({ title: "Memory Reset", description: "All AI memory has been cleared." });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Settings</p>
        <h1 className="font-display text-h1 text-foreground">Preferences</h1>
      </div>

      {/* AI Memory */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="section-label text-primary">AI Memory (Consent-Only)</h2>
        </div>
        <p className="text-caption text-muted-foreground mb-4">These settings are OFF by default. Your data is never stored without your permission.</p>

        <div className="space-y-2">
          {MEMORY_TOGGLES.map((toggle, i) => (
            <motion.div key={toggle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-body font-medium text-foreground">{toggle.label}</p>
                <p className="text-micro text-muted-foreground">{toggle.description}</p>
              </div>
              <button onClick={() => handleToggle(toggle.id)}
                className={`relative h-6 w-11 rounded-full transition-colors ${toggles[toggle.id] ? "bg-primary" : "bg-surface-2 border border-border"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${toggles[toggle.id] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <Eye className="h-3.5 w-3.5" /> View Memory
          </button>
          <button onClick={handleResetMemory} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-caption text-primary hover:bg-primary/10 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </button>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Display */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">Display</h2>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">Reduce Motion</p>
            <p className="text-micro text-muted-foreground">Minimize animations</p>
          </div>
          <button onClick={() => setReduceMotion(!reduceMotion)}
            className={`relative h-6 w-11 rounded-full transition-colors ${reduceMotion ? "bg-primary" : "bg-surface-2 border border-border"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${reduceMotion ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* AI Connection Test */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">AI Connection Test</h2>
        <AIConnectionTest />
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Danger Zone */}
      <div className="px-5">
        <h2 className="section-label mb-4 text-primary">Danger Zone</h2>
        <button className="glass-card p-4 w-full flex items-center gap-3 text-left border-primary/20 hover:border-primary/40 transition-all">
          <Trash2 className="h-4 w-4 text-primary" />
          <div>
            <p className="text-body font-medium text-primary">Delete All Data</p>
            <p className="text-micro text-muted-foreground">Remove all progress, tokens, and saved content</p>
          </div>
        </button>
      </div>
    </div>
  );
}
