import type { ApiHandler } from '../lib/types/http.js'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    ok: true,
    service: 'api',
    timestamp: new Date().toISOString(),
  })
}

export default handler
