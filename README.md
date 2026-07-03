# Rikka Studio

A clean web workspace for prompt experiments.

Rikka Studio helps creators and developers test prompts, review model output, and export reusable notes through OpenAI-compatible APIs.

## What it does

- write a system prompt and user prompt
- run a demo response without an API key
- connect a server-side model provider when needed
- review output with run metadata
- export prompt runs as Markdown

## Why it exists

Small AI experiments often end up scattered across chats, notebooks, and screenshots. Rikka Studio keeps each run readable, repeatable, and easy to document.

## Modes

### Demo mode

Runs without credentials and returns a sample response. Useful for local demos, screenshots, and reviewing the interface.

### API mode

Uses a server-side OpenAI-compatible endpoint. API keys stay in server environment variables and are never exposed to the browser.

## Environment

Copy `.env.example` to `.env.local` when using API mode.

```env
DEMO_MODE=true
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_API_KEY=replace_with_server_side_key
OPENAI_MODEL=example-model
```

## Security notes

- do not commit `.env.local`
- do not put API keys in the browser
- keep provider credentials server-side only
- demo mode works without secrets

## Development safety

This repo is intended to be built on Vercel or a local development machine.

Do not run a long-lived Next.js dev server on a small controller VPS. The default `npm run dev` script is blocked on purpose. Use `npm run dev:local` only on a machine meant for frontend development.

## Status

Early public prototype. The first version is intentionally small: a clear interface, safe provider design, and exportable notes.

<!-- badge update 1783103398 -->
