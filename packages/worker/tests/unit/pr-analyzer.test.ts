import type { PRData } from '@labelit/types/pull-request'
import { PRAnalyzer } from '@/services/pr-analyzer'
import { beforeEach, describe, expect, it } from 'vitest'

describe('pRAnalyzer', () => {
  let analyzer: PRAnalyzer
  let mockAiProcessor: any

  beforeEach(() => {
    mockAiProcessor = {
      classifyTicket: vi.fn(),
    }
    analyzer = new PRAnalyzer(mockAiProcessor)
  })

  it('should calculate complexity correctly', () => {
    const pr: PRData = {
      id: '1',
      title: 'Test PR',
      description: 'Test description',
      source: 'github',
      createdAt: new Date().toISOString(),
      metadata: {},
      diffStats: {
        additions: 100,
        deletions: 50,
        files: ['file1.ts', 'file2.ts'],
        changedFiles: [
          { filename: 'file1.ts', additions: 50, deletions: 25, status: 'modified' },
          { filename: 'file2.ts', additions: 50, deletions: 25, status: 'modified' },
        ],
      },
      reviewers: ['user1', 'user2'],
      baseBranch: 'main',
      headBranch: 'feature/test',
    }

    const result = analyzer.analyzePR(pr)
    expect(result).toBeDefined()
    expect(mockAiProcessor.classifyTicket).toHaveBeenCalled()
  })
})
