import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, RotateCcw, Plus, History, Pencil, Trash2, Bookmark, X, Wand2, Download, Loader2, Globe, FileDown, Search, Shield, Paperclip, ChevronDown, FileText, AlertCircle } from "lucide-react";
import VoiceChat from "@/components/VoiceChat";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/ai-stream";
import { parseAndSaveWisdomPack } from "@/lib/wisdom-packs";
import { routeToTool, TOOL_LABELS, WEB_SUB_LABELS, STRATEGIC_LABELS, type OwlTool, type StrategicType } from "@/lib/tool-router";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  loadChatThreads, createThread, addMessageToThread, renameThread, deleteThread,
  type ChatThread,
} from "@/lib/chat-history";
import { buildOwlContext, detectToolsUsed } from "@/lib/owl-context";
import { getRecommendationContext } from "@/lib/analytics-engine";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgress } from "@/hooks/useProgress";
import { QUOTES } from "@/lib/data";
import OwlIcon from "@/components/OwlIcon";
import ChartRenderer, { type ChartData } from "@/components/ChartRenderer";
import { saveChart } from "@/lib/chart-storage";
import { saveGeneratedImage } from "@/lib/image-storage";
import { persistGeneratedImage, persistChatUpload } from "@/lib/asset-storage";
import { supabase } from "@/integrations/supabase/client";
import { resolvePersona, personaToSystemHint } from "@/lib/owl-persona";

// ===== CONSTANTS =====

const TUTOR_MODES = [
  { id: "default", label: "Operator", icon: "🦉" },
  { id: "fast-answer", label: "Fast", icon: "⚡" },
  { id: "teach-me", label: "Teach Me", icon: "📖" },
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
const WEB_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owl-web-search`;
const DOC_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owl-generate-doc`;
const STRATEGIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owl-strategic-analysis`;
const VISION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-vision`;

const IMAGE_GEN_PATTERNS = [
  /\b(generate|create|make|draw|design|produce|render|build)\b.*\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner|concept|screenshot|wireframe)\b/i,
  /\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner|concept)\b.*\b(generate|create|make|draw|design|produce|render|of|for)\b/i,
  /^(generate|create|make|draw|design)\s/i,
  /\b(logo|icon|mockup|flowchart|illustration|diagram)\s+(for|of|about|showing|depicting)\b/i,
];

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

const QUICK_CHIPS = [
  { label: "🌐 Search the web", prompt: "Search the web for the latest AI news today" },
  { label: "🎯 What should I learn?", prompt: "What should I learn next based on my progress?" },
  { label: "📊 Chart my progress", prompt: "Chart my mastery % by category" },
  { label: "🔥 Market heat check", prompt: "Is building AI automation agencies getting crowded right now?" },
];

// ===== TYPES =====

type AttachmentType = "image" | "file";

interface PendingAttachment {
  file: File;
  preview: string;
  type: AttachmentType;
  name: string;
  uploading?: boolean;
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
  toolsUsed?: string[];
  citations?: string[];
  docDownload?: { content: string; fileName: string; mimeType: string; format: string };
  webSource?: string;
  confidence?: string;
  strategicType?: string;
  sitesReviewed?: string[];
  error?: boolean;
  retryPayload?: { text: string; threadId?: string };
}

// ===== HELPERS =====

function isImageGenRequest(text: string): boolean {
  if (/^(what|how|why|can you|do you|are you)\b/i.test(text) && !/\b(generate|create|make|draw|design)\b/i.test(text)) return false;
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
      if (parsed.type && parsed.series) { charts.push(parsed as ChartData); return ""; }
    } catch {}
    return _;
  });
  return { text: text.trim(), charts };
}

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
  return "📎";
}

const UPLOAD_TIMEOUT_MS = 30_000;
const AUTH_SESSION_LOOKUP_TIMEOUT_MS = 2_000;
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FILE_EXTS = ["pdf", "txt", "md", "csv", "json", "xml", "doc", "docx"];

