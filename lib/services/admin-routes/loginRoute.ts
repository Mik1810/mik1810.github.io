import {
  HttpError,
  enforceMethod,
  parseBodyWithSchema,
  respondWithError,
} from '../../http/apiUtils.js'
import { adminLoginBodySchema } from '../../http/requestSchemas.js'
import { enforceRateLimit } from '../../http/rateLimit.js'
import { logApiError, logTiming } from '../../logger.js'
import { loginAdmin } from '../adminAuthService.js'
import type { ApiHandler } from '../../types/http.js'

interface LoginBody {
  email?: string
  password?: string
}

export const handleAdminLoginRoute: ApiHandler<LoginBody> = async (req, res) => {
  if (!enforceMethod(req, res, 'POST')) return

  const startedAt = Date.now()
  logTiming('api.admin.login.start', { url: req.url })

  try {
    enforceRateLimit(req, res, {
      keyPrefix: 'admin-login',
      limit: 5,
      windowMs: 60 * 1000,
    })

    const { email, password } = parseBodyWithSchema(req, adminLoginBodySchema)
    const { user, cookie } = await loginAdmin(email, password)
    res.setHeader('Set-Cookie', cookie)
    logTiming('api.admin.login.end', { durationMs: Date.now() - startedAt })
    return res.status(200).json({ user })
  } catch (error) {
    logTiming('api.admin.login.error', { durationMs: Date.now() - startedAt })
    if (error instanceof Error && error.message === 'Invalid user session') {
      return respondWithError(
        res,
        new HttpError(401, error.message, { code: 'invalid_user_session' })
      )
    }
    if (error instanceof HttpError) {
      return respondWithError(res, error)
    }
    if (error instanceof Error && error.message) {
      logApiError('admin.login', error, { url: req.url })
      return respondWithError(
        res,
        new HttpError(401, error.message, { code: 'auth_failed' })
      )
    }
    logApiError('admin.login', error, { url: req.url })
    return respondWithError(res, error)
  }
}
