import { MemoryCache } from '../../cache/memoryCache.js'
import type { ProjectsResponse } from '../../db/repositories/projectsRepository.js'
import {
  enforceMethod,
  parseQueryWithSchema,
  respondWithError,
} from '../../http/apiUtils.js'
import {
  RequestAbortedError,
  throwIfAborted,
  withAbortSignal,
} from '../../http/abort.js'
import { localeQuerySchema } from '../../http/requestSchemas.js'
import { enforceRateLimit } from '../../http/rateLimit.js'
import { logApiError, logTiming } from '../../logger.js'
import {
  getProjectsContent,
  normalizeRepositoryLocale,
} from '../publicContentService.js'
import type { ApiHandler } from '../../types/http.js'

const CACHE_TTL_MS = 60 * 1000
const cache = new MemoryCache<ProjectsResponse>()
const RATE_LIMIT = {
  keyPrefix: 'public-projects',
  limit: 180,
  windowMs: 60 * 1000,
}

export const handlePublicProjectsRoute: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  let lang = normalizeRepositoryLocale(undefined)
  const startedAt = Date.now()
  logTiming('api.projects.start', { url: req.url })

  try {
    throwIfAborted(req.signal)
    await enforceRateLimit(req, res, RATE_LIMIT)

    const { lang: rawLang } = parseQueryWithSchema(req, localeQuerySchema)
    lang = normalizeRepositoryLocale(rawLang)
    const cacheKey = `projects:${lang}`
    const cached = cache.get(cacheKey)
    if (cached) {
      throwIfAborted(req.signal)
      logTiming('api.projects.cache_hit', {
        lang,
        durationMs: Date.now() - startedAt,
      })
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
      return res.status(200).json(cached)
    }

    const payloadPromise = getProjectsContent(lang)
    const payload = await withAbortSignal(payloadPromise, req.signal)
    throwIfAborted(req.signal)
    const { projects, githubProjects } = payload

    if (
      (projects.length > 0 && projects.some((project) => project.title)) ||
      (githubProjects.length > 0 && githubProjects.some((project) => project.title))
    ) {
      cache.set(cacheKey, payload, CACHE_TTL_MS)
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    logTiming('api.projects.end', { lang, durationMs: Date.now() - startedAt })
    return res.status(200).json(payload)
  } catch (error) {
    if (error instanceof RequestAbortedError) return
    logTiming('api.projects.error', { lang, durationMs: Date.now() - startedAt })
    logApiError('projects', error, { lang, url: req.url })
    return respondWithError(res, error)
  }
}
