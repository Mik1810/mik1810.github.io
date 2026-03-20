import { getAdminEnvironmentSnapshot } from '../../lib/config/env.js'
import { enforceMethod, respondWithError } from '../../lib/http/apiUtils.js'
import { requireAdminSession } from '../../lib/requireAdminSession.js'
import type { ApiHandler } from '../../lib/types/http.js'

const handler: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'GET')) return

  const admin = requireAdminSession(req, res)
  if (!admin) return

  try {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      environmentVariables: getAdminEnvironmentSnapshot(),
    })
  } catch (error) {
    return respondWithError(res, error)
  }
}

export default handler
