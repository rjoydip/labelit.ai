export interface Env {
  KV: KVNamespace;
  AI?: Ai;
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  PI_PROVIDER?: "openai" | "anthropic" | "google" | "local";
  PI_API_KEY?: string;
  PI_MODEL_NAME?: string;
  MODEL_NAME?: string;
}

export interface KVNamespace {
  get(key: string, options?: { type: "text" | "json" }): Promise<string | null>;
  put(key: string, value: string | object): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

export interface Ai {
  run(model: string, inputs: Record<string, unknown>): Promise<{ response: string }>;
}
