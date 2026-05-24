# Security

## Secrets

Provider credentials must stay server-side.

Do not commit:

- `.env`
- `.env.local`
- API keys
- provider tokens
- cookies
- sessions
- private keys

## Browser boundary

The browser may send prompt text and settings to the app API route. It must not receive the provider key.

## Demo mode

Demo mode is the safe default. It runs without secrets and is suitable for public previews.

## API mode

API mode should be enabled only in trusted deployments where environment variables are managed by the platform.

## Public repo rule

Documentation uses placeholder endpoints only. Real provider endpoints and keys belong in deployment environment settings, not source control.
