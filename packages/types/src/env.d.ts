import type { Bindings } from './basic'

export interface Env extends Bindings {
  CACHE_TTL: string
  CACHE_NAMESPACE: string
  MODEL_NAME: string
  GITHUB_WEBHOOK_SECRET: string
  GITLAB_WEBHOOK_SECRET: string
  JIRA_WEBHOOK_SECRET: string
}
