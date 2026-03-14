import {
  getProfileContent,
  normalizeRepositoryLocale,
} from '../lib/services/publicContentService.js'
import { MemoryCache } from '../lib/cache/memoryCache.js'
import type { ProfileResponse } from '../lib/db/repositories/profileRepository.js'
import { enforceMethod, respondWithError } from '../lib/http/apiUtils.js'
import { logApiError } from '../lib/logger.js'
import type { ApiHandler } from '../lib/types/http.js'

const CACHE_TTL_MS = 60 * 1000

const cache = new MemoryCache<ProfileResponse>()

const handler: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  const lang = normalizeRepositoryLocale(req.query?.lang)
  const cacheKey = `profile:${lang}`
  const cached = cache.get(cacheKey)
  if (cached) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(cached)
  }

  try {
    const payload = await getProfileContent(lang)
    cache.set(cacheKey, payload, CACHE_TTL_MS)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(payload)
  } catch (error) {
    logApiError('profile', error, { lang, url: req.url })
    return respondWithError(res, error)
  }
}

export default handler
