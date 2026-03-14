export interface AdminTableConfig {
  label: string
  primaryKeys: string[]
  defaultRow?: Record<string, unknown>
}

export type AdminTablesMap = Record<string, AdminTableConfig>

export interface AdminSessionResponse {
  authenticated: boolean
  user: {
    id: string
    email: string
  } | null
}
