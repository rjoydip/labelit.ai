import type { ClassificationType, ParseResponse, PredictedLabel } from '@labelit/types/basic'
import { AIProcessor } from '@labelit/ai/processor'
import { issuePrompt } from '@labelit/ai/prompts'

export class TicketProcessor extends AIProcessor<ParseResponse> {
  public getPrompt(userPrompt: string) {
    return {
      system: issuePrompt ?? '',
      user: userPrompt ?? '',
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
}
