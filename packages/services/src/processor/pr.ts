import type { PRData } from '@labelit/types'
import type { ClassificationType, ParseResponse, PredictedLabel } from '@labelit/types/basic'
import { AIProcessor } from '@labelit/ai/processor'
import { prPrompt } from '@labelit/ai/prompts'

export class PRProcessor extends AIProcessor<ParseResponse> {
  public getPrompt() {
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
      fileCount: pr.changed_files * 0.2,
      linesChanged: (pr.additions + pr.deletions) * 0.01,
    }

    return Object.values(complexityFactors).reduce((a, b) => a + b, 0)
  }

  public calculateRiskScore(pr: PRData): number {
    const riskFactors = {
      deletionRatio: pr.deletions / (pr.additions + pr.deletions),
      reviewerCount: pr.reviewers.length * -0.5,
    }

    return Object.values(riskFactors).reduce((acc, val) => acc + val, 0)
  }
}
