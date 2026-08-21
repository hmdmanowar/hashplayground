import { buildApp } from './app.js'
import { env } from './env.js'

async function main() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`Backend listening on port ${env.PORT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
