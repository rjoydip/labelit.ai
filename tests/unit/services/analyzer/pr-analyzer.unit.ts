import { describe, expect, it, beforeEach } from "vitest";
import type { TestEnv, TestPRData, TestClassificationResult } from "../../../vitest-types";
import type { PRData } from "../../../../src/types/basic";
import { PRAnalyzer } from "../../../../src/services/analyzer/pull-request";

describe("PRAnalyzer - Additional Edge Cases", () => {
  let prAnalyzer: PRAnalyzer;
  let mockEnv: TestEnv;

  beforeEach(() => {
    mockEnv = {
      KV: {} as any,
      MODEL_NAME: "test-model",
    };

    prAnalyzer = new PRAnalyzer(mockEnv);
  });

  describe("calculateComplexity", () => {
    it("should handle zero values", () => {
      const prData: TestPRData = {
        additions: 0,
        changed_files: 0,
        deletions: 0,
        diff_content: "",
        reviewers: [],
      };

      const complexity = prAnalyzer.calculateComplexity(prData);
      expect(complexity).toBeCloseTo(0);
    });

    it("should handle large numbers", () => {
      const prData: TestPRData = {
        additions: 10000,
        changed_files: 100,
        deletions: 5000,
        diff_content: "",
        reviewers: Array(50).fill("reviewer"),
      };

      const complexity = prAnalyzer.calculateComplexity(prData);
      expect(complexity).toBeGreaterThan(0);
    });

    it("should handle negative inputs (though shouldn't happen in practice)", () => {
      const prData: PRData = {
        additions: -100,
        changed_files: -5,
        deletions: -50,
        diff_content: "",
        reviewers: [],
      } as PRData;

      const complexity = prAnalyzer.calculateComplexity(prData);
      expect(typeof complexity).toBe("number");
    });

    it("should handle decimal values", () => {
      const prData: PRData = {
        additions: 100.5,
        changed_files: 5.2,
        deletions: 50.3,
        diff_content: "",
        reviewers: ["user1", "user2"],
      } as PRData;

      const complexity = prAnalyzer.calculateComplexity(prData);
      expect(typeof complexity).toBe("number");
    });
  });

  describe("calculateRiskScore", () => {
    it("should handle zero values", () => {
      const prData: TestPRData = {
        additions: 0,
        changed_files: 0,
        deletions: 0,
        diff_content: "",
        reviewers: ["user1", "user2"],
      };

      const riskScore = prAnalyzer.calculateRiskScore(prData);
      expect(riskScore).toBeLessThan(0);
    });

    it("should handle no reviewers", () => {
      const prData: TestPRData = {
        additions: 100,
        changed_files: 5,
        deletions: 50,
        diff_content: "",
        reviewers: [],
      };

      const riskScore = prAnalyzer.calculateRiskScore(prData);
      expect(riskScore).toBeGreaterThan(0);
    });

    it("should handle many reviewers", () => {
      const prData: TestPRData = {
        additions: 100,
        changed_files: 5,
        deletions: 50,
        diff_content: "",
        reviewers: Array(20).fill("reviewer"),
      };

      const riskScore = prAnalyzer.calculateRiskScore(prData);
      expect(riskScore).toBeLessThan(0);
    });

    it("should handle large numbers", () => {
      const prData: TestPRData = {
        additions: 10000,
        changed_files: 100,
        deletions: 5000,
        diff_content: "",
        reviewers: Array(10).fill("reviewer"),
      };

      const riskScore = prAnalyzer.calculateRiskScore(prData);
      expect(typeof riskScore).toBe("number");
    });
  });

  describe("parseResponse", () => {
    it("should handle empty text", () => {
      const mockResult: TestClassificationResult = {
        text: "",
        processingTime: 0,
      };

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Testing");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should handle undefined text", () => {
      const mockResult = {
        text: "",
        processingTime: 0,
      } as TestClassificationResult;

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Testing");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should handle null text", () => {
      const mockResult = {
        text: "",
        processingTime: 0,
      } as TestClassificationResult;

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Testing");
      expect(parsed.rawText).toBe("");
      expect(parsed.processingTime).toBe(0);
    });

    it("should be case insensitive for keywords", () => {
      const testCases = [
        { text: "this is a RISK pr", expected: "Risk" },
        { text: "this is a REFACTORING change", expected: "Refactoring" },
        { text: "this is a TESTING update", expected: "Testing" },
        { text: "this is a RiSk Pr", expected: "Risk" },
        { text: "this is a ReFaCtOrInG cHaNgE", expected: "Refactoring" },
        { text: "this is a TeStInG uPdAtE", expected: "Testing" },
      ];

      for (const testCase of testCases) {
        const mockResult: TestClassificationResult = {
          text: testCase.text,
          processingTime: 50,
        };

        const parsed = prAnalyzer.parseResponse(mockResult);
        expect(parsed.predictedLabel).toBe(testCase.expected);
      }
    });

    it("should prioritize keywords when multiple are present", () => {
      const mockResult: TestClassificationResult = {
        text: "this involves refactoring and testing but is risky",
        processingTime: 75,
      };

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Risk");
    });

    it("should handle special characters in text", () => {
      const mockResult: TestClassificationResult = {
        text: "This is a @#$%^&*() RISK !@#$%^&*() PR",
        processingTime: 100,
      };

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Risk");
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(10000) + " RISK " + "B".repeat(10000);
      const mockResult: TestClassificationResult = {
        text: longText,
        processingTime: 200,
      };

      const parsed = prAnalyzer.parseResponse(mockResult);
      expect(parsed.predictedLabel).toBe("Risk");
    });
  });
});
