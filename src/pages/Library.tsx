import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Search, Sparkles, Copy, Play, Star, Quote, Brain, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadChatThreads } from "@/lib/chat-history";
import { loadSnapshots, type WisdomSnapshot } from "@/lib/wisdom-snapshots";
import { useNavigate } from "react-router-dom";
import HiddenOwl from "@/components/HiddenOwl";

type Tab = "prompts" | "snapshots" | "threads" | "quotes";

const PROMPT_PACKS = [
  { id: "w1", title: "Email Response Template", category: "Work", prompt: "Write a professional email to [recipient] about [topic]. Keep it concise, polite, and actionable. Include a clear subject line.", tags: ["email", "professional"] },
  { id: "w2", title: "Meeting Summary Generator", category: "Work", prompt: "Organize my meeting notes into: Key Decisions, Action Items (with owners and deadlines), Open Questions, Next Steps.", tags: ["meetings", "productivity"] },
  { id: "w3", title: "Task Prioritizer", category: "Work", prompt: "Here are my tasks for today: [list]. Prioritize them using the Eisenhower Matrix (urgent/important). Suggest which to delegate or eliminate.", tags: ["productivity", "planning"] },
  { id: "b1", title: "Business Plan One-Pager", category: "Business", prompt: "Create a one-page business plan for [idea]. Include: value proposition, target market, revenue model, key metrics, competitive advantage.", tags: ["strategy", "startup"] },
  { id: "b2", title: "Competitor Analysis", category: "Business", prompt: "Analyze [competitor] vs my business [description]. Compare: pricing, features, target audience, strengths, weaknesses. Suggest differentiation strategies.", tags: ["competition", "strategy"] },
  { id: "m1", title: "Budget Breakdown", category: "Money", prompt: "Analyze my monthly income ($[X]) and expenses: [list]. Create a budget using the 50/30/20 rule. Identify top 3 savings opportunities.", tags: ["budgeting", "savings"] },
  { id: "m2", title: "Investment Comparison", category: "Money", prompt: "Compare these investment options: [list]. Analyze: risk level, expected return, liquidity, time horizon. Recommend based on [goal].", tags: ["investing", "finance"] },
  { id: "d1", title: "Daily Planner", category: "Daily Life", prompt: "Create an optimized daily schedule for someone who: [describe lifestyle]. Include time blocks for work, health, learning, and rest. Use 30-min increments.", tags: ["planning", "routine"] },
  { id: "d2", title: "Meal Prep Plan", category: "Daily Life", prompt: "Create a 7-day meal prep plan for [dietary preference]. Budget: $[X]/week. Include: shopping list, prep instructions, nutritional summary.", tags: ["health", "cooking"] },
  { id: "s1", title: "Study Guide Builder", category: "Study", prompt: "Create a study guide for [topic]. Include: key concepts, definitions, mnemonics, practice questions (with answers), and a 1-page cheat sheet.", tags: ["learning", "education"] },
  { id: "s2", title: "Essay Outline", category: "Study", prompt: "Create an outline for an essay about [topic]. Include: thesis statement, 3 main arguments with supporting evidence, counterargument, and conclusion.", tags: ["writing", "academic"] },
  { id: "v1", title: "Fact Checker", category: "Safety", prompt: "Check these claims for accuracy: [list]. For each: rate confidence (high/medium/low), provide source suggestions, flag potential misinformation.", tags: ["verification", "safety"] },
  { id: "v2", title: "Scam Detector", category: "Safety", prompt: "Evaluate this message/offer for potential scam indicators: [paste text]. Check for: urgency tactics, too-good-to-be-true claims, suspicious links, identity theft risks.", tags: ["security", "privacy"] },
];

const WISDOM_QUOTES = [
  { id: "q1", text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { id: "q2", text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { id: "q3", text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { id: "q4", text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { id: "q5", text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { id: "q6", text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { id: "q7", text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { id: "q8", text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { id: "q9", text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { id: "q10", text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
];

export default function Library() {
  const [tab, setTab] = useState<Tab>("prompts");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("wisdom-favorites") || "[]"); } catch { return []; }
  });
  const navigate = useNavigate();

  const chatThreads = useMemo(() => loadChatThreads(), []);
  const snapshots = useMemo(() => loadSnapshots(), []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("wisdom-favorites", JSON.stringify(updated));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const filteredPrompts = PROMPT_PACKS.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()))
  );

  const filteredQuotes = WISDOM_QUOTES.filter(q =>
    !search || q.text.toLowerCase().includes(search.toLowerCase()) || q.author.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "prompts", label: "Prompts", icon: Sparkles },
    { id: "snapshots", label: "Snapshots", icon: Brain },
    { id: "threads", label: "Q&A", icon: MessageCircle },
    { id: "quotes", label: "Quotes", icon: Quote },
  ];

  const categories = [...new Set(filteredPrompts.map(p => p.category))];

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
                          <div className="flex gap-1 mt-1">
                            {p.tags.map(t => (
                              <span key={t} className="text-micro bg-surface-2 rounded-lg px-2 py-0.5 text-text-tertiary">{t}</span>
                            ))}
                          </div>
                          <p className="text-caption text-muted-foreground mt-2 line-clamp-2 font-mono">{p.prompt}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => copyToClipboard(p.prompt)}
                              className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-micro font-medium text-muted-foreground hover:bg-surface-hover transition-colors">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button onClick={() => navigate(`/chat?context=${encodeURIComponent(p.prompt)}&autoSend=true`)}
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

        {/* Wisdom Snapshots Tab */}
        {tab === "snapshots" && (
          snapshots.length > 0 ? (
            <div className="space-y-3">
              <p className="text-caption text-muted-foreground">{snapshots.length} wisdom cards collected</p>
              {snapshots.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-5 border-accent-gold/10 hover:border-accent-gold/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-accent-gold" />
                    <span className="section-label text-accent-gold">{s.category}</span>
                  </div>
                  <h4 className="text-body font-semibold text-foreground mb-2">{s.title}</h4>
                  {s.mentalModel && (
                    <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 mb-2">
                      <p className="text-micro font-semibold text-accent-gold mb-1">🧠 Mental Model</p>
                      <p className="text-caption text-foreground leading-relaxed">{s.mentalModel.split(".").slice(0, 2).join(".")}</p>
                    </div>
                  )}
                  <p className="text-caption text-muted-foreground mb-2">💡 {s.keyInsight}</p>
                  {s.bragLine && (
                    <p className="text-caption italic text-foreground border-t border-border pt-2 mt-2">"{s.bragLine}"</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-body text-muted-foreground">No Wisdom Snapshots yet.</p>
              <p className="text-caption text-text-tertiary mt-1">Complete lessons to collect wisdom cards.</p>
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
                onClick={() => navigate(`/chat?threadId=${t.id}`)}>
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
              <p className="text-caption text-text-tertiary mt-1">Ask AI about any lesson to start a thread.</p>
            </div>
          )
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && filteredQuotes.map((q, i) => (
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
