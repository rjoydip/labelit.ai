import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Ai, KVNamespace } from "@cloudflare/workers-types";
import type { Env, ParseResponse } from "@labelit/types";
import type { ClassificationType } from "@labelit/types/basic";
import { TicketAnalyzer } from "@labelit/services/ticket-analyzer";

function parseResponse(result: any): ParseResponse {
  // First check structured fields (more reliable)
  let predictedLabel = "Task";

  if (Array.isArray(result.labels)) {
    // Check labels array (e.g., ["bug", "urgent"])
    if (result.labels.includes("bug")) predictedLabel = "Bug";
    else if (result.labels.includes("story")) predictedLabel = "Story";
    else if (result.labels.includes("spike")) predictedLabel = "Spike";
  } else if (typeof result.category === "string") {
    // Check category field (e.g., "bug")
    switch (result.category.toLowerCase()) {
      case "bug":
        predictedLabel = "Bug";
        break;
      case "story":
        predictedLabel = "Story";
        break;
      case "spike":
        predictedLabel = "Spike";
        break;
    }
  } else {
    // Fallback to text analysis (less reliable but still useful)
    const normalizedText = result.text?.trim()?.toLowerCase();
    if (normalizedText?.includes("bug")) predictedLabel = "Bug";
    else if (normalizedText?.includes("story")) predictedLabel = "Story";
    else if (normalizedText?.includes("spike")) predictedLabel = "Spike";
  }

  return {
    predictedLabel: predictedLabel as "Bug" | "Story" | "Task" | "Spike",
    rawText: result.text || "",
    processingTime: result.processingTime || 0,
  };
}

// Mock the AI module entirely
vi.mock("@labelit/ai/processor", () => {
  return {
    AIProcessor: vi.fn().mockImplementation(() => {
      return {
        classify: vi.fn().mockImplementation(async () => {
          return {
            text: "Mock classification result",
            processingTime: 100,
          };
        }),
        parseResponse: vi.fn().mockImplementation((result) => {
          return parseResponse(result);
        }),
      };
    }),
    __esModule: true,
  };
});

describe("TicketAnalyzer", () => {
  let ticketAnalyzer: TicketAnalyzer;

  beforeEach(() => {
    // Mock environment

    const mockEnv: Env = {
      AI: {} as Ai,
      MODEL_NAME: "test-model",
      KV: {} as KVNamespace<string>,
      CACHE_TTL: "3600",
      CACHE_NAMESPACE: "test-cache",
      GITHUB_WEBHOOK_SECRET: "test-secret",
      GITLAB_WEBHOOK_SECRET: "test-secret",
      JIRA_WEBHOOK_SECRET: "test-secret",
    };

    ticketAnalyzer = new TicketAnalyzer(mockEnv);
  });

  it("should classify PR content", async () => {
    const result = await ticketAnalyzer.classify({ system: "", user: "" }, {} as any);

    expect(result).toBeDefined();
    expect(result.text).toBe("Mock classification result");
    expect(result.processingTime).toBe(100);
  });

  it("should parse response as Bug when text contains 'bug'", () => {
    const mockResult: ClassificationType = {
      text: "This is definitely a Bug issue",
      processingTime: 75,
    };

    const parsed = ticketAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Bug");
    expect(parsed.rawText).toBe("This is definitely a Bug issue");
    expect(parsed.processingTime).toBe(75);
  });

  it("should parse response as Story when text contains 'story'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Story enhancement",
      processingTime: 60,
    };

    const parsed = ticketAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Story");
    expect(parsed.rawText).toBe("This is a Story enhancement");
    expect(parsed.processingTime).toBe(60);
  });

  it("should parse response as Spike when text contains 'spike'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Spike investigation",
      processingTime: 90,
    };

    const parsed = ticketAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Spike");
    expect(parsed.rawText).toBe("This is a Spike investigation");
    expect(parsed.processingTime).toBe(90);
  });

  it("should default to Task when no keywords match", () => {
    const mockResult: ClassificationType = {
      text: "Some other classification",
      processingTime: 45,
    };

    const parsed = ticketAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Task");
    expect(parsed.rawText).toBe("Some other classification");
    expect(parsed.processingTime).toBe(45);
  });
});
