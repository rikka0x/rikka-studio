export type GenerateRequest = {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
};

export type GenerateResponse = {
  mode: "demo" | "api";
  model: string;
  output: string;
  createdAt: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};
