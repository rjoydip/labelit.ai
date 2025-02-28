import { env } from 'std-env'

export const ENV = {
  CACHE_TTL: Number.parseInt(env.CACHE_TTL || '3600'),
  CACHE_NAMESPACE: env.CACHE_NAMESPACE || 'labelit-ai',
  MODEL_NAME: env.MODEL_NAME || '@cf/meta/llama-3.1-8b-instruct',
}
