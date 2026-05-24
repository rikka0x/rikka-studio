# Architecture

Rikka Studio keeps provider credentials on the server side.

```text
Browser UI
  -> app API route
  -> OpenAI-compatible provider
```

## Browser UI

The browser collects prompt text and display settings. It does not receive provider API keys.

## API route

The API route validates input, chooses demo mode or API mode, and returns a structured result.

## Demo mode

When `DEMO_MODE=true`, the server returns a local sample response. No provider request is made.

## API mode

When `DEMO_MODE=false`, the server calls an OpenAI-compatible chat completions endpoint using server environment variables.

Required variables:

```env
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_API_KEY=replace_with_server_side_key
OPENAI_MODEL=example-model
```

## Deploy target

The intended deploy target is Vercel. Build and runtime happen away from the small VPS controller.
