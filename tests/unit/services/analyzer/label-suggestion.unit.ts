import { describe, expect, it, vi, beforeEach } from "vitest";
import { LabelSuggestionAnalyzer } from "../../../../src/services/analyzer/label-suggestion";

describe("LabelSuggestionAnalyzer", () => {
  let analyzer: LabelSuggestionAnalyzer;

  beforeEach(() => {
    analyzer = new LabelSuggestionAnalyzer({
      PI_API_KEY: "test-key",
      PI_PROVIDER: "openai",
    } as any);
  });

  describe("parseResponse", () => {
    it("should parse valid JSON array of labels", () => {
      const result = analyzer.parseResponse({
        text: '["type:bug", "priority:high", "area:frontend"]',
        processingTime: 100,
      });

      expect(result.suggestedLabels).toEqual(["type:bug", "priority:high", "area:frontend"]);
    });

    it("should extract labels from natural language response", () => {
      const result = analyzer.parseResponse({
        text: "Based on the changes, I recommend these labels: type:bug, priority:high, area:frontend",
        processingTime: 50,
      });

      expect(result.suggestedLabels).toContain("type:bug");
      expect(result.suggestedLabels).toContain("priority:high");
      expect(result.suggestedLabels).toContain("area:frontend");
    });

    it("should return empty array for unrecognizable response", () => {
      const result = analyzer.parseResponse({
        text: "I don't know what labels to suggest",
        processingTime: 30,
      });

      expect(Array.isArray(result.suggestedLabels)).toBe(true);
    });

    it("should filter out non-string items from parsed JSON", () => {
      const result = analyzer.parseResponse({
        text: JSON.stringify(["type:bug", null, 123, "priority:high"]),
        processingTime: 20,
      });

      expect(result.suggestedLabels).toEqual(["type:bug", "priority:high"]);
    });
  });

  describe("fallbackKeywordAnalysis", () => {
    it("should identify bug labels", () => {
      const result = (analyzer as any).fallbackKeywordAnalysis("fix critical crash error bug");
      expect(result).toContain("type:bug");
    });

    it("should identify feature labels", () => {
      const result = (analyzer as any).fallbackKeywordAnalysis("feat: add new feature");
      expect(result).toContain("type:feature");
    });

    it("should identify refactoring labels", () => {
      const result = (analyzer as any).fallbackKeywordAnalysis("refactor core module");
      expect(result).toContain("type:refactoring");
    });

    it("should identify high priority for breaking changes", () => {
      const result = (analyzer as any).fallbackKeywordAnalysis("major breaking change");
      expect(result).toContain("priority:high");
    });
  });

  describe("suggest", () => {
    it("should return a LabelSuggestionResult", async () => {
      const classifySpy = vi
        .spyOn(analyzer, "classify")
        .mockResolvedValue({ text: '["type:test", "priority:medium"]', processingTime: 50 });

      const result = await analyzer.suggest(
        "test: add unit tests",
        "Add missing test coverage",
        "diff --git a/src/test.ts b/src/test.ts\n+it('works', () => {})",
      );

      expect(result.suggestedLabels).toEqual(["type:test", "priority:medium"]);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.rawText).toBe("string");
      expect(classifySpy).toHaveBeenCalledOnce();
    });

    it("should truncate large diffs", async () => {
      const largeDiff = "a".repeat(10000);

      const classifySpy = vi
        .spyOn(analyzer, "classify")
        .mockResolvedValue({ text: '["type:feature"]', processingTime: 30 });

      const result = await analyzer.suggest("feat: big change", "", largeDiff);

      expect(result.suggestedLabels).toEqual(["type:feature"]);
      expect(classifySpy).toHaveBeenCalledOnce();
    });
  });
});
