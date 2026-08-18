import type { Env } from "../../types/env";
import type { ClassificationType, LabelSuggestionResult } from "../../types/basic";
import { AIProcessor } from "../../ai/processor";
import { labelSuggestionPrompt } from "../../ai/prompts";

const MAX_DIFF_LENGTH = 8000;

const ALLOWED_LABELS = new Set([
  "type:bug",
  "type:feature",
  "type:enhancement",
  "type:documentation",
  "type:refactoring",
  "type:test",
  "priority:high",
  "priority:medium",
  "priority:low",
  "area:frontend",
  "area:backend",
  "area:api",
  "area:docs",
  "area:ci/cd",
]);

export interface LabelSuggestionInput {
  title: string;
  body: string;
  diff: string;
}

export class LabelSuggestionAnalyzer extends AIProcessor<LabelSuggestionResult> {
  constructor(env: Env) {
    super(env);
  }

  public getPrompt(userPrompt: string) {
    return {
      system: labelSuggestionPrompt,
      user: userPrompt,
    };
  }

  public parseResponse(result: ClassificationType): LabelSuggestionResult {
    const labels = this.extractLabelsFromText(result.text);
    return {
      suggestedLabels: labels,
      rawText: result.text,
      processingTime: result.processingTime,
    };
  }

  private extractLabelsFromText(text: string): string[] {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return this.normalizeLabels(parsed.filter((l): l is string => typeof l === "string"));
      }
    } catch {}

    const labelPattern = /(type|priority|area):[\w/]+/g;
    const matches = text.match(labelPattern);
    if (matches) {
      return this.normalizeLabels(matches);
    }

    return this.fallbackKeywordAnalysis(text);
  }

  /**
   * Normalize to lowercase, reject anything outside the managed vocabulary,
   * and dedupe — a deviating model response must never create arbitrary labels.
   */
  private normalizeLabels(labels: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const label of labels) {
      const normalized = label.trim().toLowerCase();
      if (ALLOWED_LABELS.has(normalized) && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    }
    return result;
  }

  private fallbackKeywordAnalysis(text: string): string[] {
    const labels: string[] = [];
    const lower = text.toLowerCase();

    if (
      lower.includes("bug") ||
      lower.includes("fix") ||
      lower.includes("error") ||
      lower.includes("crash")
    ) {
      labels.push("type:bug");
    } else if (lower.includes("feat") || lower.includes("feature")) {
      labels.push("type:feature");
    } else if (lower.includes("refactor")) {
      labels.push("type:refactoring");
    } else if (lower.includes("test")) {
      labels.push("type:test");
    } else if (lower.includes("doc")) {
      labels.push("type:documentation");
    }

    if (lower.includes("breaking") || lower.includes("major")) {
      labels.push("priority:high");
    } else if (lower.includes("critical") || lower.includes("urgent")) {
      labels.push("priority:high");
    } else if (labels.length === 0) {
      labels.push("priority:medium");
    }

    return labels;
  }

  public async suggest(title: string, body: string, diff: string): Promise<LabelSuggestionResult> {
    const truncatedDiff =
      diff.length > MAX_DIFF_LENGTH
        ? `${diff.slice(0, MAX_DIFF_LENGTH)}\n\n[...diff truncated at ${MAX_DIFF_LENGTH} chars]`
        : diff;

    const userPrompt = this.buildAnalysisPrompt(title, body, truncatedDiff);
    const prompt = this.getPrompt(userPrompt);
    const result = await this.classify(prompt, "");
    return this.parseResponse(result);
  }

  private buildAnalysisPrompt(title: string, body: string, diff: string): string {
    return [
      `Title: ${title}`,
      `Description: ${body || "(no description)"}`,
      `--- Diff Content ---`,
      diff || "(no diff available)",
    ].join("\n");
  }
}
