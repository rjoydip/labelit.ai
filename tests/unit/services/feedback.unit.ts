import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeedbackService } from "../../../src/services/feedback";
import type { TestFeedbackData } from "../../vitest-types";

describe("FeedbackService", () => {
  let feedbackService: FeedbackService;
  let mockKV: {
    put: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockKV = {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    feedbackService = new FeedbackService(mockKV as any);
  });

  describe("submitFeedback", () => {
    const feedbackData: TestFeedbackData = {
      ticketId: "test-ticket-123",
      actualLabel: "Bug",
      predictedLabel: "Bug",
      wasCorrect: true,
      timestamp: new Date().toISOString(),
      userId: "user-1",
    };

    it("should store feedback in KV with correct key", async () => {
      await feedbackService.submitFeedback(feedbackData);

      expect(mockKV.put).toHaveBeenCalledWith(
        `feedback:${feedbackData.ticketId}`,
        JSON.stringify(feedbackData),
      );
    });

    it("should NOT call storeForRetraining when feedback is correct", async () => {
      const correctFeedback: TestFeedbackData = {
        ...feedbackData,
        wasCorrect: true,
      };

      await feedbackService.submitFeedback(correctFeedback);

      expect(mockKV.put).toHaveBeenCalledWith(
        `feedback:${correctFeedback.ticketId}`,
        JSON.stringify(correctFeedback),
      );
      // Should only be called twice: once for feedback, once for metrics
      expect(mockKV.put).toHaveBeenCalledTimes(2);
    });

    it("should call storeForRetraining when feedback is incorrect", async () => {
      const incorrectFeedback: TestFeedbackData = {
        ...feedbackData,
        wasCorrect: false,
      };

      await feedbackService.submitFeedback(incorrectFeedback);

      expect(mockKV.put).toHaveBeenCalledWith(
        `retraining:${incorrectFeedback.ticketId}`,
        JSON.stringify(incorrectFeedback),
      );
      // Should be called three times: feedback, metrics, and retraining
      expect(mockKV.put).toHaveBeenCalledTimes(3);
    });
  });

  describe("updateAccuracyMetrics", () => {
    it("should call KV.get with metrics key", async () => {
      mockKV.get.mockResolvedValueOnce(null);

      const feedbackData: TestFeedbackData = {
        ticketId: "test-ticket-123",
        actualLabel: "Bug",
        predictedLabel: "Bug",
        wasCorrect: true,
        timestamp: new Date().toISOString(),
        userId: "user-1",
      };

      await feedbackService["updateAccuracyMetrics"](feedbackData);

      expect(mockKV.get).toHaveBeenCalledWith(expect.stringContaining("metrics:"), {
        type: "json",
      });
    });

    it("should call KV.put to store updated metrics", async () => {
      mockKV.get.mockResolvedValueOnce(null);

      const feedbackData: TestFeedbackData = {
        ticketId: "test-ticket-123",
        actualLabel: "Bug",
        predictedLabel: "Bug",
        wasCorrect: true,
        timestamp: new Date().toISOString(),
        userId: "user-1",
      };

      await feedbackService["updateAccuracyMetrics"](feedbackData);

      expect(mockKV.put).toHaveBeenCalled();
    });
  });

  describe("storeForRetraining", () => {
    it("should store incorrect feedback for retraining", async () => {
      const feedbackData: TestFeedbackData = {
        ticketId: "test-ticket-126",
        actualLabel: "Bug",
        predictedLabel: "Story",
        wasCorrect: false,
        timestamp: new Date().toISOString(),
        userId: "user-1",
      };

      await feedbackService["storeForRetraining"](feedbackData);

      expect(mockKV.put).toHaveBeenCalledWith(
        `retraining:${feedbackData.ticketId}`,
        JSON.stringify(feedbackData),
      );
    });
  });
});
