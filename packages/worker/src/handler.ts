import type { Env, PayloadMeta } from '@labelit/types'
import type { HonoRequest } from 'hono/request'
import { PRProcessor, TicketProcessor } from '@labelit/services'
import { createErrorResponse, createSuccessResponse } from '@labelit/utils'

export class Handler {
  private prProcessor: PRProcessor
  private ticketProcessor: TicketProcessor

  constructor(env: Env) {
    this.prProcessor = new PRProcessor(env)
    this.ticketProcessor = new TicketProcessor(env)
  }

  private preparePayload(payload: any): PayloadMeta {
    if (Object.hasOwn(payload, 'issue')) {
      const { action, issue: { body, labels, state, title }, repository: { name, description } } = payload
      return {
        source: 'github',
        type: 'issue',
        action,
        payload: {
          issue: {
            body,
            labels,
            state,
            title,
          },
          repository: {
            name,
            description,
          },
        },
        userPrompt: '',
      }
    }

    if (Object.hasOwn(payload, 'event_type') && payload.event_type === 'issue') {
      const { event_type, object_attributes: { action, description, labels, state, title }, repository } = payload
      return {
        source: 'gitlab',
        type: event_type,
        action,
        payload: {
          issue: {
            body: description,
            labels,
            state,
            title,
          },
          repository: {
            name: repository.name,
            description: repository.description,
          },
        },
        userPrompt: '',
      }
    }

    if (Object.hasOwn(payload, 'pull_request') && payload.action === 'edited') {
      const { action, pull_request: { additions, body, changed_files, deletions, labels, state, title }, repository: { name, description } } = payload
      const diff_content = ''
      const calculateDetails = {
        additions,
        changed_files,
        deletions,
        diff_content,
        reviewers: [],
      }
      const complexityScore = this.prProcessor.calculateComplexity(calculateDetails)
      const riskScore = this.prProcessor.calculateRiskScore(calculateDetails)
      return {
        source: 'github',
        type: 'pull_request',
        action,
        payload: {
          pull_request: {
            labels,
            state,
            title,
            description: body,
          },
          repository: {
            name,
            description,
          },
        },
        userPrompt: `
          Title: ${title}
          Description: ${body}
          
          PR Analysis:
          - Changed Files: ${changed_files}
          - Additions: ${additions}
          - Deletions: ${deletions}
          - Diff Content: ${diff_content}
          - Complexity Score: ${complexityScore}
          - Risk Score: ${riskScore}
        `,
      }
    }

    if (Object.hasOwn(payload, 'event_type') && payload.event_type === 'merge_request') {
      const { object_attributes: { description, labels, state, title }, repository } = payload
      return {
        source: 'gitlab',
        type: 'pull_request',
        action: state,
        payload: {
          pull_request: {
            labels,
            state,
            title,
            description,
          },
          repository: {
            name: repository.name,
            description: repository.description,
          },
        },
        userPrompt: `
          Title: ${title}
          Description: ${description ?? ''}
          
          PR Analysis:
          - Changed Files: 1
          - Additions: 1
          - Deletions: 0
          - Complexity Score: 0
          - Risk Score: 0
        `,
      }
    }

    if (Object.hasOwn(payload, 'pullrequest')) {
      const { pullrequest: { description, state, title }, repository } = payload
      return {
        source: 'bitbucket',
        type: 'pull_request',
        action: 'opened',
        payload: {
          pull_request: {
            labels: [],
            state,
            title,
            description,
          },
          repository: {
            name: repository.name,
            description: repository.description,
          },
        },
        userPrompt: '',
      }
    }

    return {
      source: undefined,
      type: undefined,
      payload: {
        issue: undefined,
        repository: undefined,
      },
      userPrompt: '',
    }
  }

  public async handle(req: HonoRequest) {
    try {
      const reqPayload = await req.json()
      const { payload, userPrompt }: PayloadMeta = this.preparePayload(reqPayload)
      const promptDetails = this.ticketProcessor.getPrompt(userPrompt)
      const classifiedResponse = await this.ticketProcessor.classify<PayloadMeta['payload']>(promptDetails, payload)
      const response = this.ticketProcessor.parseResponse(classifiedResponse)
      return createSuccessResponse(response)
    }
    catch (error) {
      return createErrorResponse(error)
    }
  }
}
