import { handleAdminEnvironmentRoute } from '../lib/services/admin-routes/environmentRoute.js'
import { handleAdminHealthRoute } from '../lib/services/admin-routes/healthRoute.js'
import { handleAdminLoginRoute } from '../lib/services/admin-routes/loginRoute.js'
import { handleAdminDbLatencyMetricRoute } from '../lib/services/admin-routes/metricsDbLatencyRoute.js'
import { handleAdminLogoutRoute } from '../lib/services/admin-routes/logoutRoute.js'
import { handleAdminSessionRoute } from '../lib/services/admin-routes/sessionRoute.js'
import { handleAdminTableRoute } from '../lib/services/admin-routes/tableRoute.js'
import { handleAdminTablesRoute } from '../lib/services/admin-routes/tablesRoute.js'
import type { ApiHandler, ApiRequest } from '../lib/types/http.js'

const REQUEST_URL_BASE = 'http://localhost'

const getAdminRoute = (req: ApiRequest) => {
  if (!req.url) return null

  try {
    const url = new URL(req.url, REQUEST_URL_BASE)
    const queryRoute = url.searchParams.get('route')
    if (queryRoute) return queryRoute

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 3 || parts[0] !== 'api' || parts[1] !== 'admin') return null
    return parts.slice(2).join('/') || null
  } catch {
    return null
  }
}

const handler: ApiHandler = async (req, res) => {
  const route = getAdminRoute(req)

  switch (route) {
    case 'session':
      return handleAdminSessionRoute(req, res)
    case 'login':
      return handleAdminLoginRoute(req, res)
    case 'logout':
      return handleAdminLogoutRoute(req, res)
    case 'tables':
      return handleAdminTablesRoute(req, res)
    case 'table':
      return handleAdminTableRoute(req, res)
    case 'health':
      return handleAdminHealthRoute(req, res)
    case 'environment':
      return handleAdminEnvironmentRoute(req, res)
    case 'metrics/db-latency':
      return handleAdminDbLatencyMetricRoute(req, res)
    default:
      return res.status(404).json({
        error: 'Admin route not found',
        code: 'not_found',
      })
  }
}

export default handler
