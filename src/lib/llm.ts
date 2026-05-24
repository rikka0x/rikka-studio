import { GenerateRequest, GenerateResponse } from "./types";

const DEFAULT_MODEL = "demo-model";

function cleanPrompt(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 8000) : "";
}

function cleanTemperature(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.7;
  return Math.min(2, Math.max(0, value));
}

export function parseGenerateRequest(body: unknown): GenerateRequest {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    systemPrompt: cleanPrompt(input.systemPrompt),
    userPrompt: cleanPrompt(input.userPrompt),
    model: cleanPrompt(input.model) || undefined,
    temperature: cleanTemperature(input.temperature),
  };
}

export function makeDemoResponse(request: GenerateRequest): GenerateResponse {
  const summary = request.userPrompt || "No user prompt provided.";
  const model = request.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;

  return {
    mode: "demo",
    model,
    createdAt: new Date().toISOString(),
    output: [
      "Demo response",
      "",
      "Rikka Studio is running without an API key.",
      "",
      "Prompt note:",
      `- System prompt: ${request.systemPrompt ? "provided" : "empty"}`,
      `- User prompt preview: ${summary.slice(0, 180)}`,
      "- API keys stay server-side when API mode is enabled.",
      "",
      "Next check:",
      "- Switch DEMO_MODE=false and configure an OpenAI-compatible endpoint in .env.local.",
    ].join("\n"),
  };
}

export async function callOpenAICompatible(request: GenerateRequest): Promise<GenerateResponse> {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = request.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;

  if (!baseUrl || !apiKey) {
    throw new Error("API mode needs OPENAI_BASE_URL and OPENAI_API_KEY on the server.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: request.temperature ?? 0.7,
      messages: [
        ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
        { role: "user", content: request.userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
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
