import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Search, Sparkles, Copy, Play, Star, Quote, Brain, Layers, Trash2, Zap, X, ExternalLink, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadChatThreads, type ChatThread } from "@/lib/chat-history";
import { loadSnapshots, type WisdomSnapshot } from "@/lib/wisdom-snapshots";
import { loadWisdomPacks, loadSavedDrills, deleteWisdomPack, type WisdomPack } from "@/lib/wisdom-packs";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("wisdom-favorites") || "[]"); } catch { return []; }
  });
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const navigate = useNavigate();

  const chatThreads = useMemo(() => loadChatThreads(), [tab]);
  const snapshots = useMemo(() => loadSnapshots(), [tab]);
  const wisdomPacks = useMemo(() => loadWisdomPacks(), [tab]);
  const savedDrills = useMemo(() => loadSavedDrills(), [tab]);
  const savedQuotes: string[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("wisdom-saved-quotes") || "[]"); } catch { return []; }
  }, [tab]);

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
    setExpandedItem(null);
    setTab("prompts"); setTimeout(() => setTab("snapshots"), 0);
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
          <button key={t.id} onClick={() => { setTab(t.id); setExpandedItem(null); setExpandedThread(null); setExpandedQuote(null); }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-caption font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-2">
        {/* Wisdom Packs Tab */}
        {tab === "snapshots" && (
          <>
            {wisdomPacks.length > 0 ? (
              <div className="space-y-3">
                <p className="text-caption text-muted-foreground">{wisdomPacks.length} wisdom packs saved</p>
                {wisdomPacks.map((pack, i) => (
                  <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <div className={`glass-card p-5 border-accent-gold/10 hover:border-accent-gold/20 transition-all cursor-pointer ${expandedItem === pack.id ? "border-accent-gold/30" : ""}`}
                      onClick={() => setExpandedItem(expandedItem === pack.id ? null : pack.id)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-accent-gold" />
                          <span className="text-micro text-muted-foreground">{new Date(pack.timestamp).toLocaleDateString()}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePack(pack.id); }}
                          className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3 w-3 text-text-tertiary" />
                        </button>
                      </div>

                      {/* Wisdom Line */}
                      <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 mb-3">
                        <p className="text-caption italic text-foreground">💎 "{pack.wisdomLine}"</p>
                      </div>

                      {/* Source */}
                      <p className="text-micro text-text-tertiary mb-2">From: "{pack.sourcePrompt?.slice(0, 50)}…"</p>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {expandedItem === pack.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            {pack.microLesson.hook && (
                              <div className="mb-3 mt-2 rounded-xl bg-surface-2 p-3">
                                <p className="text-micro font-semibold text-primary mb-1">📖 Micro-Lesson</p>
                                <p className="text-caption text-foreground font-medium">{pack.microLesson.hook}</p>
                                {pack.microLesson.concept && (
                                  <p className="text-caption text-muted-foreground mt-1">{pack.microLesson.concept}</p>
                                )}
                                {pack.microLesson.tryIt && (
                                  <p className="text-micro text-primary mt-2">✅ Try: {pack.microLesson.tryIt}</p>
                                )}
                              </div>
                            )}
                            {pack.drill.question && (
                              <div className="mb-3 rounded-xl bg-surface-2 p-3">
                                <p className="text-micro font-semibold text-primary mb-1">🎯 Drill</p>
                                <p className="text-caption text-foreground">{pack.drill.question}</p>
                                {pack.drill.options.map((opt, j) => (
                                  <p key={j} className="text-caption text-muted-foreground ml-2 mt-0.5">{String.fromCharCode(65 + j)}) {opt}</p>
                                ))}
                                <p className="text-micro text-primary mt-2 border-t border-border pt-2">✓ {pack.drill.answer}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(pack.wisdomLine); }}
                          className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        {pack.microLesson.tryIt && (
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(pack.microLesson.tryIt)}&autoSend=true`); }}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                            <Play className="h-3 w-3" /> Try It
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(`Explain this wisdom in depth: "${pack.wisdomLine}"`)}&autoSend=true`); }}
                          className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                          <MessageCircle className="h-3 w-3" /> Ask Owl
                        </button>
                      </div>
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
                    className="glass-card p-5 border-accent-gold/10 cursor-pointer"
                    onClick={() => setExpandedItem(expandedItem === s.id ? null : s.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-accent-gold" />
                      <span className="section-label text-accent-gold">{s.category}</span>
                    </div>
                    <h4 className="text-body font-semibold text-foreground mb-2">{s.title}</h4>
                    <p className="text-caption text-muted-foreground">💡 {s.keyInsight}</p>
                    <AnimatePresence>
                      {expandedItem === s.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 space-y-2">
                          {s.mentalModel && <p className="text-caption text-foreground rounded-xl bg-surface-2 p-3">🧠 {s.mentalModel}</p>}
                          {s.bragLine && <p className="text-caption text-muted-foreground italic">"{s.bragLine}"</p>}
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(s.keyInsight); }}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(`Teach me more about: ${s.title}`)}&autoSend=true`); }}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                              <Play className="h-3 w-3" /> Learn More
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      transition={{ delay: i * 0.03 }}>
                      <div className={`glass-card p-4 hover:border-primary/10 transition-all cursor-pointer ${expandedItem === p.id ? "border-primary/20" : ""}`}
                        onClick={() => setExpandedItem(expandedItem === p.id ? null : p.id)}>
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-body font-medium text-foreground">{p.title}</p>
                            <p className="text-caption text-muted-foreground mt-1 line-clamp-2 font-mono">{p.prompt}</p>
                            <AnimatePresence>
                              {expandedItem === p.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-3">
                                  <div className="rounded-xl bg-surface-2 p-3 mb-3">
                                    <textarea
                                      value={editedPrompts[p.id] ?? p.prompt}
                                      onChange={(e) => setEditedPrompts(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full bg-transparent text-caption text-foreground font-mono whitespace-pre-wrap outline-none resize-none min-h-[80px]"
                                      rows={4}
                                    />
                                  </div>
                                  {editedPrompts[p.id] && editedPrompts[p.id] !== p.prompt && (
                                    <p className="text-micro text-primary mb-2">✏️ Edited — your changes will be sent to Chat</p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {p.tags.map(tag => (
                                      <span key={tag} className="rounded-lg bg-primary/10 px-2 py-0.5 text-micro text-primary">#{tag}</span>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div className="flex gap-2 mt-3">
                              <button onClick={(e) => { e.stopPropagation(); copyToClipboard(editedPrompts[p.id] ?? p.prompt); }}
                                className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(editedPrompts[p.id] ?? p.prompt)}&autoSend=true`); }}
                                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                                <Play className="h-3 w-3" /> Use in Chat
                              </button>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} className="shrink-0">
                            <Star className={`h-4 w-4 ${favorites.includes(p.id) ? "text-accent-gold fill-accent-gold" : "text-text-tertiary"}`} />
                          </button>
                        </div>
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
              {savedDrills.map((drill, i) => {
                const drillId = `drill-${i}`;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card p-4 cursor-pointer" onClick={() => setExpandedItem(expandedItem === drillId ? null : drillId)}>
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
                    <AnimatePresence>
                      {expandedItem === drillId && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <p className="text-micro text-primary mt-3 border-t border-border pt-2">✓ {drill.answer}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(`Quiz me about: ${drill.question}`)}&autoSend=true`); }}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                              <Play className="h-3 w-3" /> Replay in Chat
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(drill.question); }}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
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
            <div className="space-y-2">
              {chatThreads.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <div className={`glass-card p-4 hover:border-primary/10 transition-all cursor-pointer ${expandedThread === t.id ? "border-primary/20" : ""}`}
                    onClick={() => setExpandedThread(expandedThread === t.id ? null : t.id)}>
                    <div className="flex items-center gap-3 mb-1">
                      <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-foreground truncate">{t.title}</p>
                        <p className="text-micro text-muted-foreground">{t.messages.length} messages · {new Date(t.updatedAt).toLocaleDateString()}</p>
                        {t.lessonId && <p className="text-micro text-text-tertiary">From lesson</p>}
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 text-text-tertiary transition-transform ${expandedThread === t.id ? "rotate-90" : ""}`} />
                    </div>
                    <AnimatePresence>
                      {expandedThread === t.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto hide-scrollbar border-t border-border pt-3">
                            {t.messages.slice(0, 10).map((msg, idx) => (
                              <div key={msg.id} className={`rounded-xl p-3 text-caption ${msg.role === "user" ? "bg-primary/10 text-foreground ml-4" : "bg-surface-2 text-foreground mr-4"}`}>
                                <p className="text-micro font-semibold text-muted-foreground mb-1">{msg.role === "user" ? "You" : "Owl"}</p>
                                <div className="prose prose-sm max-w-none text-caption">
                                  <ReactMarkdown>{msg.content.slice(0, 300) + (msg.content.length > 300 ? "…" : "")}</ReactMarkdown>
                                </div>
                              </div>
                            ))}
                            {t.messages.length > 10 && (
                              <p className="text-micro text-muted-foreground text-center">+{t.messages.length - 10} more messages</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/?threadId=${t.id}`); }}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                              <Play className="h-3 w-3" /> Continue Chat
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(t.messages.map(m => `${m.role}: ${m.content}`).join("\n\n")); }}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy All
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-body text-muted-foreground">No saved Q&A threads yet.</p>
            </div>
          )
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <>
            {/* User-saved quotes */}
            {savedQuotes.length > 0 && (
              <div className="mb-4">
                <p className="section-label mb-2 text-accent-gold">Your Saved Quotes</p>
                {savedQuotes.map((q, i) => (
                  <motion.div key={`saved-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`glass-card p-4 border-accent-gold/10 hover:border-accent-gold/20 transition-all cursor-pointer mb-2 ${expandedQuote === `saved-${i}` ? "border-accent-gold/30" : ""}`}
                    onClick={() => setExpandedQuote(expandedQuote === `saved-${i}` ? null : `saved-${i}`)}>
                    <div className="flex items-start gap-3">
                      <Quote className="h-4 w-4 text-accent-gold shrink-0 mt-0.5" />
                      <p className="text-body italic text-foreground leading-relaxed flex-1">"{q}"</p>
                    </div>
                    <AnimatePresence>
                      {expandedQuote === `saved-${i}` && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 space-y-2">
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(q); }}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(`Explain this quote in life-changing depth. Cover meaning, real-world examples, common mistakes, an actionable drill, and a micro-challenge: "${q}"`)}&autoSend=true`); }}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                              <BookOpen className="h-3 w-3" /> Learn More
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Built-in quotes */}
            <p className="section-label mb-2">Classic Wisdom</p>
            {WISDOM_QUOTES.filter(q =>
              !search || q.text.toLowerCase().includes(search.toLowerCase())
            ).map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card p-4 hover:border-primary/10 transition-all cursor-pointer mb-2 ${expandedQuote === q.id ? "border-primary/20" : ""}`}
                onClick={() => setExpandedQuote(expandedQuote === q.id ? null : q.id)}>
                <div className="flex items-start gap-3">
                  <Quote className="h-4 w-4 text-accent-gold shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-body italic text-foreground leading-relaxed">"{q.text}"</p>
                    <p className="text-micro text-muted-foreground mt-2">— {q.author}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(q.id); }} className="shrink-0">
                    <Star className={`h-4 w-4 ${favorites.includes(q.id) ? "text-accent-gold fill-accent-gold" : "text-text-tertiary"}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {expandedQuote === q.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-2">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(`"${q.text}" — ${q.author}`); }}
                          className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/?context=${encodeURIComponent(`Explain this quote in life-changing depth: "${q.text}" — ${q.author}. Cover: meaning, real-world examples, common mistakes, actionable drill, micro-challenge.`)}&autoSend=true`); }}
                          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-micro font-medium text-primary hover:bg-primary/20 transition-colors">
                          <BookOpen className="h-3 w-3" /> Learn More
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
