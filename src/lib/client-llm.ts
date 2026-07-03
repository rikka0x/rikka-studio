/**
 * Client-side LLM call helper.
 *
 * Used when the user provides their own API key + base URL in the browser.
 * The key is stored only in localStorage and is sent directly to the
 * user's provider — it never touches our server.
 */

import type { GenerateResponse } from "./types";

export type ClientGenerateOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
};

/**
 * Validate that a base URL is well-formed and uses http(s).
 * Returns `null` on success or an error message string.
 */
export function validateBaseUrl(baseUrl: string): string | null {
  if (!baseUrl) return "Base URL is required.";
  if (!/^https?:\/\//i.test(baseUrl)) {
    return "Base URL must start with http:// or https://";
  }
  try {
    // Quick structural sanity check (will throw on malformed strings).
    // eslint-disable-next-line no-new
    new URL(baseUrl);
  } catch {
    return "Base URL is not a valid URL.";
  }
  return null;
}

/** Normalize a base URL by stripping any trailing slash. */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

/**
 * Call an OpenAI-compatible `/chat/completions` endpoint directly from the
 * browser using the user's own API key. The key is never logged.
 */
export async function callClientLLM(options: ClientGenerateOptions): Promise<GenerateResponse> {
  const { apiKey, baseUrl, model, systemPrompt, userPrompt, temperature } = options;

  const urlError = validateBaseUrl(baseUrl);
  if (urlError) throw new Error(urlError);
  if (!apiKey) throw new Error("API key is required for direct mode.");
  if (!userPrompt) throw new Error("User prompt is required.");

  const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  const body = {
    model,
    temperature: temperature ?? 0.7,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: userPrompt },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Provider request failed: ${response.status} ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const output = data?.choices?.[0]?.message?.content;

  return {
    mode: "api",
    model,
    createdAt: new Date().toISOString(),
    output: typeof output === "string" ? output : "No text output returned.",
    usage: {
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      totalTokens: data?.usage?.total_tokens,
    },
  };
}

/**
 * Ping a provider's `/models` endpoint to verify the API key + base URL work.
 * Returns `{ ok: true }` or `{ ok: false, message }`.
 */
export async function testClientConnection(
  apiKey: string,
  baseUrl: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const urlError = validateBaseUrl(baseUrl);
  if (urlError) return { ok: false, message: urlError };
  if (!apiKey) return { ok: false, message: "API key is required." };

  try {
    const endpoint = `${normalizeBaseUrl(baseUrl)}/models`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Connection failed.",
    };
  }
}
