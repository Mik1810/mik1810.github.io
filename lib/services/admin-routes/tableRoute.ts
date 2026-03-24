import {
  createAdminRow,
  createAdminRows,
  editAdminRow,
  getAdminRows,
  getAdminTableConfigOrNull,
  getAllowedAdminTable,
  hasAllPrimaryKeys,
  parseAdminTableLimit,
  requireAdminPayload,
  removeAdminRow,
} from '../adminTableService.js'
import {
  enforceMethods,
  HttpError,
  parseBodyWithSchema,
  parseQueryWithSchema,
  respondWithError,
} from '../../http/apiUtils.js'
import {
  adminTableBodySchema,
  adminTableQuerySchema,
} from '../../http/requestSchemas.js'
import { enforceRateLimit } from '../../http/rateLimit.js'
import { logApiError } from '../../logger.js'
import { requireAdminSession } from '../../requireAdminSession.js'
import type { ApiHandler } from '../../types/http.js'

interface TableBody {
  row?: Record<string, unknown>
  rows?: Record<string, unknown>[]
  keys?: Record<string, unknown>
}

export const  handleAdminTableRoute: ApiHandler<TableBody> = async (req, res) => {
  if (!enforceMethods(req, res, ['GET', 'POST', 'PATCH', 'DELETE'])) return

  const admin = requireAdminSession(req, res)
  if (!admin) return

  try {
    await enforceRateLimit(req, res, {
      keyPrefix: 'admin-table',
      limit: 120,
      windowMs: 60 * 1000,
    })
  } catch (error) {
    return respondWithError(res, error)
  }

  const { table: rawTable, limit: rawLimit } = parseQueryWithSchema(
    req,
    adminTableQuerySchema
  )
  const table = getAllowedAdminTable(rawTable)

  if (!table) {
    return respondWithError(
      res,
      new HttpError(400, 'Table not allowed', { code: 'table_not_allowed' })
    )
  }
  const config = getAdminTableConfigOrNull(table)

  try {
    if (req.method === 'GET') {
      const limit = parseAdminTableLimit(rawLimit)
      const rows = await getAdminRows(table, limit)
      return res.status(200).json({ rows })
    }

    const body = parseBodyWithSchema(req, adminTableBodySchema)

    if (req.method === 'POST') {
      if (Array.isArray(body.rows) && body.rows.length > 0) {
        const createdRows = await createAdminRows(
          table,
          body.rows.map((row) => requireAdminPayload(row, 'Missing row payload'))
        )
        return res.status(201).json({ rows: createdRows })
      }

      const row = requireAdminPayload(body.row, 'Missing row payload')
      const createdRow = await createAdminRow(table, row)
      return res.status(201).json({ row: createdRow })
    }

    if (req.method === 'PATCH') {
      const keys = requireAdminPayload(body.keys, 'Missing keys payload')
      const row = requireAdminPayload(body.row, 'Missing row payload')
      if (!config || !hasAllPrimaryKeys(config, keys)) {
        return respondWithError(
          res,
          new HttpError(400, 'Missing primary key fields in keys payload', {
            code: 'missing_primary_keys',
          })
        )
      }

      const updatedRow = await editAdminRow(table, keys, row)
      return res.status(200).json({ row: updatedRow })
    }

    const keys = requireAdminPayload(body.keys, 'Missing keys payload')
    if (!config || !hasAllPrimaryKeys(config, keys)) {
      return respondWithError(
        res,
        new HttpError(400, 'Missing primary key fields in keys payload', {
          code: 'missing_primary_keys',
        })
      )
    }

    const result = await removeAdminRow(table, keys)
    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof HttpError) {
      return respondWithError(res, error)
    }
    if (error instanceof Error && error.message === 'Database error') {
      logApiError('admin.table', error, { table, method: req.method, url: req.url })
      return respondWithError(
        res,
        new HttpError(500, 'Database error', { code: 'database_error' })
      )
    }
    if (error instanceof Error && error.message) {
      return respondWithError(
        res,
        new HttpError(500, error.message, { code: 'internal_error' })
      )
    }
    logApiError('admin.table', error, { table, method: req.method, url: req.url })
    return respondWithError(res, error)
  }
}
