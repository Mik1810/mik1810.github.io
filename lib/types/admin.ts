import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

export interface AdminTableColumnConfig {
  dbName: string
  propertyKey: string
  column: AnyPgColumn
}

export type AdminPayloadKind = 'keys' | 'row'
export type AdminPayloadOperation = 'create' | 'update' | 'delete'

export interface AdminFieldRuleContext {
  column: AdminTableColumnConfig
  tableName: string
  payloadKind: AdminPayloadKind
  operation: AdminPayloadOperation
}

export interface AdminFieldRule {
  normalize?: (value: unknown, context: AdminFieldRuleContext) => unknown
  validate?: (value: unknown, context: AdminFieldRuleContext) => void
}

export interface AdminTableConfig {
  label: string
  table: AnyPgTable
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
  columns: AdminTableColumnConfig[]
  columnsByDbName: Record<string, AdminTableColumnConfig>
  fieldRules: Record<string, AdminFieldRule>
}

export type AdminTablesMap = Record<string, AdminTableConfig>

export interface AdminSessionResponse {
  authenticated: boolean
  user: {
    id: string
    email: string
  } | null
}
