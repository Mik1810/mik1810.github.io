import { getSessionFromRequest } from '../../lib/authSession.js'
import type { ApiHandler } from '../../lib/types/http.js'
import type { AdminSessionResponse } from '../../lib/types/admin.js'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromRequest(req)
  if (!session) {
    const payload: AdminSessionResponse = { authenticated: false, user: null }
    return res.status(200).json(payload)
  }

  const payload: AdminSessionResponse = {
    authenticated: true,
    user: { id: session.sub, email: session.email },
  }

  return res.status(200).json(payload)
}

export default handler
