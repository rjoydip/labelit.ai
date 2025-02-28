import type { Bindings } from '@labelit/types/basic'
import type { ProcessedTicket, TicketData } from '@labelit/types/ticket'
import type { LanguageModelV1 } from 'ai'
import { ENV } from '@labelit/config/environment'
import { generateText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

export class AIProcessor {
  private model: LanguageModelV1
  private systemPrompt: string

  constructor(env: Bindings) {
    const workersai = createWorkersAI({ binding: env.AI })
    this.model = workersai(ENV.MODEL_NAME, {
      safePrompt: true,
    })
    this.systemPrompt = `
      You are a ticket classification system. Classify tickets as either Bug, Story, Task, or Spike.

      - Bugs: Issues or unexpected behavior
      - Stories: User-facing features
      - Tasks: Technical work items
      - Spikes: Research or exploration items
    
      Respond only with the classification label.
    `
  }

  public async classifyTicket(ticket: TicketData): Promise<ProcessedTicket | Error> {
    const startTime = Date.now()
    const userContent = `Title: ${ticket.title}\nDescription: ${ticket.description}`

    const { text } = await generateText({
      model: this.model,
      messages: [{
        role: 'system',
        content: this.systemPrompt,
      }, {
        role: 'user',
        content: userContent,
      }],
    })

    const result: ProcessedTicket = {
      ...ticket,
      predictedLabel: this.parseResponse(text),
      processingTime: Date.now() - startTime,
    }

    return result
  }

  private parseResponse(response: string): ProcessedTicket['predictedLabel'] {
    const normalized = response.trim().toLowerCase()
    if (normalized.includes('bug'))
      return 'Bug'
    if (normalized.includes('story'))
      return 'Story'
    if (normalized.includes('spike'))
      return 'Spike'
    return 'Task'
  }
}
