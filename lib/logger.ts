export const logApiError = (
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) => {
  const details =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          cause:
            error.cause instanceof Error
              ? {
                  message: error.cause.message,
                  stack: error.cause.stack,
                  name: error.cause.name,
                }
              : error.cause,
        }
      : { error }

  console.error(`[api] ${context}`, {
    ...details,
    ...(metadata || {}),
  })
}

const isTimingLoggingEnabled =
  (process.env.NODE_ENV || 'development') !== 'production'

export const logTiming = (
  context: string,
  metadata?: Record<string, unknown>
) => {
  if (!isTimingLoggingEnabled) return
  console.info(`[DEBUG] ${context}`, metadata || {})
}