function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE) return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 20MB.`;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isImage = file.type.startsWith("image/") || IMAGE_EXTS.includes(ext);
  if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type) && !IMAGE_EXTS.includes(ext)) {
    return `Unsupported image format. Use JPEG, PNG, WebP, or GIF.`;
  }
  if (!isImage && !ALLOWED_FILE_EXTS.includes(ext)) {
    return `Unsupported file type (.${ext}). Supported: PDF, TXT, MD, CSV, JSON, XML, DOC, DOCX.`;
  }
  return null;
}

interface UploadDebugInfo {
  endpoint: string;
  bucket: string;
  path: string;
  status: number | null;
  shortError: string;
  rawError?: string;
}

interface UploadResult {
  url: string | null;
  error?: string;
  status?: number | null;
  endpoint?: string;
  debug?: UploadDebugInfo;
}

interface UploadAuthContext {
  accessToken: string | null;
  userId: string | null;
  authSource: "session" | "localStorage" | "none";
  rawError?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function decodeJwtSub(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = typeof window !== "undefined" ? window.atob(payload) : null;
    if (!decoded) return null;
    const parsed = JSON.parse(decoded);
    return typeof parsed?.sub === "string" ? parsed.sub : null;
  } catch {
    return null;
  }
}

function extractAccessTokenFromStoredAuth(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.access_token === "string" && parsed.access_token) return parsed.access_token;
    if (typeof parsed?.currentSession?.access_token === "string" && parsed.currentSession.access_token) {
      return parsed.currentSession.access_token;
    }
    if (typeof parsed?.session?.access_token === "string" && parsed.session.access_token) {
      return parsed.session.access_token;
    }
  } catch {
    // ignore malformed local storage payloads
  }
  return null;
}

function getAccessTokenFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim();
  const knownKey = projectId ? `sb-${projectId}-auth-token` : null;
  const discoveredKeys = Object.keys(localStorage).filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
  const keys = Array.from(new Set([knownKey, ...discoveredKeys].filter(Boolean))) as string[];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const token = extractAccessTokenFromStoredAuth(raw);
    if (token) return token;
  }

  return null;
}

async function resolveUploadAuth(): Promise<UploadAuthContext> {
  const localToken = getAccessTokenFromLocalStorage();
  const localUserId = decodeJwtSub(localToken);

  try {
    const sessionResult = await withTimeout(
      supabase.auth.getSession(),
      AUTH_SESSION_LOOKUP_TIMEOUT_MS,
      "Auth session check timed out while preparing upload.",
    );

    const sessionToken = sessionResult.data.session?.access_token || null;
    const sessionUserId = sessionResult.data.session?.user?.id || decodeJwtSub(sessionToken);

    if (sessionToken) {
      return {
        accessToken: sessionToken,
        userId: sessionUserId,
        authSource: "session",
      };
    }
  } catch (e: any) {
    if (localToken) {
      return {
        accessToken: localToken,
        userId: localUserId,
        authSource: "localStorage",
        rawError: e?.message || "Auth session lookup failed",
      };
    }

    return {
      accessToken: null,
      userId: null,
      authSource: "none",
      rawError: e?.message || "Auth session lookup failed",
    };
  }

  if (localToken) {
    return {
      accessToken: localToken,
      userId: localUserId,
      authSource: "localStorage",
    };
  }

  return {
    accessToken: null,
    userId: null,
    authSource: "none",
  };
}

function mapUploadError({
  status,
  rawError,
  timedOut,
  networkError,
}: {
  status: number | null;
  rawError?: string;
  timedOut?: boolean;
  networkError?: boolean;
}): string {
  const raw = (rawError || "").toLowerCase();

  if (timedOut) return "Upload timed out, please try again.";
  if (status === 401 || status === 403 || raw.includes("row-level security") || raw.includes("jwt")) {
    return "Upload not authorized – check storage auth/config.";
  }
  if (status === 404 || raw.includes("bucket") && raw.includes("not")) {
    return "Upload target not found – bucket/path is wrong.";
  }

  if (networkError || status === 0 || status === null) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "No connection – check internet and try again.";
    }
    if (raw.includes("cors") || raw.includes("blocked")) {
      return "Upload blocked by CORS / permissions; check storage settings.";
    }
    return "Network error during upload. Please try again.";
  }

  if (rawError?.trim()) return `Upload error: ${rawError.trim().slice(0, 180)}`;
  return `Upload failed with status ${status}.`;
}

/**
 * Upload flow summary:
 * - Uses Lovable Cloud storage REST endpoint: /storage/v1/object/chat-uploads/{path}
 * - Uses access token from session when available, with localStorage fallback to avoid pre-request auth timeouts
 * - Always sends the upload request (token when available), logs endpoint/status/error, and returns mapped UI-safe errors
 */
async function uploadChatFile(
  file: File,
  onProgress?: (pct: number) => void,
  onDebug?: (debug: UploadDebugInfo) => void,
): Promise<UploadResult> {
  const storageBaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const bucket = "chat-uploads";
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  let path = `uploads/${fileName}`;
  let endpoint = `${storageBaseUrl || ""}/storage/v1/object/${bucket}/${path}`;

  const reportDebug = (status: number | null, shortError: string, rawError?: string): UploadDebugInfo => {
    const debug: UploadDebugInfo = { endpoint, bucket, path, status, shortError, rawError };
    onDebug?.(debug);
    return debug;
  };

  console.log("[Upload] Starting upload", {
    endpoint,
    bucket,
    path,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  if (!storageBaseUrl || !publishableKey) {
    const error = "Upload config missing – storage URL or API key is empty.";
    const debug = reportDebug(null, error, error);
    console.error("[Upload] Config error", debug);
    return { url: null, error, status: null, endpoint, debug };
  }

  if (!file.size || file.size === 0) {
    const error = "File is empty (0 bytes).";
    const debug = reportDebug(null, error, error);
    console.error("[Upload] File error", debug);
    return { url: null, error, status: null, endpoint, debug };
  }

  onProgress?.(0);

  const auth = await resolveUploadAuth();
  if (auth.userId) path = `${auth.userId}/${fileName}`;
  endpoint = `${storageBaseUrl}/storage/v1/object/${bucket}/${path}`;

  if (auth.rawError) {
    console.warn("[Upload] Session lookup fallback", {
      endpoint,
      bucket,
      path,
      authSource: auth.authSource,
      rawError: auth.rawError,
    });
  }

  console.log("[Upload] Auth context", {
    endpoint,
    bucket,
    path,
    authSource: auth.authSource,
    hasAccessToken: Boolean(auth.accessToken),
    userId: auth.userId || "anonymous",
  });
  type XhrUploadResult = {
    status: number;
    responseText: string;
    timedOut: boolean;
    networkError: boolean;
  };

  const xhrResult = await new Promise<XhrUploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader("apikey", publishableKey);
    if (auth.accessToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${auth.accessToken}`);
    }
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.max(1, Math.min(95, Math.round((event.loaded / event.total) * 95)));
        onProgress?.(pct);
      } else {
        onProgress?.(10);
      }
    };

    xhr.onload = () => resolve({ status: xhr.status, responseText: xhr.responseText || "", timedOut: false, networkError: false });
    xhr.onerror = () => resolve({ status: xhr.status || 0, responseText: xhr.responseText || "", timedOut: false, networkError: true });
    xhr.ontimeout = () => resolve({ status: xhr.status || 0, responseText: xhr.responseText || "", timedOut: true, networkError: false });
    xhr.onabort = () => resolve({ status: xhr.status || 0, responseText: xhr.responseText || "", timedOut: true, networkError: false });

    xhr.send(file);
  });

  let backendMessage = "";
  try {
    const parsed = xhrResult.responseText ? JSON.parse(xhrResult.responseText) : null;
    backendMessage = parsed?.error || parsed?.message || "";
  } catch {
    backendMessage = xhrResult.responseText || "";
  }

  console.log("[Upload] Upload response", {
    endpoint,
    bucket,
    path,
    status: xhrResult.status,
    backendMessage,
  });

  if (xhrResult.timedOut || xhrResult.networkError || xhrResult.status < 200 || xhrResult.status >= 300) {
    const error = mapUploadError({
      status: xhrResult.status || null,
      rawError: backendMessage,
      timedOut: xhrResult.timedOut,
      networkError: xhrResult.networkError,
    });
    const debug = reportDebug(xhrResult.status || null, error, backendMessage);
    console.error("[Upload] Upload failed", debug);
    return { url: null, error, status: xhrResult.status || null, endpoint, debug };
  }

  onProgress?.(100);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const debug = reportDebug(xhrResult.status, "OK", backendMessage || "success");
  console.log("[Upload] Success", { endpoint, status: xhrResult.status, publicUrl: data.publicUrl });
  return { url: data.publicUrl, status: xhrResult.status, endpoint, debug };
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

