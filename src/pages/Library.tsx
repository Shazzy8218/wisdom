import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Search, Sparkles, Copy, Play, Star, Quote, Brain, Layers, Trash2, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadChatThreads } from "@/lib/chat-history";
import { loadSnapshots, type WisdomSnapshot } from "@/lib/wisdom-snapshots";
import { loadWisdomPacks, loadSavedDrills, deleteWisdomPack, type WisdomPack } from "@/lib/wisdom-packs";
import { useNavigate } from "react-router-dom";
import HiddenOwl from "@/components/HiddenOwl";

type Tab = "snapshots" | "prompts" | "drills" | "threads" | "quotes";

const PROMPT_PACKS = [
  { id: "w1", title: "Email Response Template", category: "Work", prompt: "Write a professional email to [recipient] about [topic]. Keep it concise, polite, and actionable. Include a clear subject line.", tags: ["email", "professional"] },
  { id: "w2", title: "Meeting Summary Generator", category: "Work", prompt: "Organize my meeting notes into: Key Decisions, Action Items (with owners and deadlines), Open Questions, Next Steps.", tags: ["meetings", "productivity"] },
  { id: "b1", title: "Business Plan One-Pager", category: "Business", prompt: "Create a one-page business plan for [idea]. Include: value proposition, target market, revenue model, key metrics, competitive advantage.", tags: ["strategy", "startup"] },
  { id: "m1", title: "Budget Breakdown", category: "Money", prompt: "Analyze my monthly income ($[X]) and expenses: [list]. Create a budget using the 50/30/20 rule. Identify top 3 savings opportunities.", tags: ["budgeting", "savings"] },
  { id: "d1", title: "Daily Planner", category: "Daily Life", prompt: "Create an optimized daily schedule for someone who: [describe lifestyle]. Include time blocks for work, health, learning, and rest.", tags: ["planning", "routine"] },
  { id: "s1", title: "Study Guide Builder", category: "Study", prompt: "Create a study guide for [topic]. Include: key concepts, definitions, mnemonics, practice questions (with answers), and a 1-page cheat sheet.", tags: ["learning", "education"] },
  { id: "v1", title: "Fact Checker", category: "Safety", prompt: "Check these claims for accuracy: [list]. For each: rate confidence (high/medium/low), provide source suggestions, flag potential misinformation.", tags: ["verification", "safety"] },
];

