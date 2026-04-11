const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const GENERATE_LESSON_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson`;
const GENERATE_GAME_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-game-question`;
const GENERATE_FEED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-feed-card`;

export type Msg = { role: "user" | "assistant"; content: string };

const MAX_RETRIES = 1;
const RETRY_DELAY = 1500;

async function attemptStream({
  url,
  body,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  url: string;
  body: any;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: string) => void;
  signal?: AbortSignal;
}): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Request failed" }));
      const errMsg = data.error || `Error ${resp.status}`;
      // Don't retry on 402 (payment) or 429 (rate limit with long backoff)
      if (resp.status === 402 || resp.status === 400) {
        onError?.(errMsg);
        onDone();
        return true; // Don't retry
      }
      return false; // Retry
    }

    if (!resp.body) { onDone(); return true; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let receivedContent = false;

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
        if (json === "[DONE]") { onDone(); return true; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            receivedContent = true;
            onDelta(content);
          }
        } catch { buffer = line + "\n" + buffer; break; }
      }
    }

    if (!receivedContent) return false; // Empty response — retry
    onDone();
    return true;
  } catch (e: any) {
    if (e.name === "AbortError") { onDone(); return true; }
    return false; // Network error — retry
  }
}

export async function streamChat({
  messages,
  mode = "default",
  context,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: Msg[];
  mode?: string;
  context?: Record<string, string>;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: string) => void;
  signal?: AbortSignal;
}) {
  const body = { messages, mode, context };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) { onDone(); return; }

    const success = await attemptStream({
      url: CHAT_URL,
      body,
      onDelta,
      onDone,
      onError,
      signal,
    });

    if (success) return;

    // Wait before retry
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }

  // All retries exhausted
  onError?.("Connection failed. Please try again.");
  onDone();
}

export async function generateLesson(params: {
  category?: string; difficulty?: string; track?: string; excludeIds?: string[];
}) {
  const resp = await fetch(GENERATE_LESSON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to generate lesson");
  }
  return resp.json();
}

export async function generateGameQuestion(params: {
  gameType: string; difficulty?: string;
}) {
  const resp = await fetch(GENERATE_GAME_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to generate question");
  }
  return resp.json();
}

