import "server-only";

/**
 * Minimal OpenRouter chat-completions client for admin AI features.
 * The API key lives server-side only (OPENROUTER_API_KEY) and is never sent
 * to the browser. Requests fail fast with a readable message when the key
 * or model is not configured.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface AiJsonOptions {
  /** System prompt steering the model. */
  system: string;
  /** User prompt; content is truncated to `maxChars` before sending. */
  user: string;
  /** Truncation limit for the user prompt (default 24,000 chars). */
  maxChars?: number;
  /** Let the model search the web via OpenRouter's web plugin. */
  webSearch?: boolean;
}

export class AiConfigError extends Error {}

function model(): string {
  return process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
}

/** Calls OpenRouter and returns the message content parsed as JSON. */
export async function aiJson<T>({ system, user, maxChars = 24_000, webSearch }: AiJsonOptions): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("OPENROUTER_API_KEY is not configured. Add it to .env.local and restart the server.");
  }

  const text = user.length > maxChars ? `${user.slice(0, maxChars)}…` : user;

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional OpenRouter headers identify the app on openrouter.ai.
        "X-Title": "Leaflet ebook platform",
      },
      body: JSON.stringify({
        model: model(),
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        ...(webSearch ? { plugins: [{ id: "web", max_results: 3 }] } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if ((error as Error).name === "TimeoutError") throw new Error("The AI request timed out. Try again.");
    throw new Error(`Could not reach the AI service: ${getErrText(error)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 401) throw new AiConfigError("The OpenRouter API key was rejected (401). Check OPENROUTER_API_KEY.");
    if (response.status === 402) throw new AiConfigError("The OpenRouter account is out of credits (402).");
    if (response.status === 429) throw new Error("The AI service rate limit was hit. Wait a moment and retry.");
    throw new Error(`AI request failed (${response.status}): ${body.slice(0, 300) || response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("The AI returned an empty response.");

  // Models sometimes wrap JSON in code fences — strip them.
  const jsonText = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response did not contain JSON.");
  try {
    return JSON.parse(jsonText.slice(start, end + 1)) as T;
  } catch {
    throw new Error("The AI response could not be parsed.");
  }
}

function getErrText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
