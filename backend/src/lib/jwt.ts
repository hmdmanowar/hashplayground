// Decodes (does not verify signature) a JWT's payload. Safe to use only when
// the token arrived directly from the issuer's own token endpoint over a
// server-to-server HTTPS call authenticated with our client secret — as with
// Google and LinkedIn's OIDC id_tokens — never for a client-supplied token.
export function decodeJwtPayload<T>(token: string): T {
  const payload = token.split('.')[1]
  const json = Buffer.from(payload, 'base64url').toString('utf8')
  return JSON.parse(json) as T
}
