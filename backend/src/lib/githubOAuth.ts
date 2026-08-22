import { env } from '../env.js'

export interface GithubProfile {
  id: string
  login: string
  // Always present by the time this is returned — exchangeCodeForGithubProfile
  // throws if no email is accessible at all.
  email: string
  emailVerified: boolean
  name?: string
}

function callbackUrl(): string {
  return `${env.BACKEND_PUBLIC_URL}/api/auth/github/callback`
}

export function buildGithubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl(),
    scope: 'read:user user:email',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

interface GithubEmailEntry {
  email: string
  primary: boolean
  verified: boolean
}

export async function exchangeCodeForGithubProfile(code: string): Promise<GithubProfile> {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(),
    }),
  })

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => '')
    throw new Error(`GitHub token exchange failed (${tokenResponse.status}): ${body}`)
  }

  const { access_token, error } = (await tokenResponse.json()) as { access_token?: string; error?: string }
  if (!access_token) throw new Error(`GitHub token exchange returned no access_token (${error ?? 'unknown error'})`)

  const authHeaders = {
    Authorization: `Bearer ${access_token}`,
    // Required by GitHub's API regardless of auth — requests without one are rejected.
    'User-Agent': 'hash-playground',
    Accept: 'application/vnd.github+json',
  }

  const userResponse = await fetch('https://api.github.com/user', { headers: authHeaders })
  if (!userResponse.ok) throw new Error(`GitHub /user request failed (${userResponse.status})`)
  const user = (await userResponse.json()) as { id: number; login: string; name?: string; email?: string | null }

  // GitHub omits `email` from /user entirely when the user has made it
  // private — the verified primary address (if any) is only available via
  // this separate, `user:email`-scoped endpoint.
  let email = user.email ?? undefined
  let emailVerified = Boolean(email)
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: authHeaders })
    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as GithubEmailEntry[]
      const primary = emails.find((entry) => entry.primary) ?? emails.find((entry) => entry.verified)
      if (primary) {
        email = primary.email
        emailVerified = primary.verified
      }
    }
  }

  if (!email) throw new Error('GitHub account has no accessible email address')

  return { id: String(user.id), login: user.login, email, emailVerified, name: user.name ?? undefined }
}
