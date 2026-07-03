/**
 * Model configuration for Rikka Studio.
 * Models can be overridden via environment variables on the server.
 */

export type ModelOption = {
  value: string;
  label: string;
};

/**
 * Default model options shown in the UI dropdown.
 * These are safe defaults — the actual model used is resolved server-side
 * from process.env.OPENAI_MODEL or the request body.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  { value: "demo-model", label: "demo-model (offline mock)" },
  { value: "gpt-4o-mini", label: "gpt-4o-mini" },
  { value: "gpt-4o", label: "gpt-4o" },
  { value: "gpt-5", label: "gpt-5" },
  { value: "claude-sonnet-4", label: "claude-sonnet-4" },
  { value: "claude-haiku-4", label: "claude-haiku-4" },
  { value: "custom", label: "custom (set in .env)" },
];

/**
 * Default model used when none is selected.
 * Can be overridden via OPENAI_MODEL env var.
 */
export const DEFAULT_MODEL = "demo-model";
