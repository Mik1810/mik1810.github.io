import { getSessionFromRequest } from './authSession.js'
import type { SessionUser } from './types/auth.js'
import type { ApiRequest, ApiResponse } from './types/http.js'

export function requireAdminSession(
  req: ApiRequest,
  res: ApiResponse
): SessionUser | null {
  const session = getSessionFromRequest(req)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return { id: session.sub, email: session.email }
}
