import { enforceMethod, respondWithError } from '../../http/apiUtils.js'
import { requireAdminSession } from '../../requireAdminSession.js'
import { runDatabaseHealthCheck } from '../healthService.js'
import type { ApiHandler } from '../../types/http.js'

export const handleAdminDbLatencyMetricRoute: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  const admin = requireAdminSession(req, res)
  if (!admin) return

  try {
    const database = await runDatabaseHealthCheck()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(database.ok ? 200 : 503).json({
      ok: database.ok,
      timestamp: new Date().toISOString(),
      database: {
        ok: database.ok,
        latencyMs: database.latencyMs,
      },
    })
  } catch (error) {
    return respondWithError(res, error)
  }
}
