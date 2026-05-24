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

type Intent = "checklist" | "review" | "outline" | "general";

function detectIntent(prompt: string): Intent {
  const p = prompt.toLowerCase();
  if (/(checklist|todo|task list|product|mvp|launch|plan|roadmap|spec)/.test(p)) return "checklist";
  if (/(review|refactor|bug|optimi[sz]e|debug|code|function|class|test)/.test(p)) return "review";
  if (/(outline|article|blog|post|content|essay|write|draft|guide|tutorial)/.test(p)) return "outline";
  return "general";
}

function summarize(prompt: string, max = 90): string {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

function checklistDemo(topic: string): string {
  return [
    `# Practical Checklist — ${topic}`,
    "",
    "## MVP scope",
    "- Define the smallest user-facing slice that delivers real value",
    "- List required inputs, primary action, and the output shape",
    "- Cover empty, loading, and error states from day one",
    "",
    "## Tech foundation",
    "- Pick one framework and stick to its conventions",
    "- Keep API keys server-side, never in the client bundle",
    "- Write a thin adapter so providers can be swapped later",
    "",
    "## Polish before launch",
    "- Keyboard shortcut for the primary action (e.g. ⌘+Enter)",
    "- Sample inputs so first-time users can try it in one click",
    "- Copy-to-markdown or export so output is reusable",
    "",
    "## Stretch goals",
    "- Local history of recent runs",
    "- Side-by-side comparison of two outputs",
    "- Shareable permalinks for individual runs",
  ].join("\n");
}

function reviewDemo(topic: string): string {
  return [
    `# Code Review Notes — ${topic}`,
    "",
    "## Strengths",
    "- Clear separation between request parsing and provider call",
    "- Server-side env handling keeps secrets out of the client",
    "- Types are explicit and reused across the boundary",
    "",
    "## Issues to address",
    "- Validate request body shape before trusting fields",
    "- Bound user input length to avoid oversized provider calls",
    "- Surface provider error details without leaking internals",
    "",
    "## Suggested refactors",
    "- Extract a `callProvider` adapter so swapping vendors is one file",
    "- Add a typed `Result<T>` return shape instead of throwing",
    "- Cover the happy path and the 400/500 branches with tests",
  ].join("\n");
}

function outlineDemo(topic: string): string {
  return [
    `# Content Outline — ${topic}`,
    "",
    "## Hook",
    "- Open with the concrete problem the reader has right now",
    "- One short sentence promising what they will leave with",
    "",
    "## Core sections",
    "- Why this matters: the cost of doing nothing",
    "- How it works: the smallest mental model that fits",
    "- Walkthrough: a real example end to end",
    "- Tradeoffs: where this approach breaks",
    "",
    "## Close",
    "- One actionable next step the reader can do today",
    "- Optional CTA: link to repo, demo, or follow-up read",
  ].join("\n");
}

function generalDemo(topic: string): string {
  return [
    `# Notes — ${topic}`,
    "",
    "## What you asked",
    `- ${topic}`,
    "",
    "## Practical take",
    "- Start with the simplest version that answers the question",
    "- Name the assumptions you are making out loud",
    "- Pick one primary metric to know if you are on track",
    "",
    "## Next moves",
    "- Draft the first iteration small enough to ship in a day",
    "- Get one piece of real feedback before going wider",
    "- Iterate; do not polish the wrong thing",
  ].join("\n");
}

function buildDemoBody(request: GenerateRequest): string {
  const summary = summarize(request.userPrompt || "no user prompt provided");
  const intent = detectIntent(request.userPrompt);
  const body =
    intent === "checklist" ? checklistDemo(summary) :
    intent === "review" ? reviewDemo(summary) :
    intent === "outline" ? outlineDemo(summary) :
    generalDemo(summary);

  const footer = [
    "",
    "---",
    "_Demo mode — no API key used. Set `DEMO_MODE=false` and configure an OpenAI-compatible endpoint to get live model output._",
  ].join("\n");

  return body + "\n" + footer;
}

export function makeDemoResponse(request: GenerateRequest): GenerateResponse {
  const model = request.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  return {
    mode: "demo",
    model,
    createdAt: new Date().toISOString(),
    output: buildDemoBody(request),
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
