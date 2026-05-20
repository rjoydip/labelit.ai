import { Agent, type AgentEvent } from "@earendil-works/pi-agent-core";
import { streamSimple, type Tool, Type } from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { labelingPrompt } from "../ai/prompts";

export { labelingPrompt };

export type { AgentEvent, Tool };

export interface AIConfig {
  provider: "openai" | "anthropic" | "google" | "local";
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export class PiAI {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  createStreamFn() {
    return streamSimple;
  }
}

export interface LabelingToolResult {
  success: boolean;
  target: string;
  labels: string[];
}

export function createAddLabelsTool(
  addLabelsFn: (target: string, labels: string[]) => Promise<void>,
): AgentTool {
  return {
    name: "add_labels",
    label: "Add Labels",
    description: "Add labels to an issue or pull request",
    parameters: Type.Object({
      target: Type.String({ description: "The issue or PR identifier (owner/repo#number)" }),
      labels: Type.Array(Type.String(), { description: "Labels to add" }),
    }),
    execute: async (toolCallId, params) => {
      const typedParams = params as { target: string; labels: string[] };
      await addLabelsFn(typedParams.target, typedParams.labels);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              target: typedParams.target,
              labels: typedParams.labels,
            }),
          },
        ],
        details: { success: true, target: typedParams.target, labels: typedParams.labels },
      };
    },
  };
}

export function createRemoveLabelsTool(
  removeLabelsFn: (target: string, labels: string[]) => Promise<void>,
): AgentTool {
  return {
    name: "remove_labels",
    label: "Remove Labels",
    description: "Remove labels from an issue or pull request",
    parameters: Type.Object({
      target: Type.String({ description: "The issue or PR identifier (owner/repo#number)" }),
      labels: Type.Array(Type.String(), { description: "Labels to remove" }),
    }),
    execute: async (toolCallId, params) => {
      const typedParams = params as { target: string; labels: string[] };
      await removeLabelsFn(typedParams.target, typedParams.labels);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              target: typedParams.target,
              labels: typedParams.labels,
            }),
          },
        ],
        details: { success: true, target: typedParams.target, labels: typedParams.labels },
      };
    },
  };
}

export function createAnalyzeContentTool(): AgentTool {
  return {
    name: "analyze_content",
    label: "Analyze Content",
    description: labelingPrompt,
    parameters: Type.Object({
      title: Type.String(),
      body: Type.Optional(Type.String()),
      type: Type.Union([Type.Literal("issue"), Type.Literal("pull_request")]),
    }),
    execute: async (toolCallId, params) => {
      const typedParams = params as {
        title: string;
        body?: string;
        type: "issue" | "pull_request";
      };
      const title = typedParams.title;
      const body = typedParams.body || "";
      const type = typedParams.type;

      const labels: string[] = [];

      const titleLower = title.toLowerCase();
      const bodyLower = body.toLowerCase();

      if (
        titleLower.includes("bug") ||
        titleLower.includes("fix") ||
        bodyLower.includes("error") ||
        bodyLower.includes("crash")
      ) {
        labels.push("type:bug");
      } else if (
        titleLower.includes("feat") ||
        titleLower.includes("add") ||
        titleLower.includes("implement")
      ) {
        labels.push("type:feature");
      } else if (titleLower.includes("refactor")) {
        labels.push("type:refactoring");
      } else if (titleLower.includes("test") || titleLower.includes("coverage")) {
        labels.push("type:test");
      } else if (titleLower.includes("doc") || titleLower.includes("readme")) {
        labels.push("type:documentation");
      }

      if (bodyLower.includes("critical") || bodyLower.includes("urgent")) {
        labels.push("priority:high");
      } else if (bodyLower.includes("low priority")) {
        labels.push("priority:low");
      } else {
        labels.push("priority:medium");
      }

      if (type === "pull_request") {
        if (bodyLower.includes("breaking") || bodyLower.includes("major")) {
          labels.push("breaking:yes");
        }
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ suggestedLabels: labels }) }],
        details: { suggestedLabels: labels },
      };
    },
  };
}

export class AgentCore {
  private agent: Agent;
  private tools: AgentTool[] = [];

  constructor(options?: {
    tools?: AgentTool[];
    systemPrompt?: string;
    getApiKey?: (provider: string) => string | undefined;
  }) {
    this.tools = options?.tools || [];

    this.agent = new Agent({
      initialState: {
        systemPrompt: options?.systemPrompt || "",
        tools: this.tools,
      },
      getApiKey: options?.getApiKey,
      streamFn: streamSimple,
    });
  }

  addTool(tool: AgentTool): void {
    this.tools.push(tool);
    this.agent.state.tools = this.tools;
  }

  removeTool(name: string): void {
    this.tools = this.tools.filter((t) => t.name !== name);
    this.agent.state.tools = this.tools;
  }

  async run(input: unknown): Promise<void> {
    const content = typeof input === "string" ? input : JSON.stringify(input);
    await this.agent.prompt(content);
  }

  subscribe(
    listener: (event: AgentEvent, signal: AbortSignal) => Promise<void> | void,
  ): () => void {
    return this.agent.subscribe(listener);
  }

  get state() {
    return this.agent.state;
  }

  abort(): void {
    this.agent.abort();
  }

  async waitForIdle(): Promise<void> {
    await this.agent.waitForIdle();
  }
}
