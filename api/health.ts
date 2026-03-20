import { enforceMethod, respondWithError } from '../lib/http/apiUtils.js'
import { enforceRateLimit } from '../lib/http/rateLimit.js'
import {
  createPublicHealthPayload,
  runDatabaseHealthCheck,
} from '../lib/services/healthService.js'
import type { ApiHandler } from '../lib/types/http.js'

const RATE_LIMIT = {
  keyPrefix: 'public-health',
  limit: 120,
  windowMs: 60 * 1000,
}

const handler: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  try {
    enforceRateLimit(req, res, RATE_LIMIT)

    const database = await runDatabaseHealthCheck()
    const payload = createPublicHealthPayload(database)

    res.setHeader('Cache-Control', 'no-store')
    return res.status(database.ok ? 200 : 503).json(payload)
  } catch (error) {
    return respondWithError(res, error)
  }
}

export default handler
