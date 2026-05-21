import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Env } from "../../../src/types/env";
import type { ClassificationType } from "../../../src/types/basic";
import { TicketAnalyzer } from "../../../src/services/analyzer/ticket";

// Mock the global fetch function
const originalFetch = global.fetch;

describe("TicketAnalyzer", () => {
  let ticketAnalyzer: TicketAnalyzer;

  beforeEach(() => {
    const mockEnv: Env = {
      KV: {} as any,
      MODEL_NAME: "test-model",
      PI_API_KEY: "test-key",
      PI_PROVIDER: "openai",
    };

    ticketAnalyzer = new TicketAnalyzer(mockEnv);

    // Mock fetch to return successful response with a small delay to ensure processingTime > 0
    (global.fetch as any) = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                choices: [
                  {
                    message: {
                      content: "Mock classification result",
                    },
                  },
                ],
              }),
            } as Response);
          }, 10); // 10ms delay to ensure processingTime > 0
        }),
    );
  });

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    vi.restoreAllMocks();
  });

  it("should classify ticket content", async () => {
    const result = await ticketAnalyzer.classify({ system: "", user: "" }, {} as any);

    expect(result).toBeDefined();
    expect(result.text).toBe("Mock classification result");
    expect(result.processingTime).toBeGreaterThan(0);

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalled();
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
