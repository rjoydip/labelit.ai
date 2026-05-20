export interface CLICommand {
  name: string;
  description: string;
  run: (args: string[], options: CLIOptions) => Promise<void>;
}

export interface CLIOptions {
  apiUrl?: string;
  apiKey?: string;
  verbose?: boolean;
  json?: boolean;
}

export interface ServerConfig {
  url: string;
  apiKey: string;
}

export interface LabelOperation {
  action: "add" | "remove";
  target: string;
  labels: string[];
}

export interface AnalyzeRequest {
  type: "issue" | "pull_request";
  title: string;
  body?: string;
  target: string;
}

export interface AnalyzeResponse {
  labels: string[];
  confidence: number;
}

export interface StatusResponse {
  status: "ok" | "error";
  version: string;
  uptime: number;
}

export const DEFAULT_API_URL = "http://localhost:8787";
export const DEFAULT_CONFIG_PATH = "~/.labelit/config.json";
