import { describe, expect, it, vi, beforeEach } from "vitest";
import { LabelService } from "../../../src/services/label.service";
import { LabelSuggestionAnalyzer } from "../../../src/services/analyzer/label-suggestion";

function createMockProvider() {
  return {
    type: "actions" as const,
    authenticate: vi.fn(),
    getIssues: vi.fn(),
    getPullRequests: vi.fn(),
    addLabels: vi.fn(),
    removeLabels: vi.fn(),
    getRepository: vi.fn(),
    getLabels: vi.fn(),
    getRepositoryLabels: vi.fn(),
    createLabel: vi.fn(),
    getPRDiff: vi.fn(),
  };
}

function createMockEnv(): any {
  return {
    PI_API_KEY: "test-key",
    PI_PROVIDER: "openai",
  };
}

describe("LabelService", () => {
  let provider: ReturnType<typeof createMockProvider>;
  let service: LabelService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(LabelSuggestionAnalyzer.prototype, "suggest").mockResolvedValue({
      suggestedLabels: ["type:feature", "priority:medium"],
      rawText: '["type:feature", "priority:medium"]',
      processingTime: 10,
    });
    provider = createMockProvider();
    service = new LabelService(provider, createMockEnv());
  });

  describe("analyzeAndSyncPR", () => {
    it("should fetch diff, suggest labels, and sync", async () => {
      provider.getPRDiff.mockResolvedValue(
        "diff --git a/src/index.ts b/src/index.ts\n+console.log('hello')",
      );
      provider.getLabels.mockResolvedValue(["priority:low"]);
      provider.getRepositoryLabels.mockResolvedValue([
        { name: "priority:low", color: "0e8a16" },
        { name: "priority:medium", color: "fbca04" },
        { name: "type:feature", color: "a2eeef" },
      ]);

      const result = await service.analyzeAndSyncPR("owner", "repo", 1, "feat: add logging", "");

      expect(provider.getPRDiff).toHaveBeenCalledWith("owner", "repo", 1);
      expect(provider.getLabels).toHaveBeenCalledWith("owner/repo#1");
      expect(provider.removeLabels).toHaveBeenCalledWith("owner/repo#1", ["priority:low"]);
      expect(provider.getRepositoryLabels).toHaveBeenCalledWith("owner", "repo");
      expect(provider.createLabel).not.toHaveBeenCalled();
      expect(provider.addLabels).toHaveBeenCalledWith("owner/repo#1", [
        "type:feature",
        "priority:medium",
      ]);
      expect(result.added).toEqual(["type:feature", "priority:medium"]);
      expect(result.removed).toContain("priority:low");
    });

    it("should create missing labels before adding", async () => {
      provider.getPRDiff.mockResolvedValue("diff --git a/src/app.ts b/src/app.ts\n+newFeature()");
      provider.getLabels.mockResolvedValue([]);
      provider.getRepositoryLabels.mockResolvedValue([
        { name: "priority:medium", color: "fbca04" },
      ]);

      const result = await service.analyzeAndSyncPR(
        "owner",
        "repo",
        2,
        "feat: add feature",
        "New feature implementation",
      );

      expect(provider.createLabel).toHaveBeenCalledOnce();
      expect(provider.createLabel).toHaveBeenCalledWith("owner", "repo", {
        name: "type:feature",
        color: "a2eeef",
        description: "New feature or request",
      });
      expect(provider.addLabels).toHaveBeenCalledWith("owner/repo#2", [
        "type:feature",
        "priority:medium",
      ]);
      expect(result.added).toEqual(["type:feature", "priority:medium"]);
    });

    it("should handle empty diff gracefully", async () => {
      provider.getPRDiff.mockResolvedValue("");
      provider.getLabels.mockResolvedValue([]);
      provider.getRepositoryLabels.mockResolvedValue([]);

      const result = await service.analyzeAndSyncPR("owner", "repo", 3, "test: update tests", "");

      expect(result.added).toEqual(["type:feature", "priority:medium"]);
      expect(result.removed).toEqual([]);
      expect(provider.createLabel).toHaveBeenCalledTimes(2);
    });
  });

  describe("computeLabelDiff", () => {
    it("should identify labels to add and remove", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        ["type:bug", "priority:low"],
        ["type:bug", "priority:high", "area:frontend"],
      );

      expect(toAdd).toEqual(["priority:high", "area:frontend"]);
      expect(toRemove).toEqual(["priority:low"]);
    });

    it("should return empty arrays when current matches suggested", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        ["type:feature", "priority:medium"],
        ["type:feature", "priority:medium"],
      );

      expect(toAdd).toEqual([]);
      expect(toRemove).toEqual([]);
    });

    it("should add all labels when current is empty", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        [],
        ["type:bug", "priority:high"],
      );

      expect(toAdd).toEqual(["type:bug", "priority:high"]);
      expect(toRemove).toEqual([]);
    });

    it("should not remove any labels when suggested is empty", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        ["type:bug", "priority:high"],
        [],
      );

      expect(toAdd).toEqual([]);
      expect(toRemove).toEqual([]);
    });

    it("should never remove human-added labels", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        ["type:bug", "needs review", "good first issue"],
        ["type:feature"],
      );

      expect(toAdd).toEqual(["type:feature"]);
      expect(toRemove).toEqual(["type:bug"]);
    });

    it("should leave labels untouched when a human label is the only current one", () => {
      const { toAdd, toRemove } = (service as any).computeLabelDiff(
        ["needs review"],
        ["type:feature"],
      );

      expect(toAdd).toEqual(["type:feature"]);
      expect(toRemove).toEqual([]);
    });
  });

  describe("ensureLabelsExist", () => {
    it("should create labels that do not exist in the repo", async () => {
      provider.getRepositoryLabels.mockResolvedValue([{ name: "type:bug", color: "d73a4a" }]);

      await (service as any).ensureLabelsExist("owner", "repo", [
        "type:bug",
        "type:feature",
        "area:frontend",
      ]);

      expect(provider.createLabel).toHaveBeenCalledTimes(2);
      expect(provider.createLabel).toHaveBeenCalledWith("owner", "repo", {
        name: "type:feature",
        color: "a2eeef",
        description: "New feature or request",
      });
      expect(provider.createLabel).toHaveBeenCalledWith("owner", "repo", {
        name: "area:frontend",
        color: "1d76db",
        description: "Frontend or UI changes",
      });
    });

    it("should not create labels that already exist", async () => {
      provider.getRepositoryLabels.mockResolvedValue([
        { name: "type:bug", color: "d73a4a" },
        { name: "type:feature", color: "a2eeef" },
      ]);

      await (service as any).ensureLabelsExist("owner", "repo", ["type:bug", "type:feature"]);

      expect(provider.createLabel).not.toHaveBeenCalled();
    });
  });

  describe("defaultColorForLabel", () => {
    it("should return known colors for standard labels", () => {
      expect((service as any).defaultColorForLabel("type:bug")).toBe("d73a4a");
      expect((service as any).defaultColorForLabel("type:feature")).toBe("a2eeef");
      expect((service as any).defaultColorForLabel("priority:high")).toBe("d93f0b");
      expect((service as any).defaultColorForLabel("area:frontend")).toBe("1d76db");
    });

    it("should return default color for unknown labels", () => {
      expect((service as any).defaultColorForLabel("unknown:label")).toBe("ededed");
    });
  });
});
