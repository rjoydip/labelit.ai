import { describe, expect, it, beforeEach } from "vitest";
import type { Env } from "../../../src/types/env";
import type { PRData } from "../../../src/types/basic";
import { PRAnalyzer } from "../../../src/services/analyzer/pull-request";
import type { ClassificationType } from "../../../src/types/basic";

describe("PRAnalyzer", () => {
  let prAnalyzer: PRAnalyzer;

  beforeEach(() => {
    const mockEnv: Env = {
      KV: {} as any,
      MODEL_NAME: "test-model",
    };

    prAnalyzer = new PRAnalyzer(mockEnv);
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

    expect(riskScore).toBeCloseTo(-1.168, 2);
  });

  it("should parse response as Risk when text contains 'risk'", () => {
    const mockResult: ClassificationType = {
      text: "This is definitely a Risk PR",
      processingTime: 75,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Risk");
    expect(parsed.rawText).toBe("This is definitely a Risk PR");
    expect(parsed.processingTime).toBe(75);
  });

  it("should parse response as Refactoring when text contains 'refactor'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Refactoring change",
      processingTime: 60,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Refactoring");
    expect(parsed.rawText).toBe("This is a Refactoring change");
    expect(parsed.processingTime).toBe(60);
  });

  it("should parse response as Testing when text contains 'test'", () => {
    const mockResult: ClassificationType = {
      text: "This is a Testing update",
      processingTime: 90,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Testing");
    expect(parsed.rawText).toBe("This is a Testing update");
    expect(parsed.processingTime).toBe(90);
  });

  it("should default to Testing when no keywords match", () => {
    const mockResult: ClassificationType = {
      text: "Some other classification",
      processingTime: 45,
    };

    const parsed = prAnalyzer.parseResponse(mockResult);

    expect(parsed.predictedLabel).toBe("Testing");
    expect(parsed.rawText).toBe("Some other classification");
    expect(parsed.processingTime).toBe(45);
  });
});
