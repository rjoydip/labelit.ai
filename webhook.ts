import SmeeClient from 'smee-client'

const smee = new SmeeClient({
  source: Bun.env.WEBHOOK_PROXY ?? 'https://smee.io/abc123',
  target: Bun.env.TARGET_URL ?? 'http://localhost:3000/events',
  logger: console
})

const events = smee.start()

process.on('SIGINT', () => {
  events.close()
  console.log('>>> Closed smee client')
  process.exit(1)
})