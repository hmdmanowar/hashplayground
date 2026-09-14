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
  // Powers the personal Jarvis assistant (/jarvis, one logged-in account's
  // own conversations + personal workspace file tools — see modules/
  // jarvisAssistant). Points at Ollama Cloud by default (an always-on
  // hosted API, unlike the local Ollama instance the standalone Jarvis
  // project normally talks to) — this same client also works against a
  // self-hosted Ollama server later by just changing OLLAMA_HOST and
  // dropping OLLAMA_API_KEY.
  OLLAMA_HOST: z.string().min(1).default('https://ollama.com'),
  // Optional, unlike every other secret above — a missing key should only
  // disable the assistant itself, not crash the entire backend on startup
  // the way a missing DATABASE_URL or RESEND_API_KEY rightly would. This is
  // one additive feature, not something core app flows depend on.
  OLLAMA_API_KEY: z.string().min(1).optional(),
  // Verified working directly against the real API (2026-09-14) — Ollama's
  // cloud catalog changes over time, so if this one is ever retired too,
  // check ollama.com/search?c=cloud for a current tag.
  OLLAMA_CHAT_MODEL: z.string().default('gpt-oss:20b-cloud'),
})

export const env = envSchema.parse(process.env)
