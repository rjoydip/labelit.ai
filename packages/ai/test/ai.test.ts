import { describe, expect, it } from "vitest";

describe("AI Package Basic Tests", () => {
  it("should be able to import the package", async () => {
    // Dynamic import to avoid issues with mocks during test setup
    const aiModule = await import("../src/index");
    expect(aiModule).toBeDefined();
  });

  it("should be able to import the processor", async () => {
    const processorModule = await import("../src/processor");
    expect(processorModule).toBeDefined();
    expect(processorModule.AIProcessor).toBeDefined();
  });

  it("should be able to import the prompts", async () => {
    const promptsModule = await import("../src/prompts");
    expect(promptsModule).toBeDefined();
    expect(promptsModule.issuePrompt).toBeDefined();
    expect(promptsModule.prPrompt).toBeDefined();
  });
});
