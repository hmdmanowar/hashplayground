import { buildApp } from './app.js'
import { env } from './env.js'

async function main() {
  const app = await buildApp()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`Backend listening on port ${env.PORT}`)
  // TEMPORARY — remove once the GITHUB_REPO_TOKEN visibility issue is
  // diagnosed. Never logs the value itself, just whether it's present.
  app.log.info(
    `GITHUB_REPO_TOKEN: present=${Boolean(env.GITHUB_REPO_TOKEN)} length=${env.GITHUB_REPO_TOKEN?.length ?? 0} rawPresent=${Boolean(process.env.GITHUB_REPO_TOKEN)} rawLength=${process.env.GITHUB_REPO_TOKEN?.length ?? 0}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
