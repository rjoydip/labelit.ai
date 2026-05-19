import type { Env } from "../types/env";
import type { ClassificationType, Prompt } from "../types/basic";

export abstract class AIProcessor<T> {
  protected client: {
    provider: string;
    apiKey: string;
    model: string;
    baseURL: string;
  };

  constructor(env: Env) {
    const provider = env.PI_PROVIDER || "openai";
    const apiKey = env.PI_API_KEY || "";
    const model = env.PI_MODEL_NAME || env.MODEL_NAME || "gpt-4";

    this.client = {
      provider,
      apiKey,
      model,
      baseURL: this.getBaseURL(provider),
    };
  }

  private getBaseURL(provider: string): string {
    switch (provider) {
      case "openai":
        return "https://api.openai.com/v1";
      case "anthropic":
        return "https://api.anthropic.com/v1";
      case "google":
        return "https://generativelanguage.googleapis.com/v1";
      case "local":
        return "http://localhost:8080/v1";
      default:
        return "https://api.openai.com/v1";
    }
  }

  public async classify<TContent>(prompt: Prompt, content: TContent): Promise<ClassificationType> {
    const startTime = Date.now();

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    const messages = [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user ? `${prompt.user}\n\n${contentStr}` : contentStr },
    ];

    const response = await this.makeRequest(messages);

    const result: ClassificationType = {
      text: response,
      processingTime: Date.now() - startTime,
    };

    return result;
  }

  private async makeRequest(messages: { role: string; content: string }[]): Promise<string> {
    const { provider, apiKey, model, baseURL } = this.client;

    if (!apiKey) {
      console.warn("PI_API_KEY not set, using default response");
      return "Task";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider === "openai" || provider === "google") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    }

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    };

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("AI request failed:", error);
      return "Task";
    }
  }

  public abstract getPrompt(userPrompt: string): Prompt;
  public abstract parseResponse(result: ClassificationType): T;
}
