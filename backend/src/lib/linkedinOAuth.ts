import { env } from '../env.js'
import { decodeJwtPayload } from './jwt.js'

export interface LinkedInProfile {
  sub: string
  email: string
  emailVerified: boolean
  name?: string
}

interface LinkedInIdTokenClaims {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
}

function callbackUrl(): string {
  return `${env.BACKEND_PUBLIC_URL}/api/auth/linkedin/callback`
}

export function buildLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: callbackUrl(),
    scope: 'openid profile email',
    state,
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

export async function exchangeCodeForLinkedInProfile(code: string): Promise<LinkedInProfile> {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl(),
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`LinkedIn token exchange failed (${response.status}): ${body}`)
  }

  const { id_token } = (await response.json()) as { id_token: string }
  const claims = decodeJwtPayload<LinkedInIdTokenClaims>(id_token)
  if (!claims.email) throw new Error('LinkedIn did not return an email claim')

  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified ?? false,
    name: claims.name,
  }
}
