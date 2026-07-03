"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { GenerateResponse } from "../lib/types";
import { MODEL_OPTIONS, DEFAULT_MODEL, DEFAULT_BASE_URL, LS_KEYS } from "../lib/models";
import { callClientLLM, testClientConnection, validateBaseUrl } from "../lib/client-llm";

type SamplePreset = {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
};

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "checklist",
    label: "Product checklist",
    description: "Turn a rough idea into an MVP checklist.",
    systemPrompt: "You are a concise product engineer. Return structured notes with clear bullets.",
    userPrompt:
      "Turn this rough idea into a practical product checklist: a small web app for testing prompts and exporting notes.",
  },
  {
    id: "review",
    label: "Code review",
    description: "Spot issues and suggest refactors.",
    systemPrompt: "You are a senior reviewer. Be honest, specific, and brief. Use bullets.",
    userPrompt:
      "Review this idea: a Next.js app that lets users bring their own API key and call an OpenAI-compatible provider directly from the browser. What should I check before shipping?",
  },
  {
    id: "outline",
    label: "Content outline",
    description: "Draft an outline for a tutorial post.",
    systemPrompt: "You are a clear technical writer. Keep it grounded and skimmable.",
    userPrompt:
      "Outline a short tutorial post: how to build a small prompt-testing web app and deploy it on Vercel.",
  },
];

const DEFAULT_PRESET = SAMPLE_PRESETS[0];

type TestResult = { status: "idle" | "ok" | "fail"; message?: string };