async function streamVision({ messages, context, onDelta, onDone, onError, signal }: {
  messages: { role: string; content: string; imageUrl?: string }[];
  context?: Record<string, string>;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: string) => void;
  signal?: AbortSignal;
}) {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(VISION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages, context }),
        signal,
      });
      if (!resp.ok) {
        if (attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1500)); continue; }
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
      return;
    } catch (e: any) {
      if (e.name === "AbortError") { onDone(); return; }
      if (attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1500)); continue; }
      onError?.(e.message || "Connection failed");
      onDone();
    }
  }
}

async function generateImage(prompt: string, style?: string): Promise<{ imageData?: string; text?: string; error?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(IMAGE_GEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (attempt === 0 && resp.status >= 500) { await new Promise(r => setTimeout(r, 1500)); continue; }
        return { error: data.error || "Image generation failed." };
      }
      return data;
    } catch (e: any) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
      return { error: e.message || "Connection failed" };
    }
  }
  return { error: "Image generation failed after retries." };
}

async function webSearch(query: string, type?: string, url?: string): Promise<{ content: string; citations: string[]; source: string; note?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(WEB_SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ query, type, url }),
      });
      const data = await resp.json();
      if (data.success) return { content: data.content, citations: data.citations || [], source: data.source || "web", note: data.note };
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1000)); continue; }
      return { content: data.error || "Web search unavailable.", citations: [], source: "error" };
    } catch (e: any) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1000)); continue; }
      return { content: e.message || "Connection failed", citations: [], source: "error" };
    }
  }
  return { content: "Web search failed.", citations: [], source: "error" };
}

async function strategicAnalysis(type: string, query: string, url?: string, context?: Record<string, string>) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(STRATEGIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ type, query, url, context }),
      });
      const data = await resp.json();
      if (data.success) return {
        analysis: data.analysis,
        toolsUsed: data.toolsUsed || [],
        citations: data.citations || [],
        sitesReviewed: data.sitesReviewed || [],
        confidence: data.confidence || "low",
      };
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
      return { analysis: data.error || "Analysis failed.", toolsUsed: [], citations: [], sitesReviewed: [], confidence: "low" as const };
    } catch (e: any) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
      return { analysis: e.message || "Connection failed", toolsUsed: [], citations: [], sitesReviewed: [], confidence: "low" as const };
    }
  }
  return { analysis: "Analysis failed.", toolsUsed: [], citations: [], sitesReviewed: [], confidence: "low" as const };
}

async function generateDoc(prompt: string, format: string, context?: Record<string, string>) {
  try {
    const resp = await fetch(DOC_GEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ prompt, format, context }),
    });
    return await resp.json();
  } catch (e: any) {
    return { success: false, error: e.message || "Connection failed" };
  }
}

function tryCalculate(text: string): string | null {
  const mathMatch = text.match(/(?:calculate|compute|what is|how much is)\s+([\d\s\+\-\*\/\.\(\)\%\^]+)/i);
  if (!mathMatch) {
    const rawMatch = text.match(/^[\d\s\+\-\*\/\.\(\)\%\^]+$/);
    if (!rawMatch) return null;
  }
  try {
    const expr = (mathMatch?.[1] || text).replace(/\^/g, "**").replace(/%/g, "/100");
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result === "number" && isFinite(result)) return `**Result:** ${result.toLocaleString()}`;
  } catch {}
  return null;
}

