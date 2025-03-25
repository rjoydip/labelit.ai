import type { ClassificationType, ParseResponse, PredictedLabel } from '@labelit/types/basic'
import type { PRData } from '@labelit/types/pull-request'
import { AIProcessor } from '@labelit/ai/processor'
import { prPrompt } from '@labelit/ai/prompts'

export class PRProcessor extends AIProcessor<ParseResponse> {
  public preparePrompt<PRData>(_: PRData) {
    return {
      system: prPrompt,
      user: '',
    }
  }

  public parseResponse(result: ClassificationType): ParseResponse {
    const normalized = result.text.trim().toLowerCase()
    let predictedLabel: PredictedLabel = 'Task'

    if (normalized.includes('bug'))
      predictedLabel = 'Bug'
    else if (normalized.includes('story'))
      predictedLabel = 'Story'
    else if (normalized.includes('spike'))
      predictedLabel = 'Spike'

    return {
      predictedLabel,
      rawText: result.text,
      processingTime: result.processingTime,
    }
  }

  public calculateComplexity(pr: PRData): number {
    const complexityFactors = {
      fileCount: pr.diffStats.files.length * 0.2,
      linesChanged: (pr.diffStats.additions + pr.diffStats.deletions) * 0.01,
      criticalFiles: pr.diffStats.changedFiles.filter(
        file =>
          file.filename.includes('core/')
          || file.filename.includes('config/')
          || file.filename.includes('security/'),
      ).length * 0.5,
    }

    return Object.values(complexityFactors).reduce((a, b) => a + b, 0)
  }

  public calculateRiskScore(pr: PRData): number {
    const riskFactors = {
      criticalFiles: pr.diffStats.changedFiles.filter(file =>
        file.filename.includes('core/')
        || file.filename.includes('config/')
        || file.filename.includes('security/'),
      ).length * 2,
      deletionRatio: pr.diffStats.deletions
        / (pr.diffStats.additions + pr.diffStats.deletions),
      reviewerCount: pr.reviewers.length * -0.5, // More reviewers reduce risk
    }

    return Object.values(riskFactors).reduce((acc, val) => acc + val, 0)
  }
}
