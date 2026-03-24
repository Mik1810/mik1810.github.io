import { appEnv } from '../../config/env.js'
import { enforceMethod, parseBodyWithSchema, respondWithError } from '../../http/apiUtils.js'
import { contactBodySchema } from '../../http/requestSchemas.js'
import { enforceRateLimit } from '../../http/rateLimit.js'
import { sendContactMessage } from '../contactService.js'
import type { ApiHandler } from '../../types/http.js'

const RATE_LIMIT = {
  keyPrefix: 'public-contact',
  limit: appEnv.isProduction ? 6 : 20,
  windowMs: 10 * 60 * 1000,
}

export const handlePublicContactRoute: ApiHandler = async (req, res) => {
  if (!enforceMethod(req, res, 'POST')) return

  try {
    await enforceRateLimit(req, res, RATE_LIMIT)

    const payload = parseBodyWithSchema(req, contactBodySchema)

    await sendContactMessage({
      name: payload.name,
      email: payload.email,
      message: payload.message,
      locale: payload.locale,
    })

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      ok: true,
    })
  } catch (error) {
    return respondWithError(res, error)
  }
}