// ===== TOOL BADGES =====

const TOOL_ICON_MAP: Record<string, string> = {
  profile: "👤", memory: "🧠", chart: "📊", vision: "👁️", goals: "🎯", mastery: "📈",
  imagegen: "🎨", web: "🌐", perplexity: "🔍", firecrawl: "🔥", strategic: "🧠",
  docgen: "📄", calculator: "🧮", reminder: "⏰", localtime: "🕐", chat: "💬", "ai-knowledge": "🧠",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-green-400", medium: "text-yellow-400", low: "text-muted-foreground",
};

function ToolBadges({ tools, confidence, sourcesCount }: { tools: string[]; confidence?: string; sourcesCount?: number }) {
  if (tools.length === 0 && !confidence) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2 items-center">
      {tools.map(t => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary/80 font-medium">
          {TOOL_ICON_MAP[t] || "🔧"} {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
        </span>
      ))}
      {confidence && (
        <span className={`inline-flex items-center gap-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_COLORS[confidence] || "text-muted-foreground"}`}>
          <Shield className="h-2.5 w-2.5" /> {confidence}
        </span>
      )}
      {sourcesCount && sourcesCount > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
          📎 {sourcesCount} source{sourcesCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function Chat() {
  const [search] = useSearchParams();
  const contextParam = search.get("context");
  const lessonIdParam = search.get("lessonId");
  const autoSendParam = search.get("autoSend");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState("default");
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastUploadDebug, setLastUploadDebug] = useState<UploadDebugInfo | null>(null);
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
      let decoded: string;
      try { decoded = decodeURIComponent(contextParam); } catch { decoded = contextParam; }
      setInput("");
      const thread = createThread("Lesson Q&A", lessonIdParam || undefined);
      setCurrentThreadId(thread.id);
      setTimeout(() => { sendMessage(decoded, thread.id); }, 500);
    }
  }, [contextParam, autoSendParam]);

  const addAttachment = (file: File) => {
    const validationError = validateUploadFile(file);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
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

  // ===== IMAGE GENERATION =====
  const handleImageGen = useCallback(async (prompt: string, style?: string) => {
    if (isStreaming || isGeneratingImage) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: prompt };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsGeneratingImage(true);
    setShowStylePicker(false);

    let tid = currentThreadId;
    if (!tid) { const thread = createThread("Image Generation"); tid = thread.id; setCurrentThreadId(tid); }
    addMessageToThread(tid, "user", prompt);

    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: "🎨 Generating your image…", toolsUsed: ["imagegen"] }]);

    const result = await generateImage(prompt, style || selectedStyle || undefined);

    if (result.error && !result.imageData) {
      setMessages(prev => prev.map(m => m.id === loadingId
        ? { ...m, content: `Image generation failed: ${result.error}`, error: true, retryPayload: { text: prompt } }
        : m));
    } else if (result.imageData) {
      const assistantMsg: ChatMessage = {
        id: `img-${Date.now()}`, role: "assistant",
        content: result.text || "Here's your generated image:",
        generatedImageUrl: result.imageData, generatedPrompt: prompt,
        generatedStyle: style || selectedStyle || undefined, toolsUsed: ["imagegen"],
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(assistantMsg));
      if (tid) { addMessageToThread(tid, "assistant", `[Generated image: ${prompt}]`); setThreads(loadChatThreads()); }
    } else {
      setMessages(prev => prev.map(m => m.id === loadingId
        ? { ...m, content: result.text || "Couldn't generate an image from that prompt. Try rephrasing." }
        : m));
    }

    setIsGeneratingImage(false);
    setSelectedStyle(null);
  }, [isStreaming, isGeneratingImage, messages, currentThreadId, selectedStyle]);

  // ===== SEND MESSAGE =====
  const sendMessage = useCallback(async (text: string, threadId?: string) => {
    if ((!text.trim() && pendingAttachments.length === 0) || isStreaming || isGeneratingImage) return;

    const attachments = [...pendingAttachments];
    const hasImage = attachments.some(a => a.type === "image");
    const hasFile = attachments.some(a => a.type === "file");
    const route = routeToTool(text, hasImage, hasFile);

    // Image generation
    if (route.tool === "imagegen" && !hasImage && !hasFile) {
      await handleImageGen(text);
      return;
    }

    // Local time
    if (route.tool === "localtime" && !hasImage && !hasFile) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
      const dateStr = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = `It's **${timeStr}** on **${dateStr}**.\n\nTimezone: ${tz}`;
      const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
      const assistantMsg: ChatMessage = { id: `time-${Date.now()}`, role: "assistant", content: response, toolsUsed: ["localtime"] };
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setInput("");
      let tid = threadId || currentThreadId;
      if (!tid) { const t = createThread("Time Check"); tid = t.id; setCurrentThreadId(tid); }
      addMessageToThread(tid, "user", text);
      addMessageToThread(tid, "assistant", response);
      setThreads(loadChatThreads());
      return;
    }

    // Calculator
    if (route.tool === "calculator" && !hasImage && !hasFile) {
      const calcResult = tryCalculate(text);
      if (calcResult) {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
        const assistantMsg: ChatMessage = { id: `calc-${Date.now()}`, role: "assistant", content: calcResult, toolsUsed: ["calculator"] };
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput("");
        let tid = threadId || currentThreadId;
        if (!tid) { const t = createThread("Calculation"); tid = t.id; setCurrentThreadId(tid); }
        addMessageToThread(tid, "user", text);
        addMessageToThread(tid, "assistant", calcResult);
        setThreads(loadChatThreads());
        return;
      }
    }

    let imageUrl: string | undefined;
    let imagePreview: string | undefined;
    let fileName: string | undefined;
    let fileType: AttachmentType | undefined;
    let fileTextContent = "";

    // Upload attachments with progress
    if (attachments.length > 0) {
      setIsUploading(true);
      setLastUploadDebug(null);
      setUploadProgress(0);

      try {
        for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
          const result = await uploadChatFile(
            att.file,
            (pct) => {
              setUploadProgress(Math.round((i / attachments.length + pct / 100 / attachments.length) * 100));
            },
            (debug) => setLastUploadDebug(debug),
          );

          if (!result.url) {
            toast({
              title: "Upload error",
              description: result.error || "Upload failed. Please try again.",
              variant: "destructive",
            });
            return;
          }

          if (att.type === "image") {
            imageUrl = result.url;
            imagePreview = att.preview;
            fileType = "image";
          } else {
            const extracted = await extractFileText(att.file);
            fileTextContent += `\n\n--- File: ${att.name} ---\n${extracted}`;
            fileName = att.name;
            fileType = "file";
            imageUrl = result.url;
          }
        }

        setUploadProgress(100);
        setPendingAttachments([]);
      } catch (e: any) {
        console.error("Upload error:", e);
        toast({
          title: "Upload error",
          description: e?.message || "Upload failed. Check your connection and try again.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(null), 250);
      }
    }

    let userContent = text || "";
    if (hasFile && fileTextContent) {
      userContent = (userContent || `Analyze this file: ${fileName}`) + fileTextContent;
    }
    if (hasImage && !userContent) userContent = "Analyze this image";

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user",
      content: text || (hasImage ? "Analyze this image" : hasFile ? `Analyze: ${fileName}` : ""),
      imageUrl: hasImage ? imageUrl : undefined, imagePreview,
      fileName: hasFile ? fileName : undefined, fileType,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let tid = threadId || currentThreadId;
    if (!tid) { const thread = createThread("New Chat"); tid = thread.id; setCurrentThreadId(tid); }
    addMessageToThread(tid, "user", text || (hasImage ? "📷 Image" : `📄 ${fileName || "File"}`));

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const owlContext = buildOwlContext({ screen: "/" });
    owlContext.recommendation_context = getRecommendationContext();

    // Adaptive persona modulation
    const scores = progress.masteryScores || {};
    const mVals = Object.values(scores) as number[];
    const masteryAvg = mVals.length ? Math.round(mVals.reduce((a, b) => a + b, 0) / mVals.length) : 0;
    const persona = resolvePersona({
      screen: "/", masteryAvg, streak: progress.streak,
      hasActiveGoal: !!owlContext.learning_goal, lessonsToday: progress.lessonsToday,
      messageCount: messages.length,
    });
    owlContext.persona_hint = personaToSystemHint(persona);
    const toolsUsed: string[] = detectToolsUsed(owlContext, hasImage);
    if (hasFile && !toolsUsed.includes("vision")) toolsUsed.push("vision");
    if (route.tool === "web") toolsUsed.push("web");
    if (route.tool === "docgen") toolsUsed.push("docgen");

    // === STRATEGIC ANALYSIS ===
    if (route.tool === "strategic" && !hasImage && !hasFile) {
      const sType = route.strategicType || "market-heat";
      const sLabel = STRATEGIC_LABELS[sType as StrategicType]?.label || "Strategic Analysis";
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: `🧠 Running ${sLabel}…`, toolsUsed: ["strategic"] }]);

      const result = await strategicAnalysis(sType, text, route.extractedUrl, owlContext);

      let responseContent = result.analysis;
      if (result.citations.length > 0) responseContent += "\n\n**Sources:**\n" + result.citations.map((c, i) => `${i + 1}. ${c}`).join("\n");
      if (result.sitesReviewed.length > 0) responseContent += "\n\n**Sites Reviewed:**\n" + result.sitesReviewed.map((s, i) => `${i + 1}. ${s}`).join("\n");

      const strategicMsg: ChatMessage = {
        id: `strategic-${Date.now()}`, role: "assistant", content: responseContent,
        toolsUsed: result.toolsUsed.length > 0 ? result.toolsUsed : ["ai-knowledge"],
        citations: result.citations, confidence: result.confidence,
        strategicType: sType, sitesReviewed: result.sitesReviewed,
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(strategicMsg));
      setIsStreaming(false);
      abortRef.current = null;
      if (tid) { addMessageToThread(tid, "assistant", responseContent); setThreads(loadChatThreads()); }
      return;
    }

    // === FIRECRAWL ===
    if (route.tool === "firecrawl" && route.extractedUrl && !hasImage && !hasFile) {
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: "🔥 Scraping website…", toolsUsed: ["firecrawl"] }]);

      const result = await webSearch(text, "scrape", route.extractedUrl);
      let responseContent = result.content;
      if (result.citations.length > 0) responseContent += "\n\n**Source:** " + result.citations.join(", ");

      const scrapeMsg: ChatMessage = {
        id: `firecrawl-${Date.now()}`, role: "assistant", content: responseContent,
        toolsUsed: ["firecrawl"], citations: result.citations,
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(scrapeMsg));
      setIsStreaming(false);
      abortRef.current = null;
      if (tid) { addMessageToThread(tid, "assistant", responseContent); setThreads(loadChatThreads()); }
      return;
    }

    // === WEB SEARCH ===
    if (route.tool === "web" && !hasImage && !hasFile) {
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: "🌐 Searching the web…", toolsUsed: ["web"] }]);

      const webResult = await webSearch(text, route.subType);
      let responseContent = webResult.content;
      if (webResult.citations.length > 0) responseContent += "\n\n**Sources:**\n" + webResult.citations.map((c, i) => `${i + 1}. ${c}`).join("\n");
      if (webResult.note) responseContent += `\n\n_${webResult.note}_`;

      const sourceToolName = webResult.source === "perplexity" ? "perplexity" : webResult.source === "firecrawl" ? "firecrawl" : webResult.source === "ai-knowledge" ? "ai-knowledge" : "web";
      const webMsg: ChatMessage = {
        id: `web-${Date.now()}`, role: "assistant", content: responseContent,
        toolsUsed: [sourceToolName], citations: webResult.citations, webSource: webResult.source,
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(webMsg));
      setIsStreaming(false);
      abortRef.current = null;
      if (tid) { addMessageToThread(tid, "assistant", responseContent); setThreads(loadChatThreads()); }
      return;
    }

    // === DOC GEN ===
    if (route.tool === "docgen" && !hasImage && !hasFile) {
      const format = route.subType || "pdf";
      const loadingId = `loading-${Date.now()}`;
      const formatLabel = format === "csv" ? "spreadsheet" : format === "slides" ? "slide deck" : "document";
      setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: `📄 Generating ${formatLabel}…`, toolsUsed: ["docgen"] }]);

      const docResult = await generateDoc(text, format, owlContext);
      if (docResult.success && docResult.content) {
        const docMsg: ChatMessage = {
          id: `doc-${Date.now()}`, role: "assistant",
          content: `Your ${formatLabel} is ready.`,
          toolsUsed: ["docgen"],
          docDownload: { content: docResult.content, fileName: docResult.fileName || `owl-${format}.html`, mimeType: docResult.mimeType || "text/html", format },
        };
        setMessages(prev => prev.filter(m => m.id !== loadingId).concat(docMsg));
      } else {
        setMessages(prev => prev.map(m => m.id === loadingId
          ? { ...m, content: docResult.error || "Document generation failed.", error: true, retryPayload: { text } }
          : m));
      }
      setIsStreaming(false);
      abortRef.current = null;
      if (tid) { addMessageToThread(tid, "assistant", `[Generated ${format}]`); setThreads(loadChatThreads()); }
      return;
    }

    // === STREAMING CHAT / VISION ===
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
      if (assistantContent) {
        // If empty response, show error with retry
        if (!assistantContent.trim()) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1
                ? { ...m, content: "Something went wrong. Let me try again.", error: true, retryPayload: { text, threadId: tid || undefined } }
                : m);
            }
            return prev;
          });
          return;
        }
        parseAndSaveWisdomPack(assistantContent, text);
        if (tid) { addMessageToThread(tid, "assistant", assistantContent); setThreads(loadChatThreads()); }
      }
    };

    const handleError = (err: string) => {
      // Show inline error with retry button instead of toast
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`, role: "assistant",
        content: err || "Something went wrong.",
        error: true,
        retryPayload: { text, threadId: tid || undefined },
      }]);
    };

    if (hasImage && imageUrl) {
      const visionMsgs = newMessages.map(m => ({
        role: m.role, content: m.content,
        ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
      }));
      await streamVision({ messages: visionMsgs, context: owlContext, onDelta: handleDelta, onDone: handleDone, onError: handleError, signal: controller.signal });
    } else {
      const chatMsgs = newMessages.map(m => {
        if (m.id === userMsg.id && fileTextContent) return { role: m.role, content: userContent };
        return { role: m.role, content: m.content };
      });
      await streamChat({
        messages: chatMsgs, mode: hasFile ? "deep-dive" : mode,
        context: owlContext, onDelta: handleDelta, onDone: handleDone, onError: handleError,
        signal: controller.signal,
      });
    }
  }, [isStreaming, isGeneratingImage, messages, mode, currentThreadId, pendingAttachments, handleImageGen]);

  // ===== RETRY =====
  const handleRetry = useCallback((payload: { text: string; threadId?: string }) => {
    // Remove the error message, then resend
    setMessages(prev => prev.filter(m => !m.error));
    sendMessage(payload.text, payload.threadId);
  }, [sendMessage]);

  // ===== REGENERATE =====
  const handleRegenerate = useCallback(async () => {
    if (isStreaming || isGeneratingImage) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const lastUser = messages[idx];

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
      mode, context: owlContext,
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
      onError: (err) => {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`, role: "assistant",
          content: err, error: true,
          retryPayload: { text: lastUser.content },
        }]);
      },
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
    // Also persist to cloud storage permanently
    persistGeneratedImage({ imageData: imageUrl, prompt, style }).catch(e => console.warn("[Assets] persist failed:", e));
    toast({ title: "🖼️ Image saved permanently!" });
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

  const handleQuickAction = (action: typeof QUICK_CHIPS[0]) => {
    if (action.prompt) {
      setInput(action.prompt);
      setTimeout(() => sendMessage(action.prompt), 100);
    }
  };

  const handleSend = useCallback(() => sendMessage(input), [sendMessage, input]);
  const handleStop = () => abortRef.current?.abort();

  const currentMode = TUTOR_MODES.find(m => m.id === mode) || TUTOR_MODES[0];
  const hasMessages = messages.length > 0;
  const isBusy = isStreaming || isGeneratingImage || isUploading || uploadProgress !== null;

  // ===== RENDER MESSAGE =====
  const renderMessageContent = (msg: ChatMessage) => {
    // Error state with retry
    if (msg.error && msg.retryPayload) {
      return (
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{msg.content}</p>
            <button onClick={() => handleRetry(msg.retryPayload!)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary font-medium hover:bg-primary/20 transition-colors">
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      );
    }

    if (msg.role === "user") {
      return (
        <>
          {msg.imagePreview && <img src={msg.imagePreview} alt="Upload" className="rounded-xl max-h-40 w-auto mb-2" />}
          {msg.imageUrl && !msg.imagePreview && msg.fileType !== "file" && (
            <img src={msg.imageUrl} alt="Upload" className="rounded-xl max-h-40 w-auto mb-2" />
          )}
          {msg.fileName && (
            <div className="flex items-center gap-2 mb-2 rounded-lg bg-primary-foreground/10 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="text-xs truncate">{msg.fileName}</span>
            </div>
          )}
          {msg.content && <p className="text-sm">{msg.content}</p>}
        </>
      );
    }

    const { text, charts } = extractCharts(msg.content);

    // Loading states
    const isLoading = msg.content?.startsWith("🎨 Generating") || msg.content?.startsWith("🌐 Searching") || msg.content?.startsWith("📄 Generating") || msg.content?.startsWith("🧠 Running") || msg.content?.startsWith("🔥 Scraping");

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
                className="rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground font-medium hover:bg-muted transition-colors">
                🔄 Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{msg.content.replace(/^[^\s]+\s/, "")}</span>
          </div>
        )}

        {/* Document download */}
        {msg.docDownload && (
          <div className="mb-3">
            <button onClick={() => {
              const blob = new Blob([msg.docDownload!.content], { type: msg.docDownload!.mimeType });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = msg.docDownload!.fileName; a.click();
              URL.revokeObjectURL(url);
            }}
              className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary font-medium hover:bg-primary/20 transition-colors w-full">
              <FileDown className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Download {msg.docDownload.format.toUpperCase()}</p>
                <p className="text-[10px] text-primary/70">{msg.docDownload.fileName}</p>
              </div>
            </button>
          </div>
        )}

        {/* Text content */}
        {text && !isLoading && (
          <>
            <div className="prose prose-invert prose-sm max-w-none
              [&_p]:my-2 [&_p]:leading-relaxed
              [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5
              [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5
              [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1
              [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
              [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-3
              [&_strong]:text-foreground
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>

          </>
        )}

        {charts.map((chart, i) => (
          <ChartRenderer key={`${msg.id}-chart-${i}`} data={chart}
            onSave={() => handleSaveChart(chart, `${msg.id}-${i}`)} saved={savedChartIds.has(`${msg.id}-${i}`)} />
        ))}

        {msg.toolsUsed && <ToolBadges tools={msg.toolsUsed} confidence={msg.confidence} sourcesCount={(msg.citations?.length || 0) + (msg.sitesReviewed?.length || 0)} />}

        {/* Save strategic analysis */}
        {msg.strategicType && (
          <button
            onClick={() => {
              const snapshot = {
                id: `strategic-${Date.now()}`,
                title: STRATEGIC_LABELS[msg.strategicType as StrategicType]?.label || "Analysis",
                mentalModel: msg.strategicType || "analysis",
                keyInsight: msg.content.slice(0, 200),
                bragLine: `${msg.toolsUsed?.join(" + ") || "AI"} analysis`,
                category: "strategic-analysis",
                completedAt: Date.now(),
              };
              const snapshots = JSON.parse(localStorage.getItem("wisdom-ai-snapshots") || "[]");
              snapshots.unshift(snapshot);
              localStorage.setItem("wisdom-ai-snapshots", JSON.stringify(snapshots));
              const strategicSaves = JSON.parse(localStorage.getItem("wisdom-strategic-saves") || "[]");
              strategicSaves.unshift({
                id: snapshot.id, type: msg.strategicType, content: msg.content,
                toolsUsed: msg.toolsUsed, citations: msg.citations,
                sitesReviewed: msg.sitesReviewed, confidence: msg.confidence, savedAt: Date.now(),
              });
              localStorage.setItem("wisdom-strategic-saves", JSON.stringify(strategicSaves));
              toast({ title: `📋 Analysis saved to Library!` });
            }}
            className="mt-2 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            💾 Save to Library
          </button>
        )}
      </>
    );
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header — minimal */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <OwlIcon size={22} />
          <span className="font-display text-lg font-bold text-foreground tracking-tight">Owl</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setThreads(loadChatThreads()); setShowHistory(!showHistory); }}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors">
            <History className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chat History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border">
            <div className="px-5 py-3 max-h-64 overflow-y-auto hide-scrollbar">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">History</p>
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No saved chats yet.</p>
              ) : (
                <div className="space-y-1">
                  {threads.slice(0, 20).map(t => (
                    <div key={t.id} className={`rounded-xl p-2.5 flex items-center gap-2 transition-all cursor-pointer ${
                      currentThreadId === t.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}>
                      {renamingId === t.id ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(t.id)} onKeyDown={e => e.key === "Enter" && handleRename(t.id)}
                          className="flex-1 bg-transparent text-sm text-foreground outline-none" autoFocus />
                      ) : (
                        <button onClick={() => handleOpenThread(t)} className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.messages.length} msgs · {new Date(t.updatedAt).toLocaleDateString()}</p>
                        </button>
                      )}
                      <button onClick={() => { setRenamingId(t.id); setRenameValue(t.title); }}
                        className="shrink-0 p-1 rounded-lg hover:bg-muted/50"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(t.id)}
                        className="shrink-0 p-1 rounded-lg hover:bg-destructive/10"><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 hide-scrollbar">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center min-h-[65vh]">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <p className="font-display text-2xl font-bold text-foreground tracking-tight">{displayGreeting}</p>
            </motion.div>

            {/* Daily Quote */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="w-full max-w-md mb-8">
              <div className="text-center px-6">
                <p className="text-sm italic text-muted-foreground leading-relaxed">"{dailyQuote}"</p>
                <button onClick={handleSaveQuote}
                  className={`mt-2 text-xs font-medium transition-colors ${savedQuote ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"}`}>
                  <Bookmark className="h-3 w-3 inline mr-1" />{savedQuote ? "Saved" : "Save"}
                </button>
              </div>
            </motion.div>

            {/* Quick Action Chips — just a few, minimal */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="w-full max-w-md mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_CHIPS.map((action, i) => (
                  <button key={i} onClick={() => handleQuickAction(action)}
                    className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all">
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Mode Selector */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button onClick={() => setShowModes(!showModes)}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span>{currentMode.icon}</span><span>{currentMode.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showModes ? "rotate-180" : ""}`} />
              </button>
            </motion.div>
            <AnimatePresence>
              {showModes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3">
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                    {TUTOR_MODES.map((m) => (
                      <button key={m.id} onClick={() => { setMode(m.id); setShowModes(false); }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
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
            {/* Compact mode selector */}
            {!showModes && (
              <div className="flex justify-center mb-1">
                <button onClick={() => setShowModes(!showModes)}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
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
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <OwlIcon size={14} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.error
                        ? "bg-destructive/5 border border-destructive/20 text-foreground"
                        : "bg-card border border-border/50 text-foreground"
                  }`}>
                    {renderMessageContent(msg)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <OwlIcon size={14} />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.4s]" />
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
          <button onClick={handleStop} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Square className="h-3 w-3" /> Stop
          </button>
        </div>
      )}
      {!isBusy && hasMessages && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.error && (
        <div className="flex justify-center pb-2">
          <button onClick={handleRegenerate} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      )}

      {/* Style Picker */}
      <AnimatePresence>
        {showStylePicker && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Image style:</span>
              <button onClick={() => setShowStylePicker(false)} className="ml-auto p-1 rounded hover:bg-muted/50">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_STYLES.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(selectedStyle === s.id ? null : s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedStyle === s.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {import.meta.env.DEV && lastUploadDebug && (
        <div className="px-5 pb-2">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-2">
            <p className="text-[10px] font-medium text-muted-foreground">Upload debug (dev only)</p>
            <textarea
              readOnly
              value={`URL: ${lastUploadDebug.endpoint}\nStatus: ${lastUploadDebug.status ?? "n/a"}\nError: ${lastUploadDebug.shortError}\nRaw: ${lastUploadDebug.rawError || "n/a"}`}
              className="mt-1 h-20 w-full resize-none rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] text-foreground outline-none"
            />
          </div>
        </div>
      )}

      {/* Pending Attachments */}
      {pendingAttachments.length > 0 && (
        <div className="px-5 pb-2">
          <div className="flex gap-2 flex-wrap">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative">
                {att.type === "image" ? (
                  <img src={att.preview} alt={att.name} className="h-14 rounded-xl border border-border" />
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2">
                    <span className="text-sm">{getFileIcon(att.name)}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{att.name}</span>
                  </div>
                )}
                <button onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px]">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 px-5 py-3 pb-24 md:pb-4 bg-background relative">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
          <input type="file" ref={fileInputRef} accept="image/*,.pdf,.doc,.docx,.txt,.csv,.md,.json,.xml" multiple className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors" title="Attach">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowStylePicker(!showStylePicker)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              showStylePicker || selectedStyle ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}
            title="Generate image">
            <Wand2 className="h-4 w-4" />
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={showStylePicker ? "Describe the image…" : "Ask Owl anything…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
          <VoiceChat
            onTranscript={(text) => {
              setInput(prev => prev ? `${prev} ${text}` : text);
            }}
            isStreaming={isStreaming}
          />
          <button onClick={handleSend} disabled={(!input.trim() && pendingAttachments.length === 0) || isBusy}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
