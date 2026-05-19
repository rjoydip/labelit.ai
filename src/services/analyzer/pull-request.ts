import type { Env } from "../../types/env";
import type { PRData } from "../../types";
import type { ClassificationType, ParseResponse, PredictedLabel } from "../../types/basic";
import { AIProcessor } from "../../ai/processor";
import { prPrompt } from "../../ai/prompts";

export class PRAnalyzer extends AIProcessor<ParseResponse> {
  constructor(env: Env) {
    super(env);
  }

  public getPrompt() {
    return {
      system: prPrompt,
      user: "",
    };
  }

  public parseResponse(result: ClassificationType): ParseResponse {
    const normalized = result.text.trim().toLowerCase();
    let predictedLabel: PredictedLabel = "Testing";

    if (normalized.includes("risk")) predictedLabel = "Risk";
    else if (normalized.includes("refactor")) predictedLabel = "Refactoring";
    else if (normalized.includes("test")) predictedLabel = "Testing";

    return {
      predictedLabel,
      rawText: result.text,
      processingTime: result.processingTime,
    };
  }

  public calculateComplexity(pr: PRData): number {
    const complexityFactors = {
      fileCount: pr.changed_files * 0.2,
      linesChanged: (pr.additions + pr.deletions) * 0.01,
    };

    return Object.values(complexityFactors).reduce((a, b) => a + b, 0);
  }

  public calculateRiskScore(pr: PRData): number {
    const riskFactors = {
      deletionRatio: pr.deletions / (pr.additions + pr.deletions + 1),
      reviewerCount: pr.reviewers.length * -0.5,
    };

    return Object.values(riskFactors).reduce((acc, val) => acc + val, 0);
  }
}
