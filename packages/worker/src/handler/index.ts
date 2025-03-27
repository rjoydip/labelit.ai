import type { Env, HandlerSource, HandlerType } from '@labelit/types'
import type { HonoRequest } from 'hono/request'
import { createSuccessResponse } from '@labelit/utils'
import { GithubHandler } from './github'

export class Handler {
  private githubHandler: GithubHandler

  constructor(env: Env) {
    this.githubHandler = new GithubHandler(env)
  }

  public async handler(source: HandlerSource, request: HonoRequest): Promise<Response> {
    let response: Response
    const payload: { issue: Record<string, string> } = await request.json()
    const type: HandlerType = Object.hasOwn(payload, 'issue') ? 'issue' : 'pr'
    const case$ = `${source.trim().toLowerCase()}-${type}`
    switch (case$) {
      case 'github-issue':
        response = await this.githubHandler.handleIssues(request, payload.issue)
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
