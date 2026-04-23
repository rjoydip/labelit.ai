import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Ai, KVNamespace } from "@cloudflare/workers-types";
import type { Env, ParseResponse, PRData } from "@labelit/types";
import type { ClassificationType } from "@labelit/types/basic";
import { PRAnalyzer } from "@labelit/services/pr-analyzer";

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
        calculateComplexity: vi.fn((pr: PRData) => {
          // Basic complexity mock: returns sum of fileCount + linesChanged
          const fileCount = pr.changed_files * 0.2;
          const linesChanged = (pr.additions + pr.deletions) * 0.01;
          return fileCount + linesChanged;
        }),

        calculateRiskScore: vi.fn((pr: PRData) => {
          // Basic risk mock: returns deletionRatio + inverse reviewer count
          const deletionRatio = pr.deletions / (pr.additions + pr.deletions) || 0;
          const reviewerCount = pr.reviewers.length * -0.5;
          return deletionRatio + reviewerCount;
        }),
      };
    }),
    __esModule: true,
  };
});

describe("PRAnalyzer", () => {
  let prAnalyzer: PRAnalyzer;

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

    prAnalyzer = new PRAnalyzer(mockEnv);
  });

  it("should classify PR content", async () => {
    const result = await prAnalyzer.classify({ system: "", user: "" }, {} as any);

    expect(result).toBeDefined();
    expect(result.text).toBe("Mock classification result");
    expect(result.processingTime).toBe(100);
  });

  it("should parse response as Bug when text contains 'bug'", () => {
    const mockResult: ClassificationType = {
      text: "This is definitely a Bug issue",
      processingTime: 75,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Bug");
    expect(parsed.rawText).toBe("This is definitely a Bug issue");
    expect(parsed.processingTime).toBe(75);
  });

  it("should parse response as Story when text contains 'story'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Story enhancement",
      processingTime: 60,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Story");
    expect(parsed.rawText).toBe("This is a Story enhancement");
    expect(parsed.processingTime).toBe(60);
  });

  it("should parse response as Spike when text contains 'spike'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Spike investigation",
      processingTime: 90,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Spike");
    expect(parsed.rawText).toBe("This is a Spike investigation");
    expect(parsed.processingTime).toBe(90);
  });

  it("should default to Task when no keywords match", () => {
    const mockResult: ClassificationType = {
      text: "Some other classification",
      processingTime: 45,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

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

    const complexity = prAnalyzer.calculateComplexity(prData);

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

    const riskScore = prAnalyzer.calculateRiskScore(prData);

    // deletionRatio: 50 / (100 + 50) = 0.333...
    // reviewerCount: 3 * -0.5 = -1.5
    // Total: 0.333... + (-1.5) = -1.166...
    expect(riskScore).toBeCloseTo(-1.167, 3);
  });
});
