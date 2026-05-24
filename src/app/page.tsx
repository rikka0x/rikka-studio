"use client";

import { FormEvent, useMemo, useState } from "react";
import type { GenerateResponse } from "../lib/types";

const sampleSystemPrompt = "You are a concise AI assistant. Return structured notes with clear bullets.";
const sampleUserPrompt = "Turn this rough idea into a practical product checklist: a small web app for testing prompts and exporting notes.";

function buildMarkdown(result: GenerateResponse | null, userPrompt: string, systemPrompt: string) {
  if (!result) return "";
  return [
    "# Rikka Studio Run",
    "",
    `- mode: ${result.mode}`,
    `- model: ${result.model}`,
    `- created: ${result.createdAt}`,
    "",
    "## System prompt",
    systemPrompt || "(empty)",
    "",
    "## User prompt",
    userPrompt,
    "",
    "## Output",
    result.output,
  ].join("\n");
}

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState(sampleSystemPrompt);
  const [userPrompt, setUserPrompt] = useState(sampleUserPrompt);
  const [model, setModel] = useState("demo-model");
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const markdown = useMemo(() => buildMarkdown(result, userPrompt, systemPrompt), [result, userPrompt, systemPrompt]);

  async function runPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt, model, temperature }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyMarkdown() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Rikka Studio</p>
        <h1>Prompt experiments, cleanly documented.</h1>
        <p className="lede">
          A small web workspace for testing prompts, reviewing model outputs, and exporting reusable notes through OpenAI-compatible APIs.
        </p>
      </section>

      <section className="grid">
        <form className="card panel" onSubmit={runPrompt}>
          <div className="cardHeader">
            <div>
              <p className="eyebrow">Input</p>
              <h2>Prompt run</h2>
            </div>
            <span className="pill">server-side keys</span>
          </div>

          <label>
            System prompt
            <textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} rows={5} />
          </label>

          <label>
            User prompt
            <textarea value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)} rows={8} required />
          </label>

          <div className="settings">
            <label>
              Model
              <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="model-name" />
            </label>
            <label>
              Temperature
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? "Running..." : "Run prompt"}</button>
            <button type="button" className="secondary" onClick={() => { setSystemPrompt(sampleSystemPrompt); setUserPrompt(sampleUserPrompt); }}>
              Load sample
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <section className="card panel output">
          <div className="cardHeader">
            <div>
              <p className="eyebrow">Output</p>
              <h2>Run result</h2>
            </div>
            <button className="secondary compact" onClick={copyMarkdown} disabled={!result}>Copy markdown</button>
          </div>

          {result ? (
            <>
              <div className="meta">
                <span>{result.mode}</span>
                <span>{result.model}</span>
                <span>{new Date(result.createdAt).toLocaleString()}</span>
              </div>
              <pre>{result.output}</pre>
            </>
          ) : (
            <div className="empty">
              <p>No run yet.</p>
              <p>Demo mode works without an API key. API mode uses server environment variables.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
