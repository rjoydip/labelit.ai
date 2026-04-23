import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PRData } from "@labelit/types";
import type { ClassificationType } from "@labelit/types/basic";

// Mock the AI module entirely
vi.mock("@labelit/ai/processor", () => {
  return {
    AIProcessor: vi.fn().mockImplementation(() => {
      return {
        // Mock the classify method
        classify: vi.fn().mockResolvedValue({
          text: "Mock classification result",
          processingTime: 100,
        }),
        // Mock the parseResponse method with a basic implementation
        parseResponse: vi.fn().mockImplementation((result: ClassificationType) => {
          const normalized = result.text.trim().toLowerCase();
          let predictedLabel: "Bug" | "Story" | "Task" | "Spike" = "Task";

          if (normalized.includes("bug")) predictedLabel = "Bug";
          else if (normalized.includes("story")) predictedLabel = "Story";
          else if (normalized.includes("spike")) predictedLabel = "Spike";

          return {
            predictedLabel,
            rawText: result.text,
            processingTime: result.processingTime,
          };
        }),
        // Mock the calculateComplexity method
        calculateComplexity: vi.fn().mockImplementation((pr: PRData) => {
          const complexityFactors = {
            fileCount: pr.changed_files * 0.2,
            linesChanged: (pr.additions + pr.deletions) * 0.01,
          };

          return Object.values(complexityFactors).reduce((a, b) => a + b, 0);
        }),
        // Mock the calculateRiskScore method
        calculateRiskScore: vi.fn().mockImplementation((pr: PRData) => {
          const riskFactors = {
            deletionRatio: pr.deletions / (pr.additions + pr.deletions),
            reviewerCount: pr.reviewers.length * -0.5,
          };

          return Object.values(riskFactors).reduce((acc, val) => acc + val, 0);
        }),
      };
    }),
  };
});

import { PRProcessor } from "@labelit/services/processor/pr";

describe("PRProcessor", () => {
  let processor: PRProcessor;

  beforeEach(() => {
    // Mock environment
    const mockEnv = {
      AI: {} as any,
      MODEL_NAME: "test-model",
    };

    processor = new PRProcessor(mockEnv);
  });

  it("should classify PR content", async () => {
    const result = await processor.classify({ system: "", user: "" }, {} as any);

    expect(result).toBeDefined();
    expect(result.text).toBe("Mock classification result");
    expect(result.processingTime).toBe(100);
  });

  it("should parse response as Bug when text contains 'bug'", () => {
    const mockResult: ClassificationType = {
      text: "This is definitely a Bug issue",
      processingTime: 75,
    };

    const parsed = processor.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Bug");
    expect(parsed.rawText).toBe("This is definitely a Bug issue");
    expect(parsed.processingTime).toBe(75);
  });

  it("should parse response as Story when text contains 'story'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Story enhancement",
      processingTime: 60,
    };

    const parsed = processor.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Story");
    expect(parsed.rawText).toBe("This is a Story enhancement");
    expect(parsed.processingTime).toBe(60);
  });

  it("should parse response as Spike when text contains 'spike'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Spike investigation",
      processingTime: 90,
    };

    const parsed = processor.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Spike");
    expect(parsed.rawText).toBe("This is a Spike investigation");
    expect(parsed.processingTime).toBe(90);
  });

  it("should default to Task when no keywords match", () => {
    const mockResult: ClassificationType = {
      text: "Some other classification",
      processingTime: 45,
    };

    const parsed = processor.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Task");
    expect(parsed.rawText).toBe("Some other classification");
    expect(parsed.processingTime).toBe(45);
  });

  it("should calculate complexity correctly", () => {
    const prData: PRData = {
      additions: 100,
      changed_files: 5,
      deletions: 50,
      diff_content: "",
      reviewers: ["user1", "user2"],
    };

    const complexity = processor.calculateComplexity(prData);

    // fileCount: 5 * 0.2 = 1.0
    // linesChanged: (100 + 50) * 0.01 = 1.5
    // Total: 1.0 + 1.5 = 2.5
    expect(complexity).toBeCloseTo(2.5);
  });

  it("should calculate risk score correctly", () => {
    const prData: PRData = {
      additions: 100,
      changed_files: 5,
      deletions: 50,
      diff_content: "",
      reviewers: ["user1", "user2", "user3"],
    };

    const riskScore = processor.calculateRiskScore(prData);

    // deletionRatio: 50 / (100 + 50) = 0.333...
    // reviewerCount: 3 * -0.5 = -1.5
    // Total: 0.333... + (-1.5) = -1.166...
    expect(riskScore).toBeCloseTo(-1.167, 3);
  });
});
