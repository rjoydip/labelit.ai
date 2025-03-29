import type { Env } from '@labelit/types'
import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { Handler } from './handler'

const app = new Hono<{ Bindings: Env }>()

app.use(prettyJSON({ space: 4 }))
app.use(secureHeaders())

app.get('/', c => c.text('Hello from labelit.ai!'))

app.post('/webhook/events', async (c) => {
  const handler = new Handler(c.env)
  return await handler.handle(c.req)
})

export default app
