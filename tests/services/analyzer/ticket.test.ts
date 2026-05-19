import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Env } from "../../../src/types/env";
import type { ClassificationType } from "../../../src/types/basic";
import { TicketAnalyzer } from "../../../src/services/analyzer/ticket";

function parseResponse(result: any) {
  let predictedLabel = "Task";

  if (Array.isArray(result.labels)) {
    if (result.labels.includes("bug")) predictedLabel = "Bug";
    else if (result.labels.includes("story")) predictedLabel = "Story";
    else if (result.labels.includes("spike")) predictedLabel = "Spike";
  } else if (typeof result.category === "string") {
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
    const normalizedText = result.text?.trim()?.toLowerCase();
    if (normalizedText?.includes("bug")) predictedLabel = "Bug";
    else if (normalizedText?.includes("story")) predictedLabel = "Story";
    else if (normalizedText?.includes("spike")) predictedLabel = "Spike";
  }

  return {
    predictedLabel,
    rawText: result.text || "",
    processingTime: result.processingTime || 0,
  };
}

vi.mock("../../../src/ai/processor", () => {
  return {
    AIProcessor: vi.fn().mockImplementation(function () {
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
    const mockEnv: Env = {
      KV: {} as any,
      MODEL_NAME: "test-model",
    };

    ticketAnalyzer = new TicketAnalyzer(mockEnv);
  });

  it("should classify ticket content", async () => {
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
