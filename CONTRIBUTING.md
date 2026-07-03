# Contributing

Thanks for your interest in Rikka Studio. This is a small project, but contributions are welcome.

## Getting Started

```bash
git clone git@github.com:rikka0x/rikka-studio.git
cd rikka-studio
corepack enable
pnpm install
pnpm dev:local
```

Open `http://127.0.0.1:3000` in your browser.

**Do not run `pnpm dev` on a small VPS.** The default dev script is blocked on purpose. Use `pnpm dev:local` only on a machine meant for frontend development.

## Project Structure

```
src/
  app/
    api/generate/route.ts  — POST handler for prompt runs
    layout.tsx              — root layout + metadata
    page.tsx                — landing page + studio UI
    styles.css              — global styles
    error.tsx               — error boundary
  lib/
    llm.ts                  — demo mode + API mode provider adapter
    types.ts                — shared types
docs/                       — architecture, examples, product notes
public/                     — static assets
```

## Branch Naming

Use conventional commit prefixes for branch names:

```
feat/<scope>       — new feature
fix/<scope>        — bug fix
chore/<scope>      — maintenance, deps, config
docs/<scope>       — documentation
refactor/<scope>   — code refactor, no behavior change
```

Examples: `feat/streaming-response`, `fix/demo-mode-fallback`, `docs/readme-badges`

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short subject

optional body explaining why
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

Keep the subject under 72 characters, lowercase, no period.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes, keep commits focused
3. Run locally before pushing:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
4. Push your branch and open a PR
5. CI must pass (lint + typecheck + build)
6. Squash merge is the default

### PR Checklist

- [ ] Lint passes (`pnpm lint`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No secrets, API keys, or environment variables in code
- [ ] No `.env.local` committed
- [ ] Commit messages follow conventional commits

## Security

- Never commit `.env.local` or any file containing API keys
- Provider credentials stay server-side only (see `src/lib/llm.ts`)
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

## Demo Mode

The app defaults to demo mode — it returns mock responses without any API key. This is intentional for safe public previews and local testing.

To use a real OpenAI-compatible endpoint, set `DEMO_MODE=false` and configure `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` in `.env.local`.

## License

MIT. By contributing, you agree your contributions will be licensed under the same terms.
