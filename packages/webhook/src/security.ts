import type { Env } from '@labelit/types'
import type { HonoRequest } from 'hono'
import { Config } from '@labelit/config'

export class WebhookSecurity {
  private secrets: Map<string, string>

  constructor(env: Env) {
    const config = new Config(env)
    const secrets = config.getSectets()
    this.secrets = new Map(Object.entries({
      github: secrets.GITHUB_WEBHOOK,
      gitlab: secrets.GITLAB_WEBHOOK,
      jira: secrets.JIRA_WEBHOOK,
    }))
  }

  async validateGithubWebhook(request: HonoRequest): Promise<boolean> {
    const signature = request.header('X-Hub-Signature-256')
    const body = await request.text()
    const secret = this.secrets.get('github')

    if (!signature || !secret)
      return false

    const expectedSignature = await this.computeHmac(body, secret)
    return this.timingSafeEqual(signature, `sha256=${expectedSignature}`)
  }

  async validateGitlabWebhook(request: HonoRequest): Promise<boolean> {
    const token = request.header('X-Gitlab-Token')
    return token === this.secrets.get('gitlab')
  }

  async validateJiraWebhook(request: HonoRequest): Promise<boolean> {
    const token = request.header('X-JIRA-Signature')
    const body = await request.text()
    const secret = this.secrets.get('jira')

    if (!token || !secret)
      return false

    const expectedSignature = await this.computeHmac(body, secret)
    return this.timingSafeEqual(token, `sha1=${expectedSignature}`)
  }

  private async computeHmac(message: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(message),
    )

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length)
      return false

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}
