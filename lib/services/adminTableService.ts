import { HttpError, requireRecord } from '../http/apiUtils.js'
import { ADMIN_TABLES, getAdminTableConfig } from '../adminTables.js'
import {
  deleteAdminRow,
  insertAdminRow,
  listAdminRows,
  updateAdminRow,
} from '../db/repositories/adminTableRepository.js'
import type { AdminTableConfig } from '../types/admin.js'

export const parseAdminTableLimit = (rawValue: string | undefined) => {
  if (rawValue === undefined) return 200
  const parsed = Number.parseInt(rawValue || '', 10)
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, 'Invalid limit parameter')
  }
  return Math.min(Math.max(parsed, 1), 1000)
}

export const normalizeAdminPayload = (value: unknown): Record<string, unknown> =>
  (!value || typeof value !== 'object' || Array.isArray(value)
    ? {}
    : (value as Record<string, unknown>))

export const requireAdminPayload = (value: unknown, errorMessage: string) => {
  const record = requireRecord(value, errorMessage)
  if (Object.keys(record).length === 0) {
    throw new HttpError(400, errorMessage)
  }
  return record
}

export const hasAllPrimaryKeys = (
  config: AdminTableConfig,
  keys: Record<string, unknown>
) => config.primaryKeys.every((key) => keys[key] !== undefined && keys[key] !== null)

export const getAllowedAdminTable = (table: unknown) => {
  if (!table || typeof table !== 'string') return null
  return getAdminTableConfig(table) ? table : null
}

export const getAdminTablesList = () =>
  Object.entries(ADMIN_TABLES).map(([name, config]) => ({
    name,
    label: config.label,
    primaryKeys: config.primaryKeys,
    defaultRow: config.defaultRow || {},
  }))

export const getAdminTableConfigOrNull = (table: string) =>
  getAdminTableConfig(table)

export const getAdminRows = async (table: string, limit: number) =>
  listAdminRows(table, limit)

export const createAdminRow = async (
  table: string,
  row: Record<string, unknown>
) => insertAdminRow(table, row)

export const editAdminRow = async (
  table: string,
  keys: Record<string, unknown>,
  row: Record<string, unknown>
) => updateAdminRow(table, keys, row)

export const removeAdminRow = async (
  table: string,
  keys: Record<string, unknown>
) => {
  await deleteAdminRow(table, keys)
  return { ok: true }
}
