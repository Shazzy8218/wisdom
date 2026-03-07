const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const GENERATE_LESSON_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson`;
const GENERATE_GAME_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-game-question`;
const GENERATE_FEED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-feed-card`;

export type Msg = { role: "user" | "assistant"; content: string };

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
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode, context }),
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
