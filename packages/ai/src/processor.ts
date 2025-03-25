import type { Env } from '@labelit/types'
import type { ClassificationType, PromptResponse } from '@labelit/types/basic'
import type { LanguageModelV1 } from 'ai'
import { generateText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

export abstract class AIProcessor<T> {
  private model: LanguageModelV1

  constructor(env: Env) {
    const workersai = createWorkersAI({ binding: env.AI })
    this.model = workersai(env.MODEL_NAME, {
      safePrompt: true,
    })
  }

  public async classify<TContent>(content: TContent, prompt: PromptResponse): Promise<ClassificationType> {
    const startTime = Date.now()

    const { text } = await generateText({
      model: this.model,
      messages: [{
        role: 'system',
        content: prompt.system,
      }, {
        role: 'user',
        content: prompt.user,
      }, {
        role: 'data',
        content: typeof content === 'string' ? content : JSON.stringify(content),
      }],
    })

    const result: ClassificationType = {
      text,
      processingTime: Date.now() - startTime,
    }

    return result
  }

  public abstract preparePrompt<P>(payload: P): PromptResponse
  public abstract parseResponse(result: ClassificationType): T
}
