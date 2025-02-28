import type { TicketData } from './ticket'

export interface PRData extends TicketData {
  id: string
  diffStats: {
    additions: number
    deletions: number
    files: string[]
    changedFiles: Array<{
      filename: string
      additions: number
      deletions: number
      status: 'added' | 'modified' | 'removed'
    }>
  }
  reviewers: string[]
  baseBranch: string
  headBranch: string
}
