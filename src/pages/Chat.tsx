import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, RotateCcw, ChevronDown, Plus, History, Pencil, Trash2, Bookmark, Image, X, Brain, BarChart3, User, Target, Eye, FileText, Paperclip, Wand2, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { parseAndSaveWisdomPack } from "@/lib/wisdom-packs";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  loadChatThreads, createThread, addMessageToThread, renameThread, deleteThread, getThread,
  type ChatThread,
} from "@/lib/chat-history";
import { buildOwlContext, detectToolsUsed, type ToolUsed } from "@/lib/owl-context";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgress } from "@/hooks/useProgress";
import { QUOTES } from "@/lib/data";
import OwlIcon from "@/components/OwlIcon";
import OwlHuntTracker from "@/components/OwlHuntTracker";
import ChartRenderer, { type ChartData } from "@/components/ChartRenderer";
import { saveChart } from "@/lib/chart-storage";
import { saveGeneratedImage } from "@/lib/image-storage";
import { supabase } from "@/integrations/supabase/client";

const TUTOR_MODES = [
  { id: "fast-answer", label: "Fast", icon: "⚡" },
  { id: "default", label: "Teach Me", icon: "📖" },
  { id: "explain-10", label: "ELI10", icon: "🧒" },
  { id: "deep-dive", label: "Deep Dive", icon: "🔬" },
  { id: "blueprint", label: "Blueprint", icon: "🏗️" },
  { id: "audit", label: "Audit", icon: "🔍" },
];

const IMAGE_STYLES = [
  { id: "minimal", label: "Minimal", icon: "◻️" },
  { id: "luxury", label: "Luxury", icon: "✨" },
  { id: "diagram", label: "Diagram", icon: "📐" },
  { id: "realistic", label: "Realistic", icon: "📷" },
  { id: "futuristic", label: "Futuristic", icon: "🚀" },
  { id: "flat", label: "Flat Vector", icon: "🎨" },
];

const QUOTE_SEEN_KEY = "wisdom-daily-quote-key";

const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-image`;

// Detect if user is asking for image generation
const IMAGE_GEN_PATTERNS = [
  /\b(generate|create|make|draw|design|produce|render)\b.*\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner|concept)\b/i,
  /\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner)\b.*\b(generate|create|make|draw|design|produce|render|of|for)\b/i,
  /^(generate|create|make|draw|design)\b/i,
];

function isImageGenRequest(text: string): boolean {
  return IMAGE_GEN_PATTERNS.some(p => p.test(text));
}

function getDailyQuote(): string {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(QUOTE_SEEN_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.quote;
    } catch {}
  }
  const seenIds = JSON.parse(localStorage.getItem("wisdom-seen-quotes-v2") || "[]") as number[];
  const available = QUOTES.map((_, i) => i).filter(i => !seenIds.includes(i));
  const pick = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : Math.floor(Math.random() * QUOTES.length);
  const quote = QUOTES[pick];
  localStorage.setItem(QUOTE_SEEN_KEY, JSON.stringify({ date: today, quote }));
  if (!seenIds.includes(pick)) {
    localStorage.setItem("wisdom-seen-quotes-v2", JSON.stringify([...seenIds, pick]));
  }
  return quote;
}

function extractCharts(content: string): { text: string; charts: ChartData[] } {
  const charts: ChartData[] = [];
  const text = content.replace(/```chart\s*\n?([\s\S]*?)```/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      if (parsed.type && parsed.series) {
        charts.push(parsed as ChartData);
        return "";
      }
    } catch {}
    return _;
  });
  return { text: text.trim(), charts };
}

// Tool indicator badges — add "imagegen"
type ExtToolUsed = ToolUsed | "imagegen";

const TOOL_ICONS: Record<ExtToolUsed, { icon: React.ReactNode; label: string }> = {
  profile: { icon: <User className="h-2.5 w-2.5" />, label: "Profile" },
  memory: { icon: <Brain className="h-2.5 w-2.5" />, label: "Memory" },
  chart: { icon: <BarChart3 className="h-2.5 w-2.5" />, label: "Chart" },
  vision: { icon: <Eye className="h-2.5 w-2.5" />, label: "Vision" },
  goals: { icon: <Target className="h-2.5 w-2.5" />, label: "Goals" },
  mastery: { icon: <BarChart3 className="h-2.5 w-2.5" />, label: "Mastery" },
  imagegen: { icon: <Wand2 className="h-2.5 w-2.5" />, label: "Image Gen" },
};

function ToolBadges({ tools }: { tools: ExtToolUsed[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {tools.map(t => (
        <span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium">
          {TOOL_ICONS[t].icon} {TOOL_ICONS[t].label}
        </span>
      ))}
    </div>
  );
}

// Attachment types
type AttachmentType = "image" | "file";

interface PendingAttachment {
  file: File;
  preview: string;
  type: AttachmentType;
  name: string;
}

interface ChatMessage extends Msg {
  id: string;
  imageUrl?: string;
  imagePreview?: string;
  generatedImageUrl?: string;
  generatedPrompt?: string;
  generatedStyle?: string;
  fileName?: string;
  fileType?: AttachmentType;
  toolsUsed?: ExtToolUsed[];
}

const VISION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-vision`;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

