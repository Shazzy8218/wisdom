import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Bookmark, Search, Sparkles } from "lucide-react";

type Tab = "prompts" | "lessons" | "threads";

const SAVED_PROMPTS = [
  { id: "p1", title: "Email Response Template", category: "Work", prompt: "Write a professional email to [recipient] about [topic]..." },
  { id: "p2", title: "Meeting Summary Generator", category: "Work", prompt: "Organize my meeting notes into: Key Decisions, Action Items..." },
  { id: "p3", title: "Budget Analysis", category: "Money", prompt: "Analyze my monthly expenses and suggest savings..." },
  { id: "p4", title: "Content Calendar", category: "Creator", prompt: "Create a 30-day content calendar for [niche]..." },
  { id: "p5", title: "Negotiation Script", category: "Business", prompt: "I need to negotiate [situation]. Write a script..." },
];

const SAVED_LESSONS = [
  { id: "sl1", title: "The 3-Part Prompt Formula", track: "AI Basics", date: "Today" },
  { id: "sl2", title: "Constraint Prompting", track: "Prompting", date: "Yesterday" },
  { id: "sl3", title: "SOP Generator", track: "Business", date: "3 days ago" },
];

export default function Library() {
  const [tab, setTab] = useState<Tab>("prompts");
  const [search, setSearch] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "prompts", label: "Prompts", icon: Sparkles },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "threads", label: "Q&A", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Library</p>
        <h1 className="font-display text-h1 text-foreground">Your<br/>Collection</h1>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search library..."
            className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-caption font-medium transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Content */}
      <div className="px-5 space-y-2">
        {tab === "prompts" && SAVED_PROMPTS.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4 hover:border-primary/10 transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-foreground">{p.title}</p>
                <p className="text-micro text-muted-foreground mt-0.5 uppercase tracking-wider">{p.category}</p>
                <p className="text-caption text-text-secondary mt-2 line-clamp-1">{p.prompt}</p>
              </div>
              <Bookmark className="h-4 w-4 text-accent-gold shrink-0" />
            </div>
          </motion.div>
        ))}

        {tab === "lessons" && SAVED_LESSONS.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4 hover:border-primary/10 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-foreground">{l.title}</p>
                <p className="text-micro text-muted-foreground">{l.track} · {l.date}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {tab === "threads" && (
          <div className="text-center py-12">
            <MessageCircle className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-body text-muted-foreground">No saved Q&A threads yet.</p>
            <p className="text-caption text-text-tertiary mt-1">Ask AI about any lesson to start a thread.</p>
          </div>
        )}
      </div>
    </div>
  );
}
