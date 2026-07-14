import type { Env } from "../types/env";
import type { GitHubProvider } from "../providers/github/types";
import type { SyncResult } from "../types/basic";
import { LabelSuggestionAnalyzer } from "./analyzer/label-suggestion";

export class LabelService {
  private provider: GitHubProvider;
  private labelAnalyzer: LabelSuggestionAnalyzer;

  constructor(provider: GitHubProvider, env: Env) {
    this.provider = provider;
    this.labelAnalyzer = new LabelSuggestionAnalyzer(env);
  }

  async analyzeAndSyncPR(
    owner: string,
    repo: string,
    prNumber: number,
    title: string,
    body: string,
  ): Promise<SyncResult> {
    const target = `${owner}/${repo}#${prNumber}`;

    const diff = await this.provider.getPRDiff(owner, repo, prNumber);

    const suggestion = await this.labelAnalyzer.suggest(title, body, diff);
    const suggestedLabels = suggestion.suggestedLabels;

    const currentLabels = await this.provider.getLabels(target);

    const { toAdd, toRemove } = this.computeLabelDiff(currentLabels, suggestedLabels);

    if (toAdd.length > 0) {
      await this.ensureLabelsExist(owner, repo, toAdd);
      await this.provider.addLabels(target, toAdd);
    }

    if (toRemove.length > 0) {
      await this.provider.removeLabels(target, toRemove);
    }

    return { added: toAdd, removed: toRemove };
  }

  private computeLabelDiff(
    current: string[],
    suggested: string[],
  ): { toAdd: string[]; toRemove: string[] } {
    const currentSet = new Set(current);
    const suggestedSet = new Set(suggested);

    const toAdd = suggested.filter((l) => !currentSet.has(l));
    const toRemove = current.filter((l) => !suggestedSet.has(l));

    return { toAdd, toRemove };
  }

  private async ensureLabelsExist(owner: string, repo: string, labels: string[]): Promise<void> {
    const repoLabels = await this.provider.getRepositoryLabels(owner, repo);
    const existingNames = new Set(repoLabels.map((l) => l.name));

    const missing = labels.filter((l) => !existingNames.has(l));
    await Promise.all(
      missing.map(async (label) => {
        try {
          await this.provider.createLabel(owner, repo, {
            name: label,
            color: this.defaultColorForLabel(label),
            description: this.defaultDescriptionForLabel(label),
          });
        } catch (err) {
          if ((err as { message?: string })?.message?.includes("422")) {
            return;
          }
          throw err;
        }
      }),
    );
  }

  private defaultColorForLabel(label: string): string {
    const colorMap: Record<string, string> = {
      "type:bug": "d73a4a",
      "type:feature": "a2eeef",
      "type:enhancement": "a2eeef",
      "type:refactoring": "d4c5f9",
      "type:test": "c2e0c6",
      "type:documentation": "0075ca",
      "priority:high": "d93f0b",
      "priority:medium": "fbca04",
      "priority:low": "0e8a16",
      "area:frontend": "1d76db",
      "area:backend": "5319e7",
      "area:api": "006b75",
      "area:docs": "fef2c0",
      "area:ci/cd": "bfdadc",
    };
    return colorMap[label] || "ededed";
  }

  private defaultDescriptionForLabel(label: string): string {
    const descriptions: Record<string, string> = {
      "type:bug": "Something isn't working",
      "type:feature": "New feature or request",
      "type:enhancement": "Improvement to existing functionality",
      "type:refactoring": "Code restructuring without behavior change",
      "type:test": "Adding or modifying tests",
      "type:documentation": "Documentation changes",
      "priority:high": "Critical or urgent changes",
      "priority:medium": "Moderate priority changes",
      "priority:low": "Low priority changes",
      "area:frontend": "Frontend or UI changes",
      "area:backend": "Backend or server changes",
      "area:api": "API endpoint changes",
      "area:docs": "Documentation area",
      "area:ci/cd": "CI/CD pipeline changes",
    };
    return descriptions[label] || `Auto-managed label: ${label}`;
  }
}
