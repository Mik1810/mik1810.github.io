import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

export interface AdminTableColumnConfig {
  dbName: string
  propertyKey: string
  column: AnyPgColumn
}

export interface AdminTableConfig {
  label: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
  columns: AdminTableColumnConfig[]
  columnsByDbName: Record<string, AdminTableColumnConfig>
}

export type AdminTablesMap = Record<string, AdminTableConfig>

export interface AdminSessionResponse {
  authenticated: boolean
  user: {
    id: string
    email: string
  } | null
}
