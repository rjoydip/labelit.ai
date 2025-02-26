import type { PRData } from '@/types/pr'
import type { ProcessedTicket, TicketData } from '@/types/ticket'
import type { AIProcessor } from './ai-processor'

export class PRAnalyzer {
  private aiProcessor: AIProcessor

  constructor(aiProcessor: AIProcessor) {
    this.aiProcessor = aiProcessor
  }

  async analyzePR(pr: PRData): Promise<ProcessedTicket | Error> {
    const complexityScore = this.calculateComplexity(pr)
    const riskScore = this.calculateRiskScore(pr)

    // Enhance the prompt with PR-specific information
    const enhancedTicket: TicketData = {
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

    return this.aiProcessor.classifyTicket(enhancedTicket)
  }

  private calculateComplexity(pr: PRData): number {
    const factors = {
      filesChanged: pr.diffStats.files.length * 0.2,
      totalChanges: (pr.diffStats.additions + pr.diffStats.deletions) * 0.01,
      branchComplexity: pr.baseBranch === 'main' ? 1 : 1.5,
    }

    return Object.values(factors).reduce((acc, val) => acc + val, 0)
  }

  private calculateRiskScore(pr: PRData): number {
    const riskFactors = {
      criticalFiles: pr.diffStats.changedFiles.filter(f =>
        f.filename.includes('config/')
        || f.filename.includes('security/'),
      ).length * 2,
      deletionRatio: pr.diffStats.deletions
        / (pr.diffStats.additions + pr.diffStats.deletions),
      reviewerCount: pr.reviewers.length * -0.5, // More reviewers reduce risk
    }

    return Object.values(riskFactors).reduce((acc, val) => acc + val, 0)
  }
}
