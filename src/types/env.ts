export interface Env {
  KV: KVNamespace;
  AI?: Ai;
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  GITHUB_APP_INSTALLATION_ID?: string;
  GITHUB_PROVIDER?: GitHubProvider;
  PI_PROVIDER?: "openai" | "anthropic" | "google" | "local";
  PI_API_KEY?: string;
  PI_MODEL_NAME?: string;
  MODEL_NAME?: string;
  CACHE_TTL?: string;
  CACHE_NAMESPACE?: string;
}

export interface GitHubProvider {
  type: "actions" | "app";
  authenticate(): Promise<void>;
  getIssues(options: {
    owner: string;
    repo: string;
    state?: string;
    per_page?: number;
    page?: number;
  }): Promise<
    { id: number; number: number; title: string; body: string; labels: string[]; state: string }[]
  >;
  getPullRequests(options: {
    owner: string;
    repo: string;
    state?: string;
    per_page?: number;
    page?: number;
  }): Promise<
    { id: number; number: number; title: string; body: string; labels: string[]; state: string }[]
  >;
  addLabels(target: string, labels: string[]): Promise<void>;
  removeLabels(target: string, labels: string[]): Promise<void>;
  getRepository(options: {
    owner: string;
    repo: string;
  }): Promise<{ name: string; full_name: string; description: string }>;
  getLabels(target: string): Promise<string[]>;
  getRepositoryLabels(
    owner: string,
    repo: string,
  ): Promise<{ name: string; color?: string; description?: string }[]>;
  createLabel(
    owner: string,
    repo: string,
    label: { name: string; color?: string; description?: string },
  ): Promise<void>;
  getPRDiff(owner: string, repo: string, number: number): Promise<string>;
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
