import { and, eq } from 'drizzle-orm'

import type { AdminTableConfig } from '../../types/admin.js'
import { db } from '../client.js'

const runQuery = async <TResult>(query: Promise<TResult>) => {
  try {
    return await query
  } catch {
    throw new Error('Database error')
  }
}

const toDbRow = (
  config: AdminTableConfig,
  row: Record<string, unknown>
): Record<string, unknown> =>
  Object.fromEntries(
    config.columns.map(({ dbName, propertyKey }) => [dbName, row[propertyKey]])
  )

const toPropertyPayload = (
  config: AdminTableConfig,
  row: Record<string, unknown>,
  errorMessage: string
) => {
  const payload: Record<string, unknown> = {}

  for (const [dbName, value] of Object.entries(row)) {
    const columnConfig = config.columnsByDbName[dbName]
    if (!columnConfig) {
      throw new Error(errorMessage)
    }
    payload[columnConfig.propertyKey] = value
  }

  return payload
}

const buildWhereClause = (
  config: AdminTableConfig,
  keys: Record<string, unknown>
) => {
  const conditions = Object.entries(keys).map(([dbName, value]) => {
    const columnConfig = config.columnsByDbName[dbName]
    if (!columnConfig) {
      throw new Error('Unknown column in keys payload')
    }
    return eq(columnConfig.column, value as never)
  })

  if (conditions.length === 0) {
    throw new Error('Missing keys payload')
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions)
}

export const listAdminRows = async (
  config: AdminTableConfig,
  limit: number
) => {
  const rows = (await runQuery(
    db.select().from(config.table).limit(limit)
  )) as Record<string, unknown>[]

  return rows.map((row) => toDbRow(config, row))
}

export const insertAdminRow = async (
  config: AdminTableConfig,
  row: Record<string, unknown>
) => {
  const rows = await insertAdminRows(config, [row])
  return rows[0] || null
}

export const insertAdminRows = async (
  config: AdminTableConfig,
  inputRows: Record<string, unknown>[]
) => {
  if (inputRows.length === 0) {
    return []
  }

  const propertyPayloads = inputRows.map((row) =>
    toPropertyPayload(config, row, 'Unknown column in row payload')
  )
  const rows = (await runQuery(
    db
      .insert(config.table)
      .values(propertyPayloads as never)
      .returning()
  )) as Record<string, unknown>[]

  return rows.map((resultRow) => toDbRow(config, resultRow))
}

export const updateAdminRow = async (
  config: AdminTableConfig,
  keys: Record<string, unknown>,
  row: Record<string, unknown>
) => {
  const propertyPayload = toPropertyPayload(
    config,
    row,
    'Unknown column in row payload'
  )
  const rows = (await runQuery(
    db
      .update(config.table)
      .set(propertyPayload as never)
      .where(buildWhereClause(config, keys))
      .returning()
  )) as Record<string, unknown>[]

  return rows[0] ? toDbRow(config, rows[0]) : null
}

export const deleteAdminRow = async (
  config: AdminTableConfig,
  keys: Record<string, unknown>
) => {
  await runQuery(
    db.delete(config.table).where(buildWhereClause(config, keys))
  )
}
