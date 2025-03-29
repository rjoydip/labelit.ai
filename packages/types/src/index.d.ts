export * from './basic'
export * from './env'

export interface PRData {
  additions: number
  changed_files: number
  deletions: number
  diff_content: string
  reviewers: string[]
}
