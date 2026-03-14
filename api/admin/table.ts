import { supabaseAdmin } from '../../lib/supabaseAdmin.js'
import { requireAdminSession } from '../../lib/requireAdminSession.js'
import { getAdminTableConfig } from '../../lib/adminTables.js'
import type { AdminTableConfig } from '../../lib/types/admin.js'
import type { ApiHandler, ApiRequest } from '../../lib/types/http.js'

interface TableBody {
  row?: Record<string, unknown>
  keys?: Record<string, unknown>
}

const parseLimit = (rawValue: string | undefined) => {
  const parsed = Number.parseInt(rawValue || '', 10)
  if (!Number.isFinite(parsed)) return 200
  return Math.min(Math.max(parsed, 1), 1000)
}

const normalizePayload = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const hasAllPrimaryKeys = (
  config: AdminTableConfig,
  keys: Record<string, unknown>
) => config.primaryKeys.every((key) => keys[key] !== undefined && keys[key] !== null)

const applyPrimaryKeys = (query: any, keys: Record<string, unknown>) => {
  let current = query
  for (const [key, value] of Object.entries(keys)) {
    current = current.eq(key, value)
  }
  return current
}

const handler: ApiHandler<TableBody> = async (req, res) => {
  const admin = requireAdminSession(req, res)
  if (!admin) return

  const table = req.query?.table
  if (!table || typeof table !== 'string') {
    return res.status(400).json({ error: 'Missing table parameter' })
  }

  const config = getAdminTableConfig(table)
  if (!config) {
    return res.status(400).json({ error: 'Table not allowed' })
  }

  try {
    if (req.method === 'GET') {
      const limit = parseLimit(req.query?.limit)
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(limit)
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' })
      }
      return res.status(200).json({ rows: data || [] })
    }

    const body = (req as ApiRequest<TableBody>).body || {}

    if (req.method === 'POST') {
      const row = normalizePayload(body.row)
      const { data, error } = await supabaseAdmin
        .from(table)
        .insert(row)
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' })
      }
      return res.status(201).json({ row: data || null })
    }

    if (req.method === 'PATCH') {
      const keys = normalizePayload(body.keys)
      const row = normalizePayload(body.row)
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' })
      }

      let query = supabaseAdmin.from(table).update(row)
      query = applyPrimaryKeys(query, keys)
      const { data, error } = await query.select('*').limit(1).maybeSingle()
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' })
      }
      return res.status(200).json({ row: data || null })
    }

    if (req.method === 'DELETE') {
      const keys = normalizePayload(body.keys)
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' })
      }

      let query = supabaseAdmin.from(table).delete()
      query = applyPrimaryKeys(query, keys)
      const { error } = await query
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' })
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
