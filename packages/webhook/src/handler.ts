import type { Bindings, Source } from '@labelit/types/basic'
import type { TicketData } from '@labelit/types/ticket'
import type { HonoRequest } from 'hono'
import { AIProcessor } from '@labelit/ai/processor'
import { createErrorResponse, createSuccessResponse } from '@labelit/shared/utils'
import { WebhookSecurityService } from './security'

export class WebhookHandler {
  private aiProcessor: AIProcessor
  private security: WebhookSecurityService

  constructor(env: Bindings) {
    this.aiProcessor = new AIProcessor(env)
    this.security = new WebhookSecurityService({
      github: 'github',
      gitlab: 'github',
      jira: 'jira',
    })
  }

  public async handler(source: Source, request: HonoRequest): Promise<Response> {
    let response: Response
    switch (source.trim().toLowerCase()) {
      case 'github':
        response = await this.handleGithubWebhook(request)
        break
      case 'gitlab':
      case 'jira':
        response = createSuccessResponse('Not implementation yet')
        break
      default:
        response = createSuccessResponse('No default implementation yet')
        break
    }
    return response
  }

  private async handleGithubWebhook(request: HonoRequest): Promise<Response> {
    if (!await this.security.validateGithubWebhook(request)) {
      return createErrorResponse('Unauthorized', 401)
    }
    try {
      const payload = await request.json()
      const ticket = this.transformGithubPayload(payload)
      const result = await this.aiProcessor.classifyTicket(ticket)
      return createSuccessResponse(result)
    }
    catch (error) {
      return createErrorResponse(error)
    }
  }

  private transformGithubPayload(payload: any): TicketData {
    return {
      id: payload.issue.id.toString(),
      title: payload.issue.title,
      description: payload.issue.body || '',
      source: 'github',
      createdAt: payload.issue.created_at,
      metadata: {
        labels: payload.issue.labels.map((l: { name: any }) => l.name),
        assignee: payload.issue.assignee?.login,
        state: payload.issue.state,
      },
    }
  }

  // Similar handlers for GitLab and Jira...
}
