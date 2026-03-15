import { HttpError, requireRecord } from '../http/apiUtils.js'
import { ADMIN_TABLE_GROUPS } from '../admin/groups.js'
import { ADMIN_TABLES, getAdminTableConfig } from '../adminTables.js'
import {
  deleteAdminRow,
  insertAdminRows,
  insertAdminRow,
  listAdminRows,
  updateAdminRow,
} from '../db/repositories/adminTableRepository.js'
import type {
  AdminPayloadKind,
  AdminPayloadOperation,
  AdminTableConfig,
} from '../types/admin.js'

const requireAdminTableConfig = (table: string) => {
  const config = getAdminTableConfig(table)
  if (!config) {
    throw new HttpError(400, 'Table not allowed')
  }
  return config
}

const ensureKnownAdminColumns = (
  config: AdminTableConfig,
  payload: Record<string, unknown>,
  payloadLabel: string
) => {
  const unknownColumns = Object.keys(payload).filter(
    (column) => !config.columnsByDbName[column]
  )

  if (unknownColumns.length > 0) {
    throw new HttpError(
      400,
      `Unknown columns in ${payloadLabel}: ${unknownColumns.join(', ')}`
    )
  }
}

const applyAdminFieldRules = (
  table: string,
  config: AdminTableConfig,
  payload: Record<string, unknown>,
  payloadKind: AdminPayloadKind,
  operation: AdminPayloadOperation
) =>
  Object.fromEntries(
    Object.entries(payload).map(([dbName, value]) => {
      const column = config.columnsByDbName[dbName]
      if (!column) {
        throw new HttpError(400, `Unknown column in ${payloadKind} payload: ${dbName}`)
      }

      const rule = config.fieldRules[dbName]
      const context = {
        column,
        tableName: table,
        payloadKind,
        operation,
      }

      const normalizedValue = rule?.normalize
        ? rule.normalize(value, context)
        : value

      rule?.validate?.(normalizedValue, context)

      return [dbName, normalizedValue]
    })
  )

const normalizeAdminKeysPayload = (
  table: string,
  config: AdminTableConfig,
  payload: Record<string, unknown>,
  operation: Extract<AdminPayloadOperation, 'update' | 'delete'>
) => {
  ensureKnownAdminColumns(config, payload, 'keys payload')

  const extraKeys = Object.keys(payload).filter(
    (column) => !config.primaryKeys.includes(column)
  )
  if (extraKeys.length > 0) {
    throw new HttpError(
      400,
      `Keys payload can only contain primary keys: ${extraKeys.join(', ')}`
    )
  }

  return applyAdminFieldRules(table, config, payload, 'keys', operation)
}

const normalizeAdminRowPayload = (
  table: string,
  config: AdminTableConfig,
  payload: Record<string, unknown>,
  operation: Extract<AdminPayloadOperation, 'create' | 'update'>
) => {
  ensureKnownAdminColumns(config, payload, 'row payload')

  const normalizedPayload = applyAdminFieldRules(
    table,
    config,
    payload,
    'row',
    operation
  )

  if (operation === 'update') {
    const mutableEntries = Object.entries(normalizedPayload).filter(
      ([column]) => !config.primaryKeys.includes(column)
    )

    if (mutableEntries.length === 0) {
      throw new HttpError(400, 'No mutable fields in row payload')
    }

    return Object.fromEntries(mutableEntries)
  }

  return normalizedPayload
}

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
  ADMIN_TABLE_GROUPS.flatMap((group) =>
    Object.entries(ADMIN_TABLES)
      .filter(([, config]) => config.group === group.key)
        .map(([name, config]) => ({
          name,
          label: config.label,
          description: config.description,
          group: config.group,
          groupLabel: group.label,
          subgroup: config.subgroup,
          subgroupLabel: config.subgroupLabel,
          primaryKeys: config.primaryKeys,
          defaultRow: config.defaultRow || {},
          fields: config.fields,
        }))
    )

export const getAdminTableConfigOrNull = (table: string) =>
  getAdminTableConfig(table)

export const getAdminRows = async (table: string, limit: number) =>
  listAdminRows(requireAdminTableConfig(table), limit)

export const createAdminRow = async (
  table: string,
  row: Record<string, unknown>
) => {
  const config = requireAdminTableConfig(table)
  return insertAdminRow(config, normalizeAdminRowPayload(table, config, row, 'create'))
}

export const createAdminRows = async (
  table: string,
  rows: Record<string, unknown>[]
) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new HttpError(400, 'Missing rows payload')
  }

  const config = requireAdminTableConfig(table)
  return insertAdminRows(
    config,
    rows.map((row) => normalizeAdminRowPayload(table, config, row, 'create'))
  )
}

export const editAdminRow = async (
  table: string,
  keys: Record<string, unknown>,
  row: Record<string, unknown>
) => {
  const config = requireAdminTableConfig(table)
  return updateAdminRow(
    config,
    normalizeAdminKeysPayload(table, config, keys, 'update'),
    normalizeAdminRowPayload(table, config, row, 'update')
  )
}

export const removeAdminRow = async (
  table: string,
  keys: Record<string, unknown>
) => {
  const config = requireAdminTableConfig(table)
  await deleteAdminRow(
    config,
    normalizeAdminKeysPayload(table, config, keys, 'delete')
  )
  return { ok: true }
}
