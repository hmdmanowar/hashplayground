import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().min(1),
  SEED_ADMIN_USERNAME: z.string().default('admin'),
  SEED_ADMIN_PASSWORD: z.string().default('admin123'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().default('Hash Playground <onboarding@resend.dev>'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  LINKEDIN_CLIENT_ID: z.string().min(1),
  LINKEDIN_CLIENT_SECRET: z.string().min(1),
  // This service's own public URL — used to build OAuth redirect URIs, which
  // must exactly match what's registered with each provider. Derived from a
  // request header instead, it'd be wrong behind Render's proxy unless
  // trust-proxy were configured; an explicit env var sidesteps that entirely.
  BACKEND_PUBLIC_URL: z.string().min(1),
})

export const env = envSchema.parse(process.env)
