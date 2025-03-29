export { Ai, KVNamespace } from '@cloudflare/workers-types'
export interface Env {
  KV: KVNamespace<string>
  AI: Ai
  CACHE_TTL: string
  CACHE_NAMESPACE: string
  MODEL_NAME: string
  GITHUB_WEBHOOK_SECRET: string
  GITLAB_WEBHOOK_SECRET: string
  JIRA_WEBHOOK_SECRET: string
}