function getAttachmentType(file: File): AttachmentType {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (IMAGE_EXTS.includes(ext) || file.type.startsWith("image/")) return "image";
  return "file";
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "📄";
  if (ext === "csv") return "📊";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["txt", "md"].includes(ext)) return "📃";
  if (ext === "json") return "🔧";
  return "📎";
}

async function uploadChatFile(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("chat-uploads").upload(path, file);
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from("chat-uploads").getPublicUrl(path);
  return data.publicUrl;
}

async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["txt", "md", "csv", "json", "xml"].includes(ext) || file.type.startsWith("text/")) {
    return await file.text();
  }
  if (ext === "pdf" || ext === "doc" || ext === "docx") {
    try {
      const text = await file.text();
      if (text.includes("%PDF") || text.charCodeAt(0) > 127) {
        return `[Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)}KB). Binary PDF — Owl is analyzing the document via vision.]`;
      }
      return text;
    } catch {
      return `[Uploaded file: ${file.name}]`;
    }
  }
  return `[Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`;
}

async function streamVision({
  messages,
  context,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: { role: string; content: string; imageUrl?: string }[];
  context?: Record<string, string>;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(VISION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, context }),
      signal,
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Request failed" }));
      onError?.(data.error || `Error ${resp.status}`);
      onDone();
      return;
    }
    if (!resp.body) { onDone(); return; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { buffer = line + "\n" + buffer; break; }
      }
    }
    onDone();
  } catch (e: any) {
    if (e.name === "AbortError") { onDone(); return; }
    onError?.(e.message || "Connection failed");
    onDone();
  }
}

async function generateImage(prompt: string, style?: string): Promise<{ imageData?: string; text?: string; error?: string }> {
  try {
    const resp = await fetch(IMAGE_GEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt, style }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { error: data.error || "Image generation failed. Try again." };
    }
    return data;
  } catch (e: any) {
    return { error: e.message || "Connection failed" };
  }
}

// Quick action chips
interface QuickAction {
  label: string;
  prompt: string;
  action?: "image" | "file" | "imagegen";
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "📷 Explain an image", prompt: "", action: "image" },
  { label: "🎨 Generate image", prompt: "", action: "imagegen" },
  { label: "📊 Chart my progress", prompt: "Chart my mastery % by category" },
  { label: "📄 Analyze a file", prompt: "", action: "file" },
  { label: "🎯 What should I learn next?", prompt: "What should I learn next based on my progress?" },
  { label: "🔥 My stats", prompt: "Show me my current stats: streak, tokens, mastery, and progress" },
];