const WISDOM_QUOTES = [
  { id: "q1", text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { id: "q2", text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { id: "q3", text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { id: "q4", text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { id: "q5", text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
];

export default function Library() {
  const [tab, setTab] = useState<Tab>("snapshots");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("wisdom-favorites") || "[]"); } catch { return []; }
  });
  const navigate = useNavigate();

  const chatThreads = useMemo(() => loadChatThreads(), []);
  const snapshots = useMemo(() => loadSnapshots(), []);
  const wisdomPacks = useMemo(() => loadWisdomPacks(), []);
  const savedDrills = useMemo(() => loadSavedDrills(), []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("wisdom-favorites", JSON.stringify(updated));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDeletePack = (id: string) => {
    deleteWisdomPack(id);
    toast({ title: "Wisdom pack removed" });
    // Force re-render by toggling tab
    setTab("prompts");
    setTimeout(() => setTab("snapshots"), 0);
  };

  const filteredPrompts = PROMPT_PACKS.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "snapshots", label: "Wisdom Packs", icon: Brain },
    { id: "prompts", label: "Prompts", icon: Sparkles },
    { id: "drills", label: "Drills", icon: Zap },
    { id: "threads", label: "Q&A", icon: MessageCircle },
    { id: "quotes", label: "Quotes", icon: Quote },
  ];

  const categories = [...new Set(filteredPrompts.map(p => p.category))];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6 relative">
        <p className="section-label text-primary mb-2">Library</p>
        <h1 className="font-display text-h1 text-foreground">Your Collection</h1>
        <HiddenOwl locationId="library-top" className="absolute right-6 top-16" size={16} />
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
      <div className="flex gap-1 px-5 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-caption font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-2">
        {/* Wisdom Packs / Snapshots Tab */}
        {tab === "snapshots" && (
          <>
            {wisdomPacks.length > 0 ? (
              <div className="space-y-3">
                <p className="text-caption text-muted-foreground">{wisdomPacks.length} wisdom packs saved</p>
                {wisdomPacks.map((pack, i) => (
                  <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card p-5 border-accent-gold/10 hover:border-accent-gold/20 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-accent-gold" />
                        <span className="text-micro text-muted-foreground">{new Date(pack.timestamp).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleDeletePack(pack.id)}
                        className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3 w-3 text-text-tertiary" />
                      </button>
                    </div>
                    
                    {/* Wisdom Line */}
                    <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 mb-3">
                      <p className="text-caption italic text-foreground">💎 "{pack.wisdomLine}"</p>
                    </div>

                    {/* Micro-lesson */}
                    {pack.microLesson.hook && (
                      <div className="mb-3">
                        <p className="text-micro font-semibold text-primary mb-1">📖 Micro-Lesson</p>
                        <p className="text-caption text-muted-foreground">{pack.microLesson.hook}</p>
                        {pack.microLesson.concept && (
                          <p className="text-caption text-foreground mt-1">{pack.microLesson.concept}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => copyToClipboard(pack.wisdomLine)}
                        className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      {pack.microLesson.tryIt && (
                        <button onClick={() => navigate(`/?context=${encodeURIComponent(pack.microLesson.tryIt)}&autoSend=true`)}
                          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                          <Play className="h-3 w-3" /> Try It
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : snapshots.length > 0 ? (
              <div className="space-y-3">
                <p className="text-caption text-muted-foreground">{snapshots.length} wisdom cards collected</p>
                {snapshots.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card p-5 border-accent-gold/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-accent-gold" />
                      <span className="section-label text-accent-gold">{s.category}</span>
                    </div>
                    <h4 className="text-body font-semibold text-foreground mb-2">{s.title}</h4>
                    <p className="text-caption text-muted-foreground">💡 {s.keyInsight}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Layers className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-body text-muted-foreground">No Wisdom Packs yet.</p>
                <p className="text-caption text-text-tertiary mt-1">Use Task Mode in Chat to auto-generate wisdom packs.</p>
              </div>
            )}
          </>
        )}

        {/* Prompts Tab */}
        {tab === "prompts" && (
          <>
            {categories.map(cat => (
              <div key={cat} className="mb-4">
                <p className="section-label mb-2">{cat}</p>
                <div className="space-y-2">
                  {filteredPrompts.filter(p => p.category === cat).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-4 hover:border-primary/10 transition-all">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-medium text-foreground">{p.title}</p>
                          <p className="text-caption text-muted-foreground mt-1 line-clamp-2 font-mono">{p.prompt}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => copyToClipboard(p.prompt)}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button onClick={() => navigate(`/?context=${encodeURIComponent(p.prompt)}&autoSend=true`)}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                              <Play className="h-3 w-3" /> Use in Chat
                            </button>
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(p.id)} className="shrink-0">
                          <Star className={`h-4 w-4 ${favorites.includes(p.id) ? "text-accent-gold fill-accent-gold" : "text-text-tertiary"}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Drills Tab */}
        {tab === "drills" && (
          savedDrills.length > 0 ? (
            <div className="space-y-3">
              <p className="text-caption text-muted-foreground">{savedDrills.length} drills saved</p>
              {savedDrills.map((drill, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-body font-medium text-foreground">Drill #{i + 1}</p>
                  </div>
                  <p className="text-caption text-foreground mb-2">{drill.question}</p>
                  {drill.options.map((opt, j) => (
                    <p key={j} className="text-caption text-muted-foreground ml-2">
                      {String.fromCharCode(65 + j)}) {opt}
                    </p>
                  ))}
                  <p className="text-micro text-primary mt-2 border-t border-border pt-2">✓ {drill.answer}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-body text-muted-foreground">No saved drills yet.</p>
              <p className="text-caption text-text-tertiary mt-1">Drills auto-save when you use Task Mode.</p>
            </div>
          )
        )}

        {/* Q&A Threads Tab */}
        {tab === "threads" && (
          chatThreads.length > 0 ? (
            chatThreads.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4 hover:border-primary/10 transition-all cursor-pointer"
                onClick={() => navigate(`/?threadId=${t.id}`)}>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-micro text-muted-foreground">{t.messages.length} messages · {new Date(t.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-body text-muted-foreground">No saved Q&A threads yet.</p>
            </div>
          )
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && WISDOM_QUOTES.filter(q =>
          !search || q.text.toLowerCase().includes(search.toLowerCase())
        ).map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4 hover:border-primary/10 transition-all">
            <div className="flex items-start gap-3">
              <Quote className="h-4 w-4 text-accent-gold shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-body italic text-foreground leading-relaxed">"{q.text}"</p>
                <p className="text-micro text-muted-foreground mt-2">— {q.author}</p>
              </div>
              <button onClick={() => toggleFavorite(q.id)} className="shrink-0">
                <Star className={`h-4 w-4 ${favorites.includes(q.id) ? "text-accent-gold fill-accent-gold" : "text-text-tertiary"}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
