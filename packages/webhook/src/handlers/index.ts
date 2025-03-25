import type { Env } from '@labelit/types'
import type { HandlerSource, HandlerType } from '@labelit/types/basic'
import type { HonoRequest } from 'hono'
import { createSuccessResponse } from '@labelit/utils'
import { GithubWebhookHandler } from './github'

export abstract class HookHandler<T> {
  protected abstract preparePayload(data: any): T
}

export class WebhookHandler {
  private githubWebhookHandler: GithubWebhookHandler

  constructor(env: Env) {
    this.githubWebhookHandler = new GithubWebhookHandler(env)
  }

  public async handler(source: HandlerSource, request: HonoRequest): Promise<Response> {
    let response: Response
    const payload: { issue: Record<string, string> } = await request.json()
    const type: HandlerType = Object.hasOwn(payload, 'issue') ? 'issue' : 'pr'
    const case$ = `${source.trim().toLowerCase()}-${type}`
    switch (case$) {
      case 'github-issue':
        response = await this.githubWebhookHandler.handleIssues(request, payload.issue)
        break
      case 'gitlab-issue':
      case 'gitlab-pr':
      case 'jira-issue':
      case 'jira-pr':
      case 'github-pr':
        response = createSuccessResponse('Not implementation yet')
        break
      default:
        response = createSuccessResponse(`Wrong ${case$}`)
        break
    }
    return response
  }
}
