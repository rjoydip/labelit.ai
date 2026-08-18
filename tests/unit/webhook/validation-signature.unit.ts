import { describe, expect, it } from "vitest";
import { validateGitHubWebhook } from "../../../src/webhook/validation";
import { generateHMAC } from "../../../src/utils";

describe("validateGitHubWebhook with real HMAC", () => {
  const payload = JSON.stringify({ action: "opened", number: 1 });
  const secret = "test-secret";

  it("should accept the sha256= prefixed signature GitHub sends", async () => {
    const hex = await generateHMAC(payload, secret);
    const result = await validateGitHubWebhook(payload, `sha256=${hex}`, secret);
    expect(result.valid).toBe(true);
  });

  it("should accept a bare hex signature", async () => {
    const hex = await generateHMAC(payload, secret);
    const result = await validateGitHubWebhook(payload, hex, secret);
    expect(result.valid).toBe(true);
  });

  it("should reject a wrong signature", async () => {
    const result = await validateGitHubWebhook(payload, `sha256=${"0".repeat(64)}`, secret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid signature");
  });

  it("should reject when signed with a different secret", async () => {
    const hex = await generateHMAC(payload, "other-secret");
    const result = await validateGitHubWebhook(payload, `sha256=${hex}`, secret);
    expect(result.valid).toBe(false);
  });
});
