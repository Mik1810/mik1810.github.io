import type { SessionUser } from '../../types/auth.js'

import { getSupabaseAuthConfig } from '../../config/env.js'
import { logTiming } from '../../logger.js'

const ADMIN_AUTH_TIMEOUT_MS = 12000

interface SupabaseAuthResponse {
  user?: {
    id: string
    email?: string | null
  } | null
}

const hasAuthUser = (
  value: SupabaseAuthResponse | { error_description?: string; msg?: string; message?: string } | null
): value is SupabaseAuthResponse =>
  !!value && typeof value === 'object' && 'user' in value

export const signInAdmin = async (
  email: string,
  password: string
): Promise<SessionUser> => {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAuthConfig()
  const startedAt = Date.now()
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), ADMIN_AUTH_TIMEOUT_MS)

  logTiming('repo.admin.signin.start', { timeoutMs: ADMIN_AUTH_TIMEOUT_MS })
  let response: Response

  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
      },
      body: JSON.stringify({
        email,
        password,
      }),
      signal: timeoutController.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      logTiming('repo.admin.signin.timeout', {
        durationMs: Date.now() - startedAt,
      })
      throw new Error('Auth provider timeout')
    }
    logTiming('repo.admin.signin.fetch_error', {
      durationMs: Date.now() - startedAt,
    })
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  const payload = (await response.json().catch(() => null)) as
    | SupabaseAuthResponse
    | { error_description?: string; msg?: string; message?: string }
    | null

  if (!response.ok) {
    logTiming('repo.admin.signin.auth_failed', {
      status: response.status,
      durationMs: Date.now() - startedAt,
    })
    const message =
      (payload &&
        'error_description' in payload &&
        payload.error_description) ||
      (payload && 'msg' in payload && payload.msg) ||
      (payload && 'message' in payload && payload.message) ||
      'Invalid login credentials'
    throw new Error(message)
  }

  const user: SessionUser | null = hasAuthUser(payload) && payload.user
    ? { id: payload.user.id, email: payload.user.email || '' }
    : null

  if (!user || !user.email) {
    throw new Error('Invalid user session')
  }

  logTiming('repo.admin.signin.end', {
    durationMs: Date.now() - startedAt,
  })
  return user
}
