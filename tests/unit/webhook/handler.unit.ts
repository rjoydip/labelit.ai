import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TestEnv } from "../../vitest-types";
import type { AnalyzeInput } from "../../../src/webhook/handler";
import { WebhookHandler } from "../../../src/webhook/handler";

const mockAnalyzeAndSyncPR = vi.fn();

vi.mock("../../../src/services/label.service", () => {
  const mockFn = vi.fn(function () {
    return { analyzeAndSyncPR: mockAnalyzeAndSyncPR };
  });
  return { LabelService: mockFn };
});

describe("WebhookHandler", () => {
  let webhookHandler: WebhookHandler;
  let mockEnv: TestEnv;

  beforeEach(() => {
    mockEnv = {
      KV: {} as any,
      MODEL_NAME: "test-model",
      GITHUB_PROVIDER: {} as any,
    };

    webhookHandler = new WebhookHandler(mockEnv);
  });

  describe("constructor", () => {
    it("should initialize with correct dependencies", () => {
      expect(webhookHandler).toBeInstanceOf(WebhookHandler);
    });
  });

  describe("analyze", () => {
    it("should analyze issue input correctly", async () => {
      const mockParsedResponse = {
        predictedLabel: "Bug",
        rawText: "Bug",
        processingTime: 100,
      };

      (webhookHandler as any).ticketAnalyzer.getPrompt = vi.fn().mockReturnValue({
        system: "",
        user: "Issue Title: Test issue\nBody: Test body",
      });
      (webhookHandler as any).ticketAnalyzer.classify = vi
        .fn()
        .mockResolvedValue({ text: "Bug", processingTime: 100 });
      (webhookHandler as any).ticketAnalyzer.parseResponse = vi
        .fn()
        .mockReturnValue(mockParsedResponse);

      const input: AnalyzeInput = {
        type: "issue",
        title: "Test issue",
        body: "Test body",
        target: "owner/repo#1",
      };
      const result = await webhookHandler.analyze(input);

      expect(result).toEqual({
        labels: ["Bug"],
        confidence: 0.8,
      });
    });

    it("should analyze pull request input correctly", async () => {
      const mockParsedResponse = {
        predictedLabel: "Refactoring",
        rawText: "Refactoring",
        processingTime: 150,
      };

      (webhookHandler as any).ticketAnalyzer.getPrompt = vi.fn().mockReturnValue({
        system: "",
        user: "PR Title: Test PR\nBody: Test body",
      });
      (webhookHandler as any).ticketAnalyzer.classify = vi
        .fn()
        .mockResolvedValue({ text: "Refactoring", processingTime: 150 });
      (webhookHandler as any).ticketAnalyzer.parseResponse = vi
        .fn()
        .mockReturnValue(mockParsedResponse);

      const input: AnalyzeInput = {
        type: "pull_request",
        title: "Test PR",
        body: "Test body",
        target: "owner/repo#1",
      };
      const result = await webhookHandler.analyze(input);

      expect(result).toEqual({
        labels: ["Refactoring"],
        confidence: 0.8,
      });
    });

    it("should handle empty body in analyze input", async () => {
      const mockParsedResponse = {
        predictedLabel: "Task",
        rawText: "Task",
        processingTime: 50,
      };

      (webhookHandler as any).ticketAnalyzer.getPrompt = vi.fn().mockReturnValue({
        system: "",
        user: "Issue Title: Test issue\nBody: ",
      });
      (webhookHandler as any).ticketAnalyzer.classify = vi
        .fn()
        .mockResolvedValue({ text: "Task", processingTime: 50 });
      (webhookHandler as any).ticketAnalyzer.parseResponse = vi
        .fn()
        .mockReturnValue(mockParsedResponse);

      const input: AnalyzeInput = {
        type: "issue",
        title: "Test issue",
        body: "",
        target: "owner/repo#1",
      };
      const result = await webhookHandler.analyze(input);

      expect(result).toEqual({
        labels: ["Task"],
        confidence: 0.8,
      });
    });
  });

  describe("preparePayload", () => {
    it("should prepare payload for issue event", () => {
      const githubPayload = {
        action: "opened",
        issue: {
          body: "Test issue body",
          labels: [{ name: "bug" }],
          number: 1,
          state: "open",
          title: "Test issue",
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };

      const result = (webhookHandler as any).preparePayload(githubPayload);

      expect(result).toEqual({
        source: "github",
        type: "issue",
        action: "opened",
        payload: {
          issue: {
            body: "Test issue body",
            labels: [{ name: "bug" }],
            number: 1,
            state: "open",
            title: "Test issue",
          },
          repository: {
            full_name: "owner/test-repo",
            name: "test-repo",
            description: "Test repository",
          },
        },
        userPrompt: "",
      });
    });

    it("should prepare payload for pull request event", () => {
      const githubPayload = {
        action: "synchronize",
        pull_request: {
          body: "Test PR body",
          labels: [{ name: "enhancement" }],
          number: 2,
          state: "open",
          title: "Test PR",
          additions: 100,
          changed_files: 5,
          deletions: 50,
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };

      const result = (webhookHandler as any).preparePayload(githubPayload);

      expect(result.source).toBe("github");
      expect(result.type).toBe("pull_request");
      expect(result.action).toBe("synchronize");
      expect(result.payload.pull_request.title).toBe("Test PR");
      expect(result.payload.pull_request.number).toBe(2);
      expect(result.payload.repository.full_name).toBe("owner/test-repo");
      expect(result.userPrompt).toContain("Title: Test PR");
      expect(result.userPrompt).toContain("Description: Test PR body");
    });

    it("should return default payload for unknown event type", () => {
      const githubPayload = {
        action: "unknown",
        someOtherField: "value",
      };

      const result = (webhookHandler as any).preparePayload(githubPayload);

      expect(result).toEqual({
        source: "github",
        type: undefined,
        payload: { issue: undefined, repository: undefined },
        userPrompt: "",
      });
    });
  });

  describe("auto-labeling", () => {
    beforeEach(() => {
      mockAnalyzeAndSyncPR.mockReset();
      (webhookHandler as any).ticketAnalyzer.classify = vi
        .fn()
        .mockResolvedValue({ text: "Testing", processingTime: 50 });
      (webhookHandler as any).ticketAnalyzer.parseResponse = vi
        .fn()
        .mockReturnValue({ predictedLabel: "Testing", rawText: "Testing", processingTime: 50 });
    });

    it("should trigger label sync on PR opened event", async () => {
      mockAnalyzeAndSyncPR.mockResolvedValue({ added: ["type:feature"], removed: [] });
      vi.spyOn(webhookHandler as any, "validateRequest").mockResolvedValue(true);

      const payload = {
        action: "opened",
        pull_request: {
          body: "Test PR body",
          labels: [],
          number: 1,
          state: "open",
          title: "Test PR",
          additions: 10,
          changed_files: 2,
          deletions: 5,
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };
      const req = {
        json: vi.fn().mockResolvedValue(payload),
        headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
        text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
      } as any;

      const result = await webhookHandler.handle(req);
      const body: any = await result.json();

      expect(result.status).toBe(200);
      expect(body.predictedLabel).toBe("Testing");
      expect(body.syncResult).toEqual({ added: ["type:feature"], removed: [] });
      expect(mockAnalyzeAndSyncPR).toHaveBeenCalledOnce();
    });

    it("should trigger label sync on PR synchronize event", async () => {
      mockAnalyzeAndSyncPR.mockResolvedValue({ added: ["type:bug"], removed: ["enhancement"] });
      vi.spyOn(webhookHandler as any, "validateRequest").mockResolvedValue(true);

      const payload = {
        action: "synchronize",
        pull_request: {
          body: "Fix critical bug",
          labels: [{ name: "enhancement" }],
          number: 3,
          state: "open",
          title: "Bug fix",
          additions: 20,
          changed_files: 1,
          deletions: 5,
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };
      const req = {
        json: vi.fn().mockResolvedValue(payload),
        headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
        text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
      } as any;

      const result = await webhookHandler.handle(req);
      const body: any = await result.json();

      expect(result.status).toBe(200);
      expect(body.syncResult).toEqual({ added: ["type:bug"], removed: ["enhancement"] });
      expect(mockAnalyzeAndSyncPR).toHaveBeenCalledOnce();
    });

    it("should not trigger label sync on non-PR events", async () => {
      vi.spyOn(webhookHandler as any, "validateRequest").mockResolvedValue(true);

      const payload = {
        action: "opened",
        issue: {
          body: "Test issue body",
          labels: [],
          number: 1,
          state: "open",
          title: "Test issue",
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };
      const req = {
        json: vi.fn().mockResolvedValue(payload),
        headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
        text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
      } as any;

      const result = await webhookHandler.handle(req);
      const body: any = await result.json();

      expect(result.status).toBe(200);
      expect(body.syncResult).toBeUndefined();
      expect(mockAnalyzeAndSyncPR).not.toHaveBeenCalled();
    });

    it("should handle label sync failure gracefully", async () => {
      mockAnalyzeAndSyncPR.mockRejectedValue(new Error("API error"));
      vi.spyOn(webhookHandler as any, "validateRequest").mockResolvedValue(true);

      const payload = {
        action: "opened",
        pull_request: {
          body: "Test",
          labels: [],
          number: 1,
          state: "open",
          title: "Test PR",
          additions: 10,
          changed_files: 2,
          deletions: 5,
        },
        repository: {
          name: "test-repo",
          full_name: "owner/test-repo",
          description: "Test repository",
        },
      };
      const req = {
        json: vi.fn().mockResolvedValue(payload),
        headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
        text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
      } as any;

      const result = await webhookHandler.handle(req);
      const body: any = await result.json();

      expect(result.status).toBe(200);
      expect(body.predictedLabel).toBe("Testing");
      expect(body.syncResult).toBeUndefined();
    });
  });
});
