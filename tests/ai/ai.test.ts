import { describe, expect, it } from "vitest";

describe("AI Package Basic Tests", () => {
  it("should be able to import the package", async () => {
    const aiModule = await import("../../src/ai/processor");
    expect(aiModule).toBeDefined();
  });

  it("should be able to import the prompts", async () => {
    const promptsModule = await import("../../src/ai/prompts");
    expect(promptsModule).toBeDefined();
    expect(promptsModule.issuePrompt).toBeDefined();
    expect(promptsModule.prPrompt).toBeDefined();
  });
});
