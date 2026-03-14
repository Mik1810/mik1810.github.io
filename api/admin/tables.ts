import { requireAdminSession } from '../../lib/requireAdminSession.js'
import { ADMIN_TABLES } from '../../lib/adminTables.js'
import type { ApiHandler } from '../../lib/types/http.js'

const handler: ApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = requireAdminSession(req, res)
  if (!admin) return

  const tables = Object.entries(ADMIN_TABLES).map(([name, config]) => ({
    name,
    label: config.label,
    primaryKeys: config.primaryKeys,
    defaultRow: config.defaultRow || {},
  }))

  return res.status(200).json({ tables })
}

export default handler
