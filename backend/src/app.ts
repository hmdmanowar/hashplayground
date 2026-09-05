import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from './env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { loadAuthUser } from './middleware/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { projectsRoutes } from './modules/projects/projects.routes.js'
import { filesRoutes } from './modules/files/files.routes.js'
import { versionsRoutes } from './modules/versions/versions.routes.js'
import { exportsRoutes } from './modules/exports/exports.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { feedbackRoutes } from './modules/feedback/feedback.routes.js'
import { portfolioRoutes } from './modules/portfolio/portfolio.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  })
  await app.register(cookie)
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.addHook('onRequest', loadAuthUser)

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(usersRoutes, { prefix: '/api/users' })
  await app.register(projectsRoutes, { prefix: '/api/projects' })
  await app.register(filesRoutes, { prefix: '/api/projects' })
  await app.register(versionsRoutes, { prefix: '/api/projects' })
  await app.register(exportsRoutes, { prefix: '/api/projects' })
  await app.register(notificationsRoutes, { prefix: '/api/notifications' })
  await app.register(feedbackRoutes, { prefix: '/api/feedback' })
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' })

  return app
}
