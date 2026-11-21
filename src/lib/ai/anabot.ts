export type AnabotMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const ENDPOINT = "https://anabot.my.id/api/ai/chat";
const MODEL = "google/gemini-2.5-flash-lite";
// This is the provider's documented public demo key, not a private credential.
const PUBLIC_API_KEY = "freeApikey";

/** Accept the common response envelopes used by Anabot without trusting error text as an answer. */
export function extractAnabotText(payload: unknown, depth = 0): string | null {
  if (depth > 5 || payload == null) return null;
  if (typeof payload === "string") return payload.trim() || null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractAnabotText(item, depth + 1);
      if (text) return text;
    }
    return null;
  }
  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (record["success"] === false || typeof record["error"] === "string") return null;
  for (const key of ["answer", "response", "result", "message", "text", "content", "data", "choices"]) {
    const text = extractAnabotText(record[key], depth + 1);
    if (text) return text.slice(0, 20_000);
  }
  return null;
}

export async function askAnabot(messages: AnabotMessage[], callerSignal: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const forwardAbort = () => controller.abort();
  if (callerSignal.aborted) controller.abort();
  callerSignal.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ messages, model: MODEL, apikey: PUBLIC_API_KEY }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(`Anabot returned HTTP ${response.status}; using the local librarian.`);
      return null;
    }
    const text = extractAnabotText(await response.json());
    if (!text) console.warn("Anabot returned no readable answer; using the local librarian.");
    return text;
  } catch (error) {
    if (!callerSignal.aborted) console.warn("Anabot is unavailable; using the local librarian.", error);
    return null;
  } finally {
    clearTimeout(timeout);
    callerSignal.removeEventListener("abort", forwardAbort);
  }
}
