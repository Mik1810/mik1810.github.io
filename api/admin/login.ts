import { loginAdmin } from '../../lib/services/adminAuthService.js'
import {
  HttpError,
  enforceMethod,
  requireNonEmptyString,
  respondWithError,
} from '../../lib/http/apiUtils.js'
import { enforceRateLimit } from '../../lib/http/rateLimit.js'
import { logApiError } from '../../lib/logger.js'
import type { ApiHandler, ApiRequest } from '../../lib/types/http.js'

interface LoginBody {
  email?: string
  password?: string
}

const handler: ApiHandler<LoginBody> = async (req, res) => {
  if (!enforceMethod(req, res, 'POST')) return

  try {
    enforceRateLimit(req, {
      keyPrefix: 'admin-login',
      limit: 5,
      windowMs: 60 * 1000,
    })

    const { email, password } = (req as ApiRequest<LoginBody>).body || {}
    const safeEmail = requireNonEmptyString(email, 'Email e password obbligatorie', {
      maxLength: 320,
    })
    const safePassword = requireNonEmptyString(
      password,
      'Email e password obbligatorie',
      { maxLength: 4096 }
    )

    const { user, cookie } = await loginAdmin(safeEmail, safePassword)
    res.setHeader('Set-Cookie', cookie)

    return res.status(200).json({
      user,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid user session') {
      return respondWithError(res, new HttpError(401, error.message))
    }
    if (error instanceof HttpError) {
      return respondWithError(res, error)
    }
    if (error instanceof Error && error.message) {
      logApiError('admin.login', error, { url: req.url })
      return respondWithError(res, new HttpError(401, error.message))
    }
    logApiError('admin.login', error, { url: req.url })
    return respondWithError(res, error)
  }
}

export default handler
