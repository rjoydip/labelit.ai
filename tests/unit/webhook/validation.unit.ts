import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateGitHubWebhook, ValidationResult } from "../../../src/webhook/validation";
import { verifyHMAC } from "../../../src/utils";

// Mock the verifyHMAC function
vi.mock("../../../src/utils", () => ({
  verifyHMAC: vi.fn(),
}));

describe("validateGitHubWebhook", () => {
  const testPayload = '{"test":"payload"}';
  const testSecret = "test-secret";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when signature is missing", () => {
    it("should return ValidationResult with valid: false and error: 'Missing signature'", async () => {
      const result: ValidationResult = await validateGitHubWebhook(testPayload, null, testSecret);

      expect(result).toEqual({
        valid: false,
        error: "Missing signature",
      });
    });
  });

  describe("when signature is provided", () => {
    const testSignature = "sha256=abc123";

    describe("and HMAC verification fails", () => {
      it("should return ValidationResult with valid: false and error: 'Invalid signature'", async () => {
        vi.mocked(verifyHMAC).mockResolvedValue(false);

        const result: ValidationResult = await validateGitHubWebhook(
          testPayload,
          testSignature,
          testSecret,
        );

        expect(result).toEqual({
          valid: false,
          error: "Invalid signature",
        });
        expect(verifyHMAC).toHaveBeenCalledWith(testPayload, testSecret, testSignature);
      });
    });

    describe("and HMAC verification succeeds", () => {
      it("should return ValidationResult with valid: true", async () => {
        vi.mocked(verifyHMAC).mockResolvedValue(true);

        const result: ValidationResult = await validateGitHubWebhook(
          testPayload,
          testSignature,
          testSecret,
        );

        expect(result).toEqual({
          valid: true,
        });
        expect(verifyHMAC).toHaveBeenCalledWith(testPayload, testSecret, testSignature);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty payload", async () => {
      vi.mocked(verifyHMAC).mockResolvedValue(true);

      const result: ValidationResult = await validateGitHubWebhook("", "sha256=abc123", testSecret);

      expect(result.valid).toBe(true);
    });

    it("should handle empty secret", async () => {
      vi.mocked(verifyHMAC).mockResolvedValue(true);

      const result: ValidationResult = await validateGitHubWebhook(
        testPayload,
        "sha256=abc123",
        "",
      );

      expect(result.valid).toBe(true);
    });

    it("should handle different signature formats", async () => {
      vi.mocked(verifyHMAC).mockResolvedValue(true);

      const signatures = [
        "sha256=abc123",
        "sha1=def456",
        "sha256=",
        "sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      ];

      for (const signature of signatures) {
        const result: ValidationResult = await validateGitHubWebhook(
          testPayload,
          signature,
          testSecret,
        );

        expect(result.valid).toBe(true);
        expect(verifyHMAC).toHaveBeenCalledWith(testPayload, testSecret, signature);
      }
    });
  });
});