export default function Chat() {
  const [search] = useSearchParams();
  const contextParam = search.get("context");
  const lessonIdParam = search.get("lessonId");
  const autoSendParam = search.get("autoSend");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState("fast-answer");
  const [showModes, setShowModes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [savedQuote, setSavedQuote] = useState(false);
  const [savedChartIds, setSavedChartIds] = useState<Set<string>>(new Set());
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSentRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clock = useLiveClock();
  const { profile } = useUserProfile();
  const { progress } = useProgress();
  const [dailyQuote] = useState(() => getDailyQuote());

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  useEffect(() => { setThreads(loadChatThreads()); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) addAttachment(file);
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    if (contextParam && autoSendParam === "true" && !autoSentRef.current) {
      autoSentRef.current = true;
      const decoded = decodeURIComponent(contextParam);
      setInput("");
      const thread = createThread("Lesson Q&A", lessonIdParam || undefined);
      setCurrentThreadId(thread.id);
      setTimeout(() => { sendMessage(decoded, thread.id); }, 500);
    }
  }, [contextParam, autoSendParam]);

  const addAttachment = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large (max 20MB)", variant: "destructive" });
      return;
    }
    const type = getAttachmentType(file);
    const preview = type === "image" ? URL.createObjectURL(file) : "";
    setPendingAttachments(prev => [...prev, { file, preview, type, name: file.name }]);
  };

  const removeAttachment = (idx: number) => {
    setPendingAttachments(prev => {
      const att = prev[idx];
      if (att.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Handle image generation request
  const handleImageGen = useCallback(async (prompt: string, style?: string) => {
    if (isStreaming || isGeneratingImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsGeneratingImage(true);
    setShowStylePicker(false);

    let tid = currentThreadId;
    if (!tid) {
      const thread = createThread("Image Generation");
      tid = thread.id;
      setCurrentThreadId(tid);
    }
    addMessageToThread(tid, "user", prompt);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: "assistant",
      content: "🎨 Generating your image…",
      toolsUsed: ["imagegen"],
    }]);

    const result = await generateImage(prompt, style || selectedStyle || undefined);

    if (result.error && !result.imageData) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: result.error || "Image generation failed. Try again." }
          : m
      ));
      toast({ title: "Image generation failed", description: result.error, variant: "destructive" });
    } else if (result.imageData) {
      const assistantMsg: ChatMessage = {
        id: `img-${Date.now()}`,
        role: "assistant",
        content: result.text || "Here's your generated image:",
        generatedImageUrl: result.imageData,
        generatedPrompt: prompt,
        generatedStyle: style || selectedStyle || undefined,
        toolsUsed: ["imagegen"],
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(assistantMsg));
      if (tid) {
        addMessageToThread(tid, "assistant", `[Generated image: ${prompt}]`);
        setThreads(loadChatThreads());
      }
    } else {
      // No image but got text response
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: result.text || "I couldn't generate an image from that prompt. Try rephrasing." }
          : m
      ));
    }

    setIsGeneratingImage(false);
    setSelectedStyle(null);
  }, [isStreaming, isGeneratingImage, messages, currentThreadId, selectedStyle]);

  const sendMessage = useCallback(async (text: string, threadId?: string) => {
    if ((!text.trim() && pendingAttachments.length === 0) || isStreaming || isGeneratingImage) return;

    // Check if this is an image generation request
    if (text.trim() && pendingAttachments.length === 0 && isImageGenRequest(text)) {
      await handleImageGen(text);
      return;
    }

    const attachments = [...pendingAttachments];
    const hasImage = attachments.some(a => a.type === "image");
    const hasFile = attachments.some(a => a.type === "file");
    let imageUrl: string | undefined;
    let imagePreview: string | undefined;
    let fileName: string | undefined;
    let fileType: AttachmentType | undefined;
    let fileTextContent = "";

    // Upload attachments
    if (attachments.length > 0) {
      toast({ title: `Uploading ${attachments.length} file${attachments.length > 1 ? "s" : ""}…` });
      for (const att of attachments) {
        const url = await uploadChatFile(att.file);
        if (!url) {
          toast({ title: `Upload failed: ${att.name}`, variant: "destructive" });
          return;
        }
        if (att.type === "image") {
          imageUrl = url;
          imagePreview = att.preview;
          fileType = "image";
        } else {
          const extracted = await extractFileText(att.file);
          fileTextContent += `\n\n--- File: ${att.name} ---\n${extracted}`;
          fileName = att.name;
          fileType = "file";
          imageUrl = url;
        }
      }
      setPendingAttachments([]);
    }

    let userContent = text || "";
    if (hasFile && fileTextContent) {
      userContent = (userContent || `Analyze this file: ${fileName}`) + fileTextContent;
    }
    if (hasImage && !userContent) {
      userContent = "Analyze this image";
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text || (hasImage ? "Analyze this image" : hasFile ? `Analyze: ${fileName}` : ""),
      imageUrl: hasImage ? imageUrl : undefined,
      imagePreview,
      fileName: hasFile ? fileName : undefined,
      fileType,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let tid = threadId || currentThreadId;
    if (!tid) {
      const thread = createThread("New Chat");
      tid = thread.id;
      setCurrentThreadId(tid);
    }
    addMessageToThread(tid, "user", text || (hasImage ? "📷 Image" : `📄 ${fileName || "File"}`));

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const owlContext = buildOwlContext();
    const toolsUsed: ExtToolUsed[] = detectToolsUsed(owlContext, hasImage);
    if (hasFile && !toolsUsed.includes("vision")) toolsUsed.push("vision");
    if (newMessages.some(m => m.content?.toLowerCase().includes("chart") || m.content?.toLowerCase().includes("graph"))) {
      if (!toolsUsed.includes("chart")) toolsUsed.push("chart");
    }

    const handleDelta = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent, toolsUsed } : m);
        }
        return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent, toolsUsed }];
      });
    };

    const handleDone = () => {
      setIsStreaming(false);
      abortRef.current = null;
      if (assistantContent && tid) {
        addMessageToThread(tid, "assistant", assistantContent);
        setThreads(loadChatThreads());
      }
    };

    const handleError = (err: string) => {
      toast({ title: "AI Error", description: err, variant: "destructive" });
    };

    if (hasImage && imageUrl) {
      const visionMsgs = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
      }));
      await streamVision({
        messages: visionMsgs,
        context: owlContext,
        onDelta: handleDelta,
        onDone: handleDone,
        onError: handleError,
        signal: controller.signal,
      });
    } else {
      const chatMsgs = newMessages.map(m => {
        if (m.id === userMsg.id && fileTextContent) {
          return { role: m.role, content: userContent };
        }
        return { role: m.role, content: m.content };
      });
      await streamChat({
        messages: chatMsgs,
        mode: hasFile ? "deep-dive" : mode,
        context: owlContext,
        onDelta: handleDelta,
        onDone: handleDone,
        onError: handleError,
        signal: controller.signal,
      });
    }
  }, [isStreaming, isGeneratingImage, messages, mode, currentThreadId, pendingAttachments, handleImageGen]);

  const handleSend = useCallback(() => sendMessage(input), [sendMessage, input]);
  const handleStop = () => abortRef.current?.abort();

  const handleRegenerate = useCallback(async () => {
    if (isStreaming || isGeneratingImage) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const lastUser = messages[idx];

    // If last assistant had a generated image, regenerate it
    const lastAssistant = messages[messages.length - 1];
    if (lastAssistant?.generatedPrompt) {
      const trimmed = messages.slice(0, idx + 1);
      setMessages(trimmed);
      await handleImageGen(lastAssistant.generatedPrompt, lastAssistant.generatedStyle);
      return;
    }

    const trimmed = messages.slice(0, idx + 1);
    setMessages(trimmed);
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";
    const owlContext = buildOwlContext();

    await streamChat({
      messages: trimmed.map(({ role, content }) => ({ role, content })),
      mode,
      context: owlContext,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => { setIsStreaming(false); abortRef.current = null; },
      onError: (err) => toast({ title: "AI Error", description: err, variant: "destructive" }),
      signal: controller.signal,
    });
  }, [isStreaming, isGeneratingImage, messages, mode, handleImageGen]);

  const handleNewChat = () => { setMessages([]); setCurrentThreadId(null); setShowHistory(false); setPendingAttachments([]); setShowStylePicker(false); setSelectedStyle(null); autoSentRef.current = false; };
  const handleOpenThread = (thread: ChatThread) => {
    setCurrentThreadId(thread.id);
    setMessages(thread.messages.map(m => ({ id: m.id, role: m.role, content: m.content })));
    setShowHistory(false);
  };
  const handleRename = (id: string) => { if (renameValue.trim()) { renameThread(id, renameValue.trim()); setThreads(loadChatThreads()); } setRenamingId(null); };
  const handleDelete = (id: string) => { deleteThread(id); setThreads(loadChatThreads()); if (currentThreadId === id) handleNewChat(); };

  const handleSaveQuote = () => {
    const saved = JSON.parse(localStorage.getItem("wisdom-saved-quotes") || "[]");
    if (!saved.includes(dailyQuote)) { saved.push(dailyQuote); localStorage.setItem("wisdom-saved-quotes", JSON.stringify(saved)); setSavedQuote(true); toast({ title: "Quote saved!" }); }
  };

  const handleSaveChart = (chart: ChartData, msgId: string) => {
    saveChart(chart); setSavedChartIds(prev => new Set([...prev, msgId])); toast({ title: "📊 Chart saved to Library!" });
  };

  const handleSaveImage = (imageUrl: string, prompt: string, style?: string) => {
    saveGeneratedImage({ imageData: imageUrl, prompt, style });
    toast({ title: "🖼️ Image saved to Library!" });
  };

  const handleDownloadImage = (imageUrl: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `owl-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    a.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addAttachment);
    e.target.value = "";
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.action === "image" || action.action === "file") {
      fileInputRef.current?.click();
      return;
    }
    if (action.action === "imagegen") {
      setShowStylePicker(true);
      inputRef.current?.focus();
      return;
    }
    if (action.prompt) {
      setInput(action.prompt);
      setTimeout(() => sendMessage(action.prompt), 100);
    }
  };

  const handleImageGenVariation = (prompt: string, variation: string) => {
    let newPrompt = prompt;
    if (variation === "minimal") newPrompt = `${prompt}, minimalist style, clean and simple`;
    else if (variation === "detailed") newPrompt = `${prompt}, highly detailed, intricate`;
    else if (variation === "different") newPrompt = `${prompt}, alternative version, different approach`;
    handleImageGen(newPrompt);
  };

  const currentMode = TUTOR_MODES.find(m => m.id === mode) || TUTOR_MODES[0];
  const hasMessages = messages.length > 0;
  const isBusy = isStreaming || isGeneratingImage;

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === "user") {
      return (
        <>
          {msg.imagePreview && (
            <img src={msg.imagePreview} alt="Upload" className="rounded-xl max-h-40 w-auto mb-2" />
          )}
          {msg.imageUrl && !msg.imagePreview && msg.fileType !== "file" && (
            <img src={msg.imageUrl} alt="Upload" className="rounded-xl max-h-40 w-auto mb-2" />
          )}
          {msg.fileName && (
            <div className="flex items-center gap-2 mb-2 rounded-lg bg-primary-foreground/10 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="text-caption truncate">{msg.fileName}</span>
            </div>
          )}
          {msg.content && <p>{msg.content}</p>}
        </>
      );
    }

    const { text, charts } = extractCharts(msg.content);
    return (
      <>
        {/* Generated image */}
        {msg.generatedImageUrl && (
          <div className="mb-3">
            <img src={msg.generatedImageUrl} alt={msg.generatedPrompt || "Generated"} className="rounded-xl max-w-full w-full" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button onClick={() => handleSaveImage(msg.generatedImageUrl!, msg.generatedPrompt || "", msg.generatedStyle)}
                className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] text-primary font-medium hover:bg-primary/20 transition-colors">
                💾 Save
              </button>
              <button onClick={() => handleDownloadImage(msg.generatedImageUrl!, msg.generatedPrompt || "")}
                className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] text-primary font-medium hover:bg-primary/20 transition-colors">
                <Download className="h-3 w-3 inline mr-0.5" /> Download
              </button>
              <button onClick={() => handleImageGen(msg.generatedPrompt || "")}
                className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground font-medium hover:bg-surface-hover transition-colors">
                🔄 Regenerate
              </button>
              <button onClick={() => handleImageGenVariation(msg.generatedPrompt || "", "minimal")}
                className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground font-medium hover:bg-surface-hover transition-colors">
                ◻️ More minimal
              </button>
              <button onClick={() => handleImageGenVariation(msg.generatedPrompt || "", "detailed")}
                className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground font-medium hover:bg-surface-hover transition-colors">
                ✨ More detailed
              </button>
            </div>
          </div>
        )}

        {/* Loading state for image gen */}
        {msg.content === "🎨 Generating your image…" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-caption">Generating your image…</span>
          </div>
        )}

        {/* Text content */}
        {text && msg.content !== "🎨 Generating your image…" && (
          <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:rounded-xl [&_strong]:text-foreground">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
        {charts.map((chart, i) => (
          <ChartRenderer key={`${msg.id}-chart-${i}`} data={chart}
            onSave={() => handleSaveChart(chart, `${msg.id}-${i}`)} saved={savedChartIds.has(`${msg.id}-${i}`)} />
        ))}
        {msg.toolsUsed && <ToolBadges tools={msg.toolsUsed} />}
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <OwlIcon size={20} />
          <span className="font-display text-lg font-bold text-foreground">Owl</span>
        </div>
        <div className="flex items-center gap-2">
          <OwlHuntTracker />
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <span>✦ {progress.tokens}</span><span>·</span><span>🔥 {progress.streak}</span>
          </div>
          <button onClick={() => { setThreads(loadChatThreads()); setShowHistory(!showHistory); }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chat History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card">
            <div className="px-5 py-3 max-h-64 overflow-y-auto hide-scrollbar">
              <p className="section-label mb-2">Chat History</p>
              {threads.length === 0 ? (
                <p className="text-caption text-muted-foreground py-4 text-center">No saved chats yet.</p>
              ) : (
                <div className="space-y-1">
                  {threads.slice(0, 20).map(t => (
                    <div key={t.id} className={`rounded-xl p-3 flex items-center gap-2 transition-all cursor-pointer ${
                      currentThreadId === t.id ? "bg-primary/10 border border-primary/20" : "bg-surface-2 hover:bg-surface-hover"}`}>
                      {renamingId === t.id ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(t.id)} onKeyDown={e => e.key === "Enter" && handleRename(t.id)}
                          className="flex-1 bg-transparent text-caption text-foreground outline-none" autoFocus />
                      ) : (
                        <button onClick={() => handleOpenThread(t)} className="flex-1 text-left min-w-0">
                          <p className="text-caption font-medium text-foreground truncate">{t.title}</p>
                          <p className="text-micro text-muted-foreground">{t.messages.length} msgs · {new Date(t.updatedAt).toLocaleDateString()}</p>
                        </button>
                      )}
                      <button onClick={() => { setRenamingId(t.id); setRenameValue(t.title); }}
                        className="shrink-0 p-1 rounded-lg hover:bg-surface-hover"><Pencil className="h-3 w-3 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(t.id)}
                        className="shrink-0 p-1 rounded-lg hover:bg-destructive/10"><Trash2 className="h-3 w-3 text-text-tertiary" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 hide-scrollbar">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
              <p className="font-display text-xl font-bold text-foreground">{displayGreeting}</p>
              <p className="text-micro text-muted-foreground mt-1">{clock.dateStr} · {clock.timeStr}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="w-full max-w-sm mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-caption italic text-muted-foreground leading-relaxed">"{dailyQuote}"</p>
                <button onClick={handleSaveQuote}
                  className={`mt-2 text-micro font-medium transition-colors ${savedQuote ? "text-accent-gold" : "text-text-tertiary hover:text-muted-foreground"}`}>
                  <Bookmark className="h-3 w-3 inline mr-1" />{savedQuote ? "Saved" : "Save"}
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="w-full max-w-sm mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} onClick={() => handleQuickAction(action)}
                    className="rounded-xl bg-surface-2 px-3 py-2 text-micro text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all">
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button onClick={() => setShowModes(!showModes)}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
                <span>{currentMode.icon}</span><span>{currentMode.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showModes ? "rotate-180" : ""}`} />
              </button>
            </motion.div>
            <AnimatePresence>
              {showModes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2">
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                    {TUTOR_MODES.map((m) => (
                      <button key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }}
                        className={`rounded-xl px-3 py-1.5 text-micro font-medium transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {hasMessages && (
          <>
            {!showModes && (
              <div className="flex justify-center mb-2">
                <button onClick={() => setShowModes(!showModes)}
                  className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-micro text-muted-foreground hover:bg-surface-hover transition-colors">
                  <span>{currentMode.icon}</span> <span>{currentMode.label}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            <AnimatePresence>
              {showModes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {TUTOR_MODES.map((m) => (
                      <button key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }}
                        className={`rounded-xl px-3 py-1.5 text-micro font-medium transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                      <OwlIcon size={16} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-body leading-relaxed ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                  }`}>
                    {renderMessageContent(msg)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                  <OwlIcon size={16} />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {isStreaming && (
        <div className="flex justify-center pb-2">
          <button onClick={handleStop} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <Square className="h-3 w-3" /> Stop
          </button>
        </div>
      )}
      {!isBusy && hasMessages && messages[messages.length - 1]?.role === "assistant" && (
        <div className="flex justify-center pb-2">
          <button onClick={handleRegenerate} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-caption text-muted-foreground hover:bg-surface-hover transition-colors">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      )}

      {/* Style Picker for Image Gen */}
      <AnimatePresence>
        {showStylePicker && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-micro text-muted-foreground">Image style (optional):</span>
              <button onClick={() => setShowStylePicker(false)} className="ml-auto p-1 rounded hover:bg-surface-hover">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_STYLES.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(selectedStyle === s.id ? null : s.id)}
                  className={`rounded-xl px-3 py-1.5 text-micro font-medium transition-all ${
                    selectedStyle === s.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="px-5 pb-2">
          <div className="flex gap-2 flex-wrap">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative">
                {att.type === "image" ? (
                  <img src={att.preview} alt={att.name} className="h-16 rounded-xl border border-border" />
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2">
                    <span className="text-sm">{getFileIcon(att.name)}</span>
                    <span className="text-micro text-muted-foreground truncate max-w-[120px]">{att.name}</span>
                  </div>
                )}
                <button onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-5 py-3 pb-24 bg-background">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.md,.json,.xml"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors"
            title="Attach image or file">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowStylePicker(!showStylePicker)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              showStylePicker || selectedStyle ? "bg-primary/10 text-primary" : "bg-surface-2 hover:bg-surface-hover text-muted-foreground"
            }`}
            title="Generate image">
            <Wand2 className="h-4 w-4" />
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={showStylePicker ? "Describe the image you want…" : "Ask Owl anything… or attach a file"}
            className="flex-1 bg-transparent text-body text-foreground placeholder:text-text-tertiary outline-none" />
          <button onClick={handleSend} disabled={(!input.trim() && pendingAttachments.length === 0) || isBusy}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
