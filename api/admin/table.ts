import { requireAdminSession } from '../../lib/requireAdminSession.js'
import {
  createAdminRow,
  editAdminRow,
  getAdminRows,
  getAdminTableConfigOrNull,
  getAllowedAdminTable,
  hasAllPrimaryKeys,
  normalizeAdminPayload,
  parseAdminTableLimit,
  removeAdminRow,
} from '../../lib/services/adminTableService.js'
import { HttpError, respondWithError } from '../../lib/http/apiUtils.js'
import { enforceRateLimit } from '../../lib/http/rateLimit.js'
import { logApiError } from '../../lib/logger.js'
import type { ApiHandler, ApiRequest } from '../../lib/types/http.js'

interface TableBody {
  row?: Record<string, unknown>
  keys?: Record<string, unknown>
}

const handler: ApiHandler<TableBody> = async (req, res) => {
  const admin = requireAdminSession(req, res)
  if (!admin) return

  try {
    enforceRateLimit(req, {
      keyPrefix: 'admin-table',
      limit: 120,
      windowMs: 60 * 1000,
    })
  } catch (error) {
    return respondWithError(res, error)
  }

  const rawTable = req.query?.table
  if (!rawTable || typeof rawTable !== 'string') {
    return res.status(400).json({ error: 'Missing table parameter' })
  }
  const table = getAllowedAdminTable(rawTable)

  if (!table) {
    return res.status(400).json({ error: 'Table not allowed' })
  }
  const config = getAdminTableConfigOrNull(table)

  try {
    if (req.method === 'GET') {
      const limit = parseAdminTableLimit(req.query?.limit)
      const rows = await getAdminRows(table, limit)
      return res.status(200).json({ rows })
    }

    const body = (req as ApiRequest<TableBody>).body || {}

    if (req.method === 'POST') {
      const row = normalizeAdminPayload(body.row)
      const createdRow = await createAdminRow(table, row)
      return res.status(201).json({ row: createdRow })
    }

    if (req.method === 'PATCH') {
      const keys = normalizeAdminPayload(body.keys)
      const row = normalizeAdminPayload(body.row)
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' })
      }

      const updatedRow = await editAdminRow(table, keys, row)
      return res.status(200).json({ row: updatedRow })
    }

    if (req.method === 'DELETE') {
      const keys = normalizeAdminPayload(body.keys)
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' })
      }

      const result = await removeAdminRow(table, keys)
      return res.status(200).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Database error') {
      logApiError('admin.table', error, { table, method: req.method, url: req.url })
      return respondWithError(res, new HttpError(500, 'Database error'))
    }
    if (error instanceof Error && error.message) {
      return respondWithError(res, new HttpError(500, error.message))
    }
    logApiError('admin.table', error, { table, method: req.method, url: req.url })
    return respondWithError(res, error)
  }
}

export default handler
