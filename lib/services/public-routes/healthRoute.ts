import { enforceMethod, respondWithError } from '../../http/apiUtils.js'
import { enforceRateLimit } from '../../http/rateLimit.js'
import {
  createPublicHealthPayload,
  runDatabaseHealthCheck,
} from '../healthService.js'
import type { ApiHandler } from '../../types/http.js'

const RATE_LIMIT = {
  keyPrefix: 'public-health',
  limit: 120,
  windowMs: 60 * 1000,
}

export const handlePublicHealthRoute: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  try {
    await enforceRateLimit(req, res, RATE_LIMIT)

    const database = await runDatabaseHealthCheck()
    const payload = createPublicHealthPayload(database)

    res.setHeader('Cache-Control', 'no-store')
    return res.status(database.ok ? 200 : 503).json(payload)
  } catch (error) {
    return respondWithError(res, error)
  }
}
