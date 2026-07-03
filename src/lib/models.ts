/**
 * Model configuration for Rikka Studio.
 *
 * Model options here are convenience presets shown in the UI dropdown.
 * Users can also type any custom model name in the API settings panel,
 * which overrides the dropdown selection.
 */

export type ModelOption = {
  value: string;
  label: string;
};

/**
 * Default model options shown in the UI dropdown.
 * These are convenience presets only — a custom model name typed in the
 * API settings panel will always take precedence over the dropdown value.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini" },
  { value: "gpt-4o", label: "gpt-4o" },
  { value: "gpt-5", label: "gpt-5" },
  { value: "claude-sonnet-4", label: "claude-sonnet-4" },
  { value: "claude-haiku-4", label: "claude-haiku-4" },
  { value: "deepseek-chat", label: "deepseek-chat" },
];

export const DEFAULT_BASE_URL = "https://api.openai.com/v1";

/** localStorage keys for user-provided credentials (browser-only). */
export const LS_KEYS = {
  apiKey: "rikka_studio_api_key",
  baseUrl: "rikka_studio_base_url",
  customModel: "rikka_studio_custom_model",
} as const;

/**
 * Default model used when none is selected.
 */
export const DEFAULT_MODEL = "gpt-4o-mini";
