// Minimal, dependency-free HS256 JWT (sign + verify) using Node's crypto.
// Keeps the server's "no extra install surface" ethos — no jsonwebtoken dep.
// Set JWT_SECRET in production; the dev default is intentionally obvious.

import crypto from 'crypto'

const SECRET = process.env.JWT_SECRET || 'eventify-dev-secret-change-me'
const EXPIRES_SECONDS = Number(process.env.JWT_EXPIRES_SECONDS) || 8 * 60 * 60 // 8h

const b64url = (input) => Buffer.from(input).toString('base64url')

export function sign(payload) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + EXPIRES_SECONDS }))
  const data = `${header}.${body}`
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

// Returns the decoded payload, or null if the token is malformed, tampered,
// or expired.
export function verify(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts

  const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null
  return payload
}
