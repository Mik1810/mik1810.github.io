import crypto from 'node:crypto'

import type { ApiRequest } from './types/http.js'
import type { SessionPayload, SessionUser } from './types/auth.js'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const base64urlEncode = (input: string) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const base64urlDecode = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing AUTH_SESSION_SECRET')
  }
  return 'dev-only-insecure-secret-change-me'
}

function sign(data: string) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url')
}

export function parseCookies(cookieHeader = ''): Record<string, string> {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf('=')
      if (idx <= 0) return acc
      const key = part.slice(0, idx)
      const value = part.slice(idx + 1)
      acc[key] = value
      return acc
    }, {})
}

export function createSessionToken(user: SessionUser) {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [encodedPayload, signature] = token.split('.')
  const expectedSignature = sign(encodedPayload)
  if (!signature || signature.length !== expectedSignature.length) {
    return null
  }
  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return null
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as Partial<SessionPayload>
    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp < now) return null
    if (!payload.sub || !payload.email) return null
    return payload as SessionPayload
  } catch {
    return null
  }
}

export function createSessionCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === 'production'
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function getSessionFromRequest(req: ApiRequest) {
  const cookieHeader = req.headers?.cookie
  const cookies = parseCookies(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader || '')
  const token = cookies[SESSION_COOKIE_NAME]
  return verifySessionToken(token)
}
