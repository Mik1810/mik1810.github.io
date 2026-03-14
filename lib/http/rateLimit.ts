import { HttpError } from './apiUtils.js'
import type { ApiRequest } from '../types/http.js'

interface RateLimitBucket {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  keyPrefix: string
  limit: number
  windowMs: number
}

const buckets = new Map<string, RateLimitBucket>()

const getClientIp = (req: ApiRequest) => {
  if (typeof req.ip === 'string' && req.ip.trim()) {
    return req.ip.trim()
  }

  const forwardedFor = req.headers?.['x-forwarded-for']
  const candidate = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = req.headers?.['x-real-ip']
  const fallback = Array.isArray(realIp) ? realIp[0] : realIp
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : 'unknown'
}

const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export const enforceRateLimit = (
  req: ApiRequest,
  options: RateLimitOptions
) => {
  const now = Date.now()
  cleanupExpiredBuckets(now)

  const clientKey = `${options.keyPrefix}:${getClientIp(req)}`
  const current = buckets.get(clientKey)

  if (!current || current.resetAt <= now) {
    buckets.set(clientKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return
  }

  if (current.count >= options.limit) {
    throw new HttpError(429, 'Too many requests')
  }

  current.count += 1
}
