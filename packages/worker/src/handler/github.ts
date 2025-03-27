import type { Env } from '@labelit/types'
import type { PRData } from '@labelit/types/pull-request'
import type { TicketData } from '@labelit/types/ticket'
import type { HonoRequest } from 'hono/request'
import { PRProcessor, TicketProcessor } from '@labelit/services'
import { createErrorResponse, createSuccessResponse } from '@labelit/utils'

export class GithubHandler {
  private prProcessor: PRProcessor
  private ticketProcessor: TicketProcessor

  constructor(env: Env) {
    this.prProcessor = new PRProcessor(env)
    this.ticketProcessor = new TicketProcessor(env)
  }

  public async handlePR(request: HonoRequest): Promise<Response> {
    try {
      const json = await request.json()
      const prDetails = this.preparePRPayload(json)
      const promptDetails = this.prProcessor.preparePrompt(prDetails)
      const rawResponse = await this.prProcessor.classify<PRData>(prDetails, promptDetails)
      const response = this.prProcessor.parseResponse(rawResponse)
      return createSuccessResponse(response)
    }
    catch (error) {
      return createErrorResponse(error)
    }
  }

  public async handleIssues(request: HonoRequest, payload: any): Promise<Response> {
    try {
      const ticket = this.prepareIssuePayload(payload)
      const promptDetails = this.ticketProcessor.preparePrompt(ticket)
      const classifiedResponse = await this.ticketProcessor.classify<TicketData>(ticket, promptDetails)
      const response = this.ticketProcessor.parseResponse(classifiedResponse)
      return createSuccessResponse(response)
    }
    catch (error) {
      return createErrorResponse(error)
    }
  }

  private preparePRPayload(pr: any): PRData {
    const complexityScore = this.prProcessor.calculateComplexity(pr)
    const riskScore = this.prProcessor.calculateRiskScore(pr)

    return {
      ...pr,
      description: `
          ${pr.description}
          
          PR Analysis:
          - Changed Files: ${pr.diffStats.files.length}
          - Additions: ${pr.diffStats.additions}
          - Deletions: ${pr.diffStats.deletions}
          - Complexity Score: ${complexityScore}
          - Risk Score: ${riskScore}
        `,
    }
  }

  private prepareIssuePayload(payload: any): TicketData {
    return {
      id: payload.id.toString(),
      title: payload.title,
      description: payload.body || '',
      source: 'github',
      createdAt: payload.created_at,
      metadata: {
        labels: payload.labels.map((l: { name: any }) => l.name),
        assignee: payload.assignee?.login,
        state: payload.state,
      },
    }
  }
}
