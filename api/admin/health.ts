import { enforceMethod, respondWithError } from '../../lib/http/apiUtils.js'
import { requireAdminSession } from '../../lib/requireAdminSession.js'
import {
  createAdminHealthPayload,
  runDatabaseHealthCheck,
} from '../../lib/services/healthService.js'
import type { ApiHandler } from '../../lib/types/http.js'

const handler: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  const admin = requireAdminSession(req, res)
  if (!admin) return

  try {
    const database = await runDatabaseHealthCheck()
    const payload = createAdminHealthPayload(database)

    res.setHeader('Cache-Control', 'no-store')
    return res.status(database.ok ? 200 : 503).json(payload)
  } catch (error) {
    return respondWithError(res, error)
  }
}

export default handler
