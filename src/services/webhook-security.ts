import { createErrorResponse, createSuccessResponse } from '@/utils'
import { crypto } from '@cloudflare/workers-types'

export class WebhookSecurityService {
  private secrets: Map<string, string>

  constructor(secrets: Record<string, string>) {
    this.secrets = new Map(Object.entries(secrets))
  }

  async validateGithubWebhook(request: Request): Promise<boolean> {
    const signature = request.headers.get('X-Hub-Signature-256')
    const body = await request.clone().text()
    const secret = this.secrets.get('github')

    if (!signature || !secret)
      return false

    const expectedSignature = await this.computeHmac(body, secret)
    return this.timingSafeEqual(signature, `sha256=${expectedSignature}`)
  }

  async validateGitlabWebhook(request: Request): Promise<boolean> {
    const token = request.headers.get('X-Gitlab-Token')
    return token === this.secrets.get('gitlab')
  }

  async validateBitbucketWebhook(request: Request): Promise<boolean> {
    const token = request.headers.get('X-Hub-Signature')
    const body = await request.clone().text()
    const secret = this.secrets.get('bitbucket')

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

// Usage in webhook handler
export class WebhookHandler {
  private security: WebhookSecurityService

  constructor(secrets: Record<string, string>) {
    this.security = new WebhookSecurityService(secrets)
  }

  async handleGithubWebhook(request: Request): Promise<Response> {
    if (!await this.security.validateGithubWebhook(request)) {
      return createErrorResponse('Unauthorized', 401)
    }

    return createSuccessResponse('Authorize', 200)
  }
}
