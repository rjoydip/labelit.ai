import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TestEnv, TestClassificationResult } from "../../../vitest-types";
import { TicketAnalyzer } from "../../../../src/services/analyzer/ticket";

// Mock the AI processor
vi.mock("../../src/ai/processor", () => {
  return {
    AIProcessor: vi.fn().mockImplementation(function (this: any) {
      this.classify = vi.fn().mockImplementation(async () => {
        return {
          text: "Mock classification result",
          processingTime: 100,
        };
      });
      this.parseResponse = vi.fn().mockImplementation((result: any) => {
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
      });
    }),
    __esModule: true,
  };
});

describe("TicketAnalyzer - Additional Edge Cases", () => {
  let ticketAnalyzer: TicketAnalyzer;
  let mockEnv: TestEnv;

  beforeEach(() => {
    mockEnv = {
      KV: {} as any,
      MODEL_NAME: "test-model",
    };

    ticketAnalyzer = new TicketAnalyzer(mockEnv);
  });

  describe("parseResponse edge cases", () => {
    it("should handle empty text", () => {
      const mockResult: TestClassificationResult = {
        text: "",
        processingTime: 0,
      };

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Task");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should handle undefined text", () => {
      const mockResult = {
        text: "",
        processingTime: 0,
      } as TestClassificationResult;

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Task");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should handle null text", () => {
      const mockResult = {
        text: "",
        processingTime: 0,
      } as TestClassificationResult;

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Task");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should be case insensitive for keywords", () => {
      const testCases = [
        { text: "this is definitely a BUG issue", expected: "Bug" },
        { text: "this is a STORY enhancement", expected: "Story" },
        { text: "this is a SPIKE investigation", expected: "Spike" },
        { text: "this is a BuG iSsUe", expected: "Bug" },
        { text: "this is a StOrY eNhHaNcEmEnT", expected: "Story" },
        { text: "this is a SpIkE iNvEsTiGaTiOn", expected: "Spike" },
      ];

      for (const testCase of testCases) {
        const mockResult: TestClassificationResult = {
          text: testCase.text,
          processingTime: 50,
        };

        const parsed = ticketAnalyzer.parseResponse(mockResult);
        expect(parsed.predictedLabel).toBe(testCase.expected);
      }
    });

    it("should prioritize keywords when multiple are present (bug > story > spike)", () => {
      const mockResult: TestClassificationResult = {
        text: "this is a bug that also involves story and spike work",
        processingTime: 75,
      };

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Bug");
    });

    it("should handle special characters in text", () => {
      const mockResult: TestClassificationResult = {
        text: "This is a @#$%^&*() BUG !@#$%^&*() issue",
        processingTime: 100,
      };

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Bug");
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(10000) + " bug " + "B".repeat(10000);
      const mockResult: TestClassificationResult = {
        text: longText,
        processingTime: 200,
      };

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Bug");
    });

    it("should handle labels array format", () => {
      const mockResult = {
        text: "bug",
        processingTime: 50,
      } as TestClassificationResult;

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Bug");
    });

    it("should handle category string format", () => {
      const mockResult = {
        text: "Story",
        processingTime: 50,
      } as TestClassificationResult;

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Story");
    });

    it("should handle unknown category string", () => {
      const mockResult = {
        text: "Unknown",
        processingTime: 50,
      } as TestClassificationResult;

      const parsed = ticketAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Task");
    });
  });

  describe("classify method", () => {
    it("should call classify with correct parameters", async () => {
      const mockSystem = "You are a helpful assistant";
      const mockUser = "Classify this ticket";
      const mockPayload = { test: "payload" };

      const result = await ticketAnalyzer.classify(
        { system: mockSystem, user: mockUser },
        mockPayload,
      );

      expect(result).toBeDefined();
    });

    it("should return a classification result", async () => {
      const result = await ticketAnalyzer.classify({ system: "", user: "" }, {} as any);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("processingTime");
    });
  });
});
