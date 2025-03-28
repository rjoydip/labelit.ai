import type { Env } from '@labelit/types'
import type { HandlerSource } from '@labelit/types/basic'
import { Config } from '@labelit/config'
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { Handler } from './handler'

const config = new Config()
const app = new Hono<{ Bindings: Env }>()

app.use(prettyJSON({ space: 4 }))
app.use(secureHeaders())

app.get('/', c => c.text('Hello from labelit.ai!'))

app.post('/webhook/:source', async (c, next) => {
  const env = config.getEnv(c.env)
  cache({
    cacheName: env.CACHE_NAMESPACE,
    cacheControl: env.CACHE_TTL.toString(),
  })
  await next()
}, async (c) => {
  const source = c.req.param('source') as HandlerSource
  const handler = new Handler(c.env)
  return await handler.handler(source, c.req)
})

export default app
