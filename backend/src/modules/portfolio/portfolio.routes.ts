import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireTopAdmin } from '../../middleware/auth.js'
import { getPortfolioContent, updatePortfolioContent } from './portfolio.service.js'

const experienceEntrySchema = z.object({
  role: z.string().trim().min(1),
  company: z.string().trim().min(1),
  companyUrl: z.string().trim().optional(),
  dates: z.string().trim().min(1),
  location: z.string().trim().min(1),
  current: z.boolean(),
  bullets: z.array(z.string().trim().min(1)),
  tags: z.array(z.string().trim().min(1)),
})

const educationEntrySchema = z.object({
  school: z.string().trim().min(1),
  degree: z.string().trim().min(1),
  dates: z.string().trim().min(1),
})

const skillGroupSchema = z.object({
  label: z.string().trim().min(1),
  skills: z.array(z.string().trim().min(1)),
})

const portfolioContentSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(1),
    title: z.string().trim().min(1),
    tagline: z.string().trim().min(1),
    location: z.string().trim().min(1),
    email: z.string().trim().min(1),
    linkedin: z.string().trim().min(1),
    website: z.string().trim().min(1),
    statusLabel: z.string().trim().min(1),
    techHighlights: z.array(z.string().trim().min(1)),
    yearsLabel: z.string().trim().min(1),
  }),
  summaryParagraphs: z.array(z.string().trim().min(1)),
  experience: z.array(experienceEntrySchema),
  project: z.object({
    name: z.string().trim().min(1),
    url: z.string().trim().min(1),
    description: z.string().trim().min(1),
    note: z.string().trim().min(1),
    features: z.array(z.string().trim().min(1)),
    stack: z.array(z.string().trim().min(1)),
  }),
  education: z.array(educationEntrySchema),
  skillGroups: z.array(skillGroupSchema),
})

const portfolioContentResultSchema = z.object({
  data: portfolioContentSchema.nullable(),
  updatedAt: z.string().nullable(),
})

export const portfolioRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get('/', { schema: { response: { 200: portfolioContentResultSchema } } }, async (_request, reply) => {
    reply.send(await getPortfolioContent())
  })

  app.patch(
    '/',
    {
      preHandler: requireTopAdmin,
      schema: { body: portfolioContentSchema, response: { 200: portfolioContentResultSchema } },
    },
    async (request, reply) => {
      reply.send(await updatePortfolioContent(request.body, request.authUser!.username))
    },
  )
}
