# Security Policy

## Supported Versions

Rikka Studio is an early-stage open source project. Security fixes are applied to the latest `main` branch only.

## Reporting a Vulnerability

If you find a security vulnerability, please **do not open a public issue**.

Instead, report it privately:

1. Open a GitHub Security Advisory: [Security tab → Advisories → New draft advisory](https://github.com/rikka0x/rikka-studio/security/advisories/new)
2. Or email: security@rikka0x.dev (if available)

Include:
- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 72 hours. Responsible disclosure is appreciated.

## Security Principles

This project follows these security principles:

### Server-side Keys Only

- API keys and provider credentials never reach the browser
- `OPENAI_API_KEY` is read from server environment variables only
- The client-side code has no access to secrets
- The API route (`src/app/api/generate/route.ts`) proxies requests server-side

### Input Sanitization

- User input is trimmed and length-capped (8000 chars) in `src/lib/llm.ts`
- Temperature is clamped to `[0, 2]`
- Invalid JSON is caught by the error boundary

### Demo Mode

- Demo mode runs without any credentials
- No API key is needed for the demo
- Demo responses are static mock data, not real model output

### What Not to Commit

- `.env.local` — contains API keys
- Any file with hardcoded API keys or tokens
- Provider credentials of any kind

## Scope

**In scope:**
- Server-side key exposure
- Input validation bypass
- XSS via prompt output rendering
- SSRF via the `OPENAI_BASE_URL` configuration

**Out of scope:**
- Demo mode behavior (returns mock data by design)
- Rate limiting (handled by the upstream provider)
- Authentication (this is a client-side demo tool, no auth layer by design)
