import type { AnalyzeRequest, AnalyzeResponse, ServerConfig } from "./types";

export class APIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ServerConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json() as T;
  }

  async getStatus(): Promise<{ status: string; version: string; timestamp: number }> {
    return this.request("GET", "/api/status");
  }

  async addLabels(
    target: string,
    labels: string[],
  ): Promise<{ success: boolean; target: string; labels: string[] }> {
    return this.request("POST", "/api/labels/add", { target, labels });
  }

  async removeLabels(
    target: string,
    labels: string[],
  ): Promise<{ success: boolean; target: string; labels: string[] }> {
    return this.request("POST", "/api/labels/remove", { target, labels });
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request("POST", "/api/analyze", request);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getStatus();
      return response.status === "ok";
    } catch {
      return false;
    }
  }
}

export async function createAPIClient(url?: string, apiKey?: string): Promise<APIClient> {
  const baseUrl = url || process.env.LABELIT_API_URL || "http://localhost:8787";
  const key = apiKey || process.env.LABELIT_API_KEY || "";

  return new APIClient({ url: baseUrl, apiKey: key });
}
