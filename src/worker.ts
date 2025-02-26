import type { Bindings, Source } from '@/types'
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { ENV } from './config/environment'
import { WebhookHandler } from './webhook/handler'

const app = new Hono<{ Bindings: Bindings }>()

app.use(prettyJSON({ space: 4 }))
app.use(secureHeaders())

app.get('/', c => c.text('Hello from lablet.ai!'))

app.post('/webhook/:source', cache({
  cacheName: ENV.CACHE_NAMESPACE,
  cacheControl: ENV.CACHE_TTL.toString(),
}), async (c) => {
  const source = c.req.param('source') as Source
  const webhookHandler = new WebhookHandler(c.env)
  return await webhookHandler.handler(source, c.req)
})

export default app
