import type { ApiMethod, ApiRequest, ApiResponse } from '../types/http.js'

export class HttpError extends Error {
  statusCode: number
  expose: boolean

  constructor(statusCode: number, message: string, expose = true) {
    super(message)
    this.statusCode = statusCode
    this.expose = expose
  }
}

export const enforceMethod = (
  req: ApiRequest,
  res: ApiResponse,
  allowedMethod: ApiMethod
) => {
  if (req.method === allowedMethod) return true
  res.setHeader('Allow', allowedMethod)
  res.status(405).json({ error: 'Method not allowed' })
  return false
}

export const respondWithError = (
  res: ApiResponse,
  error: unknown,
  fallbackMessage = 'Internal server error'
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ error: error.message })
  }

  return res.status(500).json({ error: fallbackMessage })
}

export const requireNonEmptyString = (
  value: unknown,
  errorMessage: string,
  options?: { trim?: boolean; maxLength?: number }
) => {
  if (typeof value !== 'string') {
    throw new HttpError(400, errorMessage)
  }

  const normalized = options?.trim === false ? value : value.trim()
  if (!normalized) {
    throw new HttpError(400, errorMessage)
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    throw new HttpError(400, errorMessage)
  }

  return normalized
}

export const requireRecord = (value: unknown, errorMessage: string) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, errorMessage)
  }

  return value as Record<string, unknown>
}
