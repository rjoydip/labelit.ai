import type { Env } from "../../types/env";
import type { ClassificationType, ParseResponse, PredictedLabel } from "../../types/basic";
import { AIProcessor } from "../../ai/processor";
import { issuePrompt } from "../../ai/prompts";

export class TicketAnalyzer extends AIProcessor<ParseResponse> {
  constructor(env: Env) {
    super(env);
  }

  public getPrompt(userPrompt: string) {
    return {
      system: issuePrompt ?? "",
      user: userPrompt ?? "",
    };
  }

  public async classify<T>(
    promptDetails: { system: string; user: string },
    payload: T,
  ): Promise<ClassificationType> {
    return super.classify(promptDetails, payload);
  }

  public parseResponse(result: ClassificationType): ParseResponse {
    const normalized = result.text.trim().toLowerCase();
    let predictedLabel: PredictedLabel = "Task";

    if (normalized.includes("bug")) predictedLabel = "Bug";
    else if (normalized.includes("story")) predictedLabel = "Story";
    else if (normalized.includes("spike")) predictedLabel = "Spike";

    return {
      predictedLabel,
      rawText: result.text,
      processingTime: result.processingTime,
    };
  }
}