function getStored(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function setStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // ignore quota / privacy-mode failures
  }
}

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
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PRESET.systemPrompt);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_PRESET.userPrompt);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // API settings (client-side, localStorage-only)
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [customModel, setCustomModel] = useState("");
  const [baseUrlError, setBaseUrlError] = useState("");
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });
  const [testing, setTesting] = useState(false);

  const usingClientKey = Boolean(apiKey && !baseUrlError);

  const markdown = useMemo(
    () => buildMarkdown(result, userPrompt, systemPrompt),
    [result, userPrompt, systemPrompt],
  );

  // Prefill from localStorage on mount. The API key is loaded into state but
  // never logged or sent to our server — it only goes directly to the user's
  // provider via fetch in callClientLLM().
  useEffect(() => {
    setApiKey(getStored(LS_KEYS.apiKey));
    setBaseUrl(getStored(LS_KEYS.baseUrl) || DEFAULT_BASE_URL);
    setCustomModel(getStored(LS_KEYS.customModel));
  }, []);

  // Validate base URL whenever it changes.
  useEffect(() => {
    if (!baseUrl) {
      setBaseUrlError("");
      return;
    }
    setBaseUrlError(validateBaseUrl(baseUrl) ?? "");
  }, [baseUrl]);

  // Persist credentials to localStorage whenever they change.
  useEffect(() => {
    setStored(LS_KEYS.apiKey, apiKey);
  }, [apiKey]);
  useEffect(() => {
    setStored(LS_KEYS.baseUrl, baseUrl);
  }, [baseUrl]);
  useEffect(() => {
    setStored(LS_KEYS.customModel, customModel);
  }, [customModel]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isCmdEnter = (event.metaKey || event.ctrlKey) && event.key === "Enter";
      if (!isCmdEnter) return;
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The effective model: custom input overrides the dropdown selection.
  const effectiveModel = customModel.trim() || model;

  async function runPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (usingClientKey && apiKey) {
        // Direct browser → provider call. Key never leaves the browser.
        const data = await callClientLLM({
          apiKey,
          baseUrl,
          model: effectiveModel,
          systemPrompt,
          userPrompt,
          temperature,
        });
        setResult(data);
      } else {
        // Demo mode — call our server. No key is sent.
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ systemPrompt, userPrompt, model: effectiveModel, temperature }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        setResult(data);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyMarkdown() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function loadPreset(preset: SamplePreset) {
    setSystemPrompt(preset.systemPrompt);
    setUserPrompt(preset.userPrompt);
    setResult(null);
    setError("");
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult({ status: "idle" });
    try {
      const res = await testClientConnection(apiKey, baseUrl);
      setTestResult(
        res.ok
          ? { status: "ok", message: "Connection successful." }
          : { status: "fail", message: res.message },
      );
    } catch (caught) {
      setTestResult({
        status: "fail",
        message: caught instanceof Error ? caught.message : "Connection failed.",
      });
    } finally {
      setTesting(false);
    }
  }

  function handleClearCredentials() {
    setApiKey("");
    setCustomModel("");
    setBaseUrl(DEFAULT_BASE_URL);
    setTestResult({ status: "idle" });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LS_KEYS.apiKey);
        window.localStorage.removeItem(LS_KEYS.baseUrl);
        window.localStorage.removeItem(LS_KEYS.customModel);
      } catch {
        // ignore
      }
    }
  }

  return (
    <>
      <header className="nav">
        <div className="navInner">
          <a className="brand" href="#top" aria-label="Rikka Studio home">
            <img src="/favicon.png" alt="Rikka" className="logoImg" width={32} height={32} />
            <span className="brandText">Rikka Studio</span>
          </a>
          <nav className="navLinks" aria-label="Primary">
            <a href="#studio">Studio</a>
            <a href="#how">How it works</a>
            <a href="#cases">Use cases</a>
            <a
              href="https://github.com/rikka0x/rikka-studio"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="shell" id="top">
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">Rikka Studio</p>
            <h1>
              Prompt experiments,
              <br />
              <span className="gradientText">cleanly documented.</span>
            </h1>
            <p className="jpAccent">{"邪王真眼 — Wielder of the Tyrant's Eye"}</p>
            <p className="lede">
              A small web workspace for testing prompts, reviewing model outputs, and exporting
              reusable notes through any OpenAI-compatible API.
            </p>
            <div className="heroActions">
              <a className="btn btnPrimary" href="#studio">
                Open the studio
              </a>
              <a
                className="btn btnGhost"
                href="https://github.com/rikka0x/rikka-studio"
                target="_blank"
                rel="noreferrer noopener"
              >
                View source
              </a>
            </div>
            <p className="kbdHint">
              <kbd>⌘</kbd> + <kbd>Enter</kbd> to run anywhere on the page
            </p>
          </div>

          <aside className="terminal" aria-hidden="true">
            <div className="terminalBar">
              <span className="dot dotRed" />
              <span className="dot dotYellow" />
              <span className="dot dotGreen" />
              <span className="terminalTitle">rikka-studio · run</span>
            </div>
            <div className="terminalBody">
              <p className="termLine">
                <span className="termPrompt">$</span> rikka run
                <span className="termFlag"> --model</span> gpt-4o-mini
              </p>
              <p className="termLine termMuted">
                <span className="termPrompt">›</span> system: concise AI assistant
              </p>
              <p className="termLine termMuted">
                <span className="termPrompt">›</span> user: turn this idea into a checklist
              </p>
              <p className="termLine termOut">
                <span className="termArrow">→</span> # Practical Checklist
              </p>
              <p className="termLine termOut">- Define MVP scope</p>
              <p className="termLine termOut">- Cover empty / loading / error states</p>
              <p className="termLine termOut termTyping">
                - Add ⌘+Enter shortcut<span className="termCaret" />
              </p>
            </div>
          </aside>

          <div className="heroCharacter">
            <div className="magicCircle" style={{ width: 200, height: 200, top: 40, right: 20 }} />
            <span className="sparkle" style={{ top: 20, left: 30 }}>✦</span>
            <span className="sparkle" style={{ top: 80, right: 50 }}>✧</span>
            <span className="sparkle" style={{ bottom: 40, left: 60 }}>✦</span>
            {/* Character image — placed when subagent returns */}
            <img src="/rikka-hero.png" alt="Rikka Takanashi" />
          </div>
        </section>

        <section className="features">
          <div className="featureCard">
            <div className="featureIcon">⌁</div>
            <h3>Prompt testing</h3>
            <p>System + user prompts with model and temperature controls, all in one panel.</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">↗</div>
            <h3>Markdown export</h3>
            <p>One-click copy of the full run as markdown. Drop it straight into your notes.</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">◇</div>
            <h3>Bring your own key</h3>
            <p>Bring your own API key or use the demo mode. Keys stay in your browser, never on our server.</p>
          </div>
        </section>

        <section className="grid" id="studio">
          <form className="card panel" onSubmit={runPrompt} ref={formRef}>
            <div className="cardHeader">
              <div>
                <p className="eyebrow">Input</p>
                <h2>Prompt run</h2>
              </div>
              <span
                className="pill"
                title={usingClientKey ? "Using your own API key from the browser" : "Demo mode — no API key set"}
              >
                <span className={`pillDot ${usingClientKey ? "pillDotAccent" : ""}`} />
                {usingClientKey ? "your key" : "demo mode"}
              </span>
            </div>

            <div className="presetRow" role="group" aria-label="Sample prompts">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="presetCard"
                  onClick={() => loadPreset(preset)}
                  title={preset.description}
                >
                  <span className="presetLabel">{preset.label}</span>
                  <span className="presetDesc">{preset.description}</span>
                </button>
              ))}
            </div>

            <label>
              System prompt
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={4}
              />
            </label>

            <label>
              User prompt
              <textarea
                value={userPrompt}
                onChange={(event) => setUserPrompt(event.target.value)}
                rows={7}
                required
              />
            </label>

            <div className="settings">
              <label>
                Model
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sliderLabel">
                <span className="sliderHead">
                  Temperature
                  <span className="sliderValue">{temperature.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                />
              </label>
            </div>

            <label className="customModelLabel">
              Or type a custom model name
              <input
                type="text"
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                placeholder="overrides the dropdown when filled"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            {/* ─── API settings panel (collapsible, client-side keys only) ─── */}
            <div className="apiPanel">
              <button
                type="button"
                className="apiPanelToggle"
                onClick={() => setShowApiPanel((v) => !v)}
                aria-expanded={showApiPanel}
                aria-controls="api-settings"
              >
                <span className="lockIcon" aria-hidden="true">🔒</span>
                <span className="apiPanelTitle">API settings</span>
                <span className="apiPanelStatus">
                  {usingClientKey ? "using your key" : "demo mode"}
                </span>
                <span className="apiPanelChevron" aria-hidden="true">
                  {showApiPanel ? "▴" : "▾"}
                </span>
              </button>

              {showApiPanel ? (
                <div className="apiPanelBody" id="api-settings">
                  <label className="apiKeyLabel">
                    API key
                    <span className="inputWithButton">
                      <input
                        type={apiKeyVisible ? "text" : "password"}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder="sk-… (stored in your browser only)"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        className="btn btnGhost btnCompact btnIcon"
                        onClick={() => setApiKeyVisible((v) => !v)}
                        title={apiKeyVisible ? "Hide key" : "Show key"}
                        aria-label={apiKeyVisible ? "Hide key" : "Show key"}
                      >
                        {apiKeyVisible ? "🙈" : "👁"}
                      </button>
                    </span>
                  </label>

                  <label className={baseUrlError ? "fieldError" : ""}>
                    Base URL
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder={DEFAULT_BASE_URL}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {baseUrlError ? (
                      <span className="fieldMessage fieldMessageError">{baseUrlError}</span>
                    ) : null}
                  </label>

                  <div className="apiPanelActions">
                    <button
                      type="button"
                      className="btn btnGhost btnCompact"
                      onClick={handleTestConnection}
                      disabled={testing || !apiKey || Boolean(baseUrlError)}
                    >
                      {testing ? "Testing…" : "Test connection"}
                    </button>
                    <button
                      type="button"
                      className="btn btnGhost btnCompact"
                      onClick={handleClearCredentials}
                    >
                      Clear
                    </button>
                  </div>

                  {testResult.status !== "idle" ? (
                    <p
                      className={
                        testResult.status === "ok"
                          ? "testResult testOk"
                          : "testResult testFail"
                      }
                    >
                      {testResult.status === "ok"
                        ? "✓ "
                        : "✗ "}
                      {testResult.message}
                    </p>
                  ) : null}

                  <p className="apiWarning">
                    <span className="warningIcon" aria-hidden="true">⚠</span>
                    Your API key is stored locally in your browser only and never transmitted to
                    our servers. Calls go directly from your browser to your provider.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="actions">
              <button type="submit" className="btn btnPrimary" disabled={loading}>
                {loading ? "Running…" : "Run prompt"}
              </button>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => loadPreset(DEFAULT_PRESET)}
              >
                Load sample
              </button>
              <span className="actionsHint">
                <kbd>⌘</kbd>+<kbd>Enter</kbd>
              </span>
            </div>

            {error ? <p className="error">{error}</p> : null}
          </form>

          <section className="card panel output">
            <div className="cardHeader">
              <div>
                <p className="eyebrow">Output</p>
                <h2>Run result</h2>
              </div>
              <button
                type="button"
                className="btn btnGhost btnCompact"
                onClick={copyMarkdown}
                disabled={!result}
              >
                {copied ? "Copied" : "Copy markdown"}
              </button>
            </div>

            {loading ? (
              <div className="empty loadingState" aria-live="polite">
                <div className="skeleton skeletonHead" />
                <div className="skeleton skeletonLine" />
                <div className="skeleton skeletonLine short" />
                <div className="skeleton skeletonLine" />
                <p className="loadingHint">Generating output…</p>
              </div>
            ) : result ? (
              <>
                <div className="meta">
                  <span>{result.mode}</span>
                  <span>{result.model}</span>
                  <span>{new Date(result.createdAt).toLocaleString()}</span>
                  {result.usage?.totalTokens ? (
                    <span>{result.usage.totalTokens} tok</span>
                  ) : null}
                </div>
                <pre>{result.output}</pre>
              </>
            ) : (
              <div className="empty">
                <div className="emptyIcon" aria-hidden="true">◇</div>
                <p className="emptyTitle">No run yet.</p>
                <p>
                  Add your API key in API settings below to call your provider directly from the
                  browser, or leave it blank to use demo mode.
                </p>
              </div>
            )}
          </section>
        </section>

        <section className="how" id="how">
          <p className="eyebrow">How it works</p>
          <h2 className="sectionTitle">Three steps, no setup needed for the demo.</h2>
          <ol className="howGrid">
            <li className="howStep">
              <span className="stepNum">01</span>
              <h3>Write a prompt</h3>
              <p>Use a sample preset or type your own system and user prompts.</p>
            </li>
            <li className="howStep">
              <span className="stepNum">02</span>
              <h3>Run it</h3>
              <p>
                Bring your own API key to call your provider from the browser, or use demo mode
                without any key.
              </p>
            </li>
            <li className="howStep">
              <span className="stepNum">03</span>
              <h3>Export markdown</h3>
              <p>Copy the run as markdown and paste it into your notes or PR.</p>
            </li>
          </ol>
        </section>

        <section className="cases" id="cases">
          <p className="eyebrow">Use cases</p>
          <h2 className="sectionTitle">Built for the small loops you actually do.</h2>
          <div className="caseGrid">
            <div className="caseCard">
              <h3>Prompt engineering</h3>
              <p>Iterate on system prompts side-by-side and capture the runs you want to keep.</p>
            </div>
            <div className="caseCard">
              <h3>Content drafting</h3>
              <p>Spin up outlines, intros, and titles, then paste straight into your editor.</p>
            </div>
            <div className="caseCard">
              <h3>Code review prompts</h3>
              <p>Test reviewer-style prompts before wiring them into your CI or dev tools.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="ctaInner">
            <h2>Open source. Yours to fork.</h2>
            <p>
              Rikka Studio is a small, honest reference for prompt UIs. Read the code, copy the
              ideas, ship your own.
            </p>
            <div className="heroActions">
              <a
                className="btn btnPrimary"
                href="https://github.com/rikka0x/rikka-studio"
                target="_blank"
                rel="noreferrer noopener"
              >
                Star on GitHub
              </a>
              <a className="btn btnGhost" href="#studio">
                Try the demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div className="footerBrand">
            <img
              src="/favicon.png"
              alt="Rikka"
              className="logoImg logoImgSmall"
              width={22}
              height={22}
            />
            <span>Rikka Studio</span>
          </div>
          <div className="footerLinks">
            <a
              href="https://github.com/rikka0x/rikka-studio"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
            </a>
            <a href="#studio">Studio</a>
            <a href="#how">How it works</a>
          </div>
          <p className="footerNote">© {new Date().getFullYear()} Rikka Studio · 邪王真眼 · Deployed on Vercel</p>
        </div>
      </footer>
    </>
  );
}
