import { env } from '../env.js'
import { decodeJwtPayload } from './jwt.js'

export interface GoogleProfile {
  sub: string
  email: string
  emailVerified: boolean
  name?: string
}

function callbackUrl(): string {
  return `${env.BACKEND_PUBLIC_URL}/api/auth/google/callback`
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface GoogleIdTokenClaims {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
}

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl(),
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Google token exchange failed (${response.status}): ${body}`)
  }

  const { id_token } = (await response.json()) as { id_token: string }
  const claims = decodeJwtPayload<GoogleIdTokenClaims>(id_token)
  if (!claims.email) throw new Error('Google did not return an email claim')

  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified ?? false,
    name: claims.name,
  }
}
