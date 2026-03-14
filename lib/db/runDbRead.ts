const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const runDbRead = async <T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number
    retryDelayMs?: number
  }
): Promise<T> => {
  const retries = options?.retries ?? 1
  const retryDelayMs = options?.retryDelayMs ?? 120

  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await wait(retryDelayMs * (attempt + 1))
      attempt += 1
    }
  }

  throw lastError
}
