import { EXPERIENCE_ADMIN_TABLES } from './admin/tables/experienceTables.js'
import { PROFILE_ADMIN_TABLES } from './admin/tables/profileTables.js'
import { PROJECT_ADMIN_TABLES } from './admin/tables/projectTables.js'
import { SKILL_ADMIN_TABLES } from './admin/tables/skillTables.js'
import type { AdminTableConfig, AdminTablesMap } from './types/admin.js'

export const ADMIN_TABLES: AdminTablesMap = {
  ...PROFILE_ADMIN_TABLES,
  ...PROJECT_ADMIN_TABLES,
  ...EXPERIENCE_ADMIN_TABLES,
  ...SKILL_ADMIN_TABLES,
}

export function getAdminTableConfig(table: string): AdminTableConfig | null {
  return ADMIN_TABLES[table] || null
}
