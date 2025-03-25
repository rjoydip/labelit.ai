import type { Env } from '@labelit/types'
import { defaultSecretValue } from './constant'

export class Config {
  private env?: Env

  constructor(env?: Env) {
    this.env = env
  }

  public getEnv(env?: Env) {
    const _env = env || this.env
    return {
      CACHE_TTL: Number.parseInt(_env?.CACHE_TTL || '3600'),
      CACHE_NAMESPACE: _env?.CACHE_NAMESPACE || defaultSecretValue,
      MODEL_NAME: _env?.MODEL_NAME || '@cf/meta/llama-3.1-8b-instruct',
    }
  }

  public getSectets(env?: Env) {
    const _env = env || this.env
    return {
      GITHUB_WEBHOOK: _env?.GITHUB_WEBHOOK_SECRET || defaultSecretValue,
      GITLAB_WEBHOOK: _env?.GITLAB_WEBHOOK_SECRET || defaultSecretValue,
      JIRA_WEBHOOK: _env?.JIRA_WEBHOOK_SECRET || defaultSecretValue,
    }
  }
}
