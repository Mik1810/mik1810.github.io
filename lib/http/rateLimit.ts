import { HttpError } from './apiUtils.js'
import type { ApiResponse, ApiRequest } from '../types/http.js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitBucket {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  keyPrefix: string
  limit: number
  windowMs: number
}

type RateLimitMode = 'memory' | 'redis'

class RateLimitError extends HttpError {
  resetAt: number
  retryAfterSeconds: number
  limit: number

  constructor(limit: number, resetAt: number, retryAfterSeconds: number) {
    super(429, 'Too many requests', { code: 'rate_limited' })
    this.limit = limit
    this.resetAt = resetAt
    this.retryAfterSeconds = retryAfterSeconds
  }
}

const buckets = new Map<string, RateLimitBucket>()
const distributedLimiters = new Map<string, Ratelimit>()
let redisClientCache: Redis | null | undefined
let warnedMissingRedisConfig = false
let warnedRedisRuntimeFallback = false

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

const setRateLimitHeaders = (
  res: ApiResponse,
  limit: number,
  remaining: number,
  resetAt: number
) => {
  res.setHeader('X-RateLimit-Limit', String(limit))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
}

const setMemoryRateLimitHeaders = (
  res: ApiResponse,
  options: RateLimitOptions,
  bucket: RateLimitBucket
) => {
  const remaining = Math.max(options.limit - bucket.count, 0)
  setRateLimitHeaders(res, options.limit, remaining, bucket.resetAt)
}

const parseRateLimitMode = (): RateLimitMode => {
  const rawMode = process.env.RATE_LIMIT_MODE?.trim().toLowerCase()
  return rawMode === 'redis' ? 'redis' : 'memory'
}

const warnOnce = (kind: 'missing_config' | 'runtime_fallback', metadata?: unknown) => {
  if (kind === 'missing_config') {
    if (warnedMissingRedisConfig) return
    warnedMissingRedisConfig = true
    console.warn('[WARN] rate_limit.redis.disabled_missing_config', metadata || {})
    return
  }

  if (warnedRedisRuntimeFallback) return
  warnedRedisRuntimeFallback = true
  console.warn('[WARN] rate_limit.redis.runtime_fallback_memory', metadata || {})
}

const getRedisClient = () => {
  if (redisClientCache !== undefined) {
    return redisClientCache
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!redisUrl || !redisToken) {
    warnOnce('missing_config', {
      hasRedisUrl: Boolean(redisUrl),
      hasRedisToken: Boolean(redisToken),
      rateLimitMode: parseRateLimitMode(),
    })
    redisClientCache = null
    return redisClientCache
  }

  redisClientCache = new Redis({
    url: redisUrl,
    token: redisToken,
  })

  return redisClientCache
}

const getDistributedLimiter = (options: RateLimitOptions) => {
  const redis = getRedisClient()
  if (!redis) {
    return null
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000))
  const limiterKey = `${options.keyPrefix}:${options.limit}:${windowSeconds}`
  const existing = distributedLimiters.get(limiterKey)
  if (existing) {
    return existing
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(options.limit, `${windowSeconds} s`),
    prefix: `rl:${options.keyPrefix}`,
  })
  distributedLimiters.set(limiterKey, limiter)
  return limiter
}

const enforceMemoryRateLimit = (
  req: ApiRequest,
  res: ApiResponse,
  options: RateLimitOptions
) => {
  const now = Date.now()
  cleanupExpiredBuckets(now)

  const clientKey = `${options.keyPrefix}:${getClientIp(req)}`
  const current = buckets.get(clientKey)

  if (!current || current.resetAt <= now) {
    const bucket = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    buckets.set(clientKey, bucket)
    setMemoryRateLimitHeaders(res, options, bucket)
    return
  }

  if (current.count >= options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    )
    setMemoryRateLimitHeaders(res, options, current)
    res.setHeader('Retry-After', String(retryAfterSeconds))
    throw new RateLimitError(options.limit, current.resetAt, retryAfterSeconds)
  }

  current.count += 1
  setMemoryRateLimitHeaders(res, options, current)
}

const enforceDistributedRateLimit = async (
  req: ApiRequest,
  res: ApiResponse,
  options: RateLimitOptions
) => {
  const limiter = getDistributedLimiter(options)
  if (!limiter) {
    enforceMemoryRateLimit(req, res, options)
    return
  }

  const clientKey = getClientIp(req)
  const now = Date.now()
  const result = await limiter.limit(clientKey)
  const resetAt =
    typeof result.reset === 'number' && result.reset > 0
      ? result.reset
      : now + options.windowMs

  setRateLimitHeaders(
    res,
    typeof result.limit === 'number' ? result.limit : options.limit,
    typeof result.remaining === 'number'
      ? Math.max(result.remaining, 0)
      : result.success
        ? Math.max(options.limit - 1, 0)
        : 0,
    resetAt
  )

  if (!result.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000))
    res.setHeader('Retry-After', String(retryAfterSeconds))
    throw new RateLimitError(options.limit, resetAt, retryAfterSeconds)
  }
}

export const enforceRateLimit = async (
  req: ApiRequest,
  res: ApiResponse,
  options: RateLimitOptions
) => {
  const mode = parseRateLimitMode()
  if (mode !== 'redis') {
    enforceMemoryRateLimit(req, res, options)
    return
  }

  try {
    await enforceDistributedRateLimit(req, res, options)
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error
    }

    warnOnce('runtime_fallback', {
      keyPrefix: options.keyPrefix,
      message: error instanceof Error ? error.message : 'unknown_error',
      mode,
    })
    // Resilient fallback: if the distributed backend is unavailable, keep protection active in-memory.
    enforceMemoryRateLimit(req, res, options)
  }
}

