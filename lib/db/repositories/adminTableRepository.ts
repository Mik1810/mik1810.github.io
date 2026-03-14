import { sqlClient } from '../client.js'

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

const ensureIdentifier = (value: string) => {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`)
  }
  return value
}

const buildWhereClause = (keys: Record<string, unknown>) => {
  const entries = Object.entries(keys)
  if (entries.length === 0) {
    throw new Error('Missing keys payload')
  }

  const conditions = entries.map(([key, value]) => {
    const identifier = sqlClient(ensureIdentifier(key))
    return sqlClient`${identifier} = ${value as never}`
  })

  const [firstCondition, ...restConditions] = conditions
  return restConditions.reduce(
    (fragment, condition) => sqlClient`${fragment} and ${condition}`,
    firstCondition
  )
}

const ensureRowColumns = (row: Record<string, unknown>) => {
  const columns = Object.keys(row)
  if (columns.length === 0) {
    throw new Error('Missing row payload')
  }
  columns.forEach((column) => {
    ensureIdentifier(column)
  })
  return columns
}

const buildSetClause = (row: Record<string, unknown>) => {
  const columns = ensureRowColumns(row)
  return sqlClient(
    row as Record<string, never>,
    columns as unknown as string[]
  )
}

const runQuery = async <TRow = Record<string, unknown>>(
  query: Promise<TRow[]>
) => {
  try {
    return await query
  } catch {
    throw new Error('Database error')
  }
}

export const listAdminRows = async (table: string, limit: number) => {
  const rows = await runQuery(
    sqlClient`select * from ${sqlClient(ensureIdentifier(table))} limit ${limit}`
  )
  return rows
}

export const insertAdminRow = async (
  table: string,
  row: Record<string, unknown>
) => {
  const rows = await runQuery(
    sqlClient`insert into ${sqlClient(ensureIdentifier(table))} ${buildSetClause(row)} returning *`
  )

  return rows[0] || null
}

export const updateAdminRow = async (
  table: string,
  keys: Record<string, unknown>,
  row: Record<string, unknown>
) => {
  const rows = await runQuery(
    sqlClient`
      update ${sqlClient(ensureIdentifier(table))}
      set ${buildSetClause(row)}
      where ${buildWhereClause(keys)}
      returning *
    `
  )

  return rows[0] || null
}

export const deleteAdminRow = async (
  table: string,
  keys: Record<string, unknown>
) => {
  await runQuery(
    sqlClient`
      delete from ${sqlClient(ensureIdentifier(table))}
      where ${buildWhereClause(keys)}
    `
  )
}
