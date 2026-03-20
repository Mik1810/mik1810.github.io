import { randomUUID } from 'node:crypto'

import { and, eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'

import { getAdminTableConfig } from '../../lib/adminTables.ts'
import { db } from '../../lib/db/client.ts'
import {
  deleteAdminRow,
  insertAdminRow,
  insertAdminRows,
  listAdminRows,
  updateAdminRow,
} from '../../lib/db/repositories/adminTableRepository.ts'

type AdminRow = Record<string, unknown>

const cleanupStack: Array<{ table: string; keys: AdminRow }> = []

const requireConfig = (table: string) => {
  const config = getAdminTableConfig(table)
  if (!config) {
    throw new Error(`Unknown admin table config: ${table}`)
  }
  return config
}

const getPrimaryKeys = (table: string, row: AdminRow) => {
  const config = requireConfig(table)

  return Object.fromEntries(
    config.primaryKeys.map((key) => {
      if (row[key] === undefined) {
        throw new Error(`Missing primary key ${key} for table ${table}`)
      }
      return [key, row[key]]
    })
  )
}

const registerCleanup = (table: string, row: AdminRow) => {
  cleanupStack.push({
    table,
    keys: getPrimaryKeys(table, row),
  })
}

const directDeleteByKeys = async (table: string, keys: AdminRow) => {
  const config = requireConfig(table)
  const conditions = Object.entries(keys).map(([dbName, value]) =>
    eq(config.columnsByDbName[dbName]?.column as never, value as never)
  )

  if (conditions.length === 0) return

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
  await db.delete(config.table).where(whereClause as never)
}

const findRowByKeys = (table: string, rows: AdminRow[], row: AdminRow) => {
  const keys = getPrimaryKeys(table, row)
  return rows.find((candidate) =>
    Object.entries(keys).every(([key, value]) => candidate[key] === value)
  )
}

afterEach(async () => {
  while (cleanupStack.length > 0) {
    const item = cleanupStack.pop()
    if (!item) continue
    await directDeleteByKeys(item.table, item.keys)
  }
})

describe('adminTableRepository', () => {
  it('performs insert, list, update, and delete for social_links', async () => {
    const config = requireConfig('social_links')
    const token = randomUUID().slice(0, 8)
    const orderIndex = 800_000_000 + Math.floor(Math.random() * 100_000)

    const createdRow = await insertAdminRow(config, {
      profile_id: 1,
      order_index: orderIndex,
      name: `Repository social ${token}`,
      url: `https://example.com/repository-social/${token}`,
      icon_key: 'github',
    })

    expect(createdRow).toEqual(
      expect.objectContaining({
        profile_id: 1,
        order_index: orderIndex,
        name: `Repository social ${token}`,
        url: `https://example.com/repository-social/${token}`,
        icon_key: 'github',
      })
    )

    if (!createdRow) {
      throw new Error('Expected insertAdminRow to return a created row')
    }

    registerCleanup('social_links', createdRow)

    const rowsAfterCreate = await listAdminRows(config, 1000)
    expect(findRowByKeys('social_links', rowsAfterCreate, createdRow)).toEqual(
      expect.objectContaining({
        profile_id: 1,
        order_index: orderIndex,
        name: `Repository social ${token}`,
      })
    )

    const updatedRow = await updateAdminRow(
      config,
      {
        profile_id: 1,
        order_index: orderIndex,
      },
      {
        name: `Repository social updated ${token}`,
        url: `https://example.com/repository-social-updated/${token}`,
        icon_key: 'linkedin',
      }
    )

    expect(updatedRow).toEqual(
      expect.objectContaining({
        profile_id: 1,
        order_index: orderIndex,
        name: `Repository social updated ${token}`,
        url: `https://example.com/repository-social-updated/${token}`,
        icon_key: 'linkedin',
      })
    )

    const rowsAfterUpdate = await listAdminRows(config, 1000)
    expect(findRowByKeys('social_links', rowsAfterUpdate, createdRow)).toEqual(
      expect.objectContaining({
        name: `Repository social updated ${token}`,
        icon_key: 'linkedin',
      })
    )

    await deleteAdminRow(config, {
      profile_id: 1,
      order_index: orderIndex,
    })

    cleanupStack.pop()

    const rowsAfterDelete = await listAdminRows(config, 1000)
    expect(findRowByKeys('social_links', rowsAfterDelete, createdRow)).toBeUndefined()
  })

  it('supports bulk inserts and list mapping for hero_roles', async () => {
    const config = requireConfig('hero_roles')
    const baseOrderIndex = 810_000_000 + Math.floor(Math.random() * 100_000)

    const insertedRows = await insertAdminRows(config, [
      { order_index: baseOrderIndex },
      { order_index: baseOrderIndex + 1 },
    ])

    expect(insertedRows).toHaveLength(2)
    insertedRows.forEach((row) => registerCleanup('hero_roles', row))

    const listedRows = await listAdminRows(config, 1000)

    expect(findRowByKeys('hero_roles', listedRows, insertedRows[0])).toEqual(
      expect.objectContaining({
        order_index: baseOrderIndex,
      })
    )
    expect(findRowByKeys('hero_roles', listedRows, insertedRows[1])).toEqual(
      expect.objectContaining({
        order_index: baseOrderIndex + 1,
      })
    )
  })

  it('rejects unknown row columns before hitting the DB', async () => {
    const config = requireConfig('social_links')

    await expect(
      insertAdminRow(config, {
        profile_id: 1,
        order_index: 1,
        name: 'Invalid row',
        url: 'https://example.com/invalid-row',
        icon_key: 'github',
        unknown_column: true,
      })
    ).rejects.toThrow('Unknown column in row payload')
  })

  it('rejects unknown key columns in updates', async () => {
    const config = requireConfig('social_links')

    await expect(
      updateAdminRow(
        config,
        {
          definitely_not_a_real_key: 1,
        },
        {
          name: 'Invalid update',
        }
      )
    ).rejects.toThrow('Unknown column in keys payload')
  })

  it('rejects deletes without keys', async () => {
    const config = requireConfig('social_links')

    await expect(deleteAdminRow(config, {})).rejects.toThrow('Missing keys payload')
  })

  it('maps database constraint failures to a stable repository error', async () => {
    const config = requireConfig('social_links')
    const token = randomUUID().slice(0, 8)
    const orderIndex = 820_000_000 + Math.floor(Math.random() * 100_000)

    const createdRow = await insertAdminRow(config, {
      profile_id: 1,
      order_index: orderIndex,
      name: `Constraint base ${token}`,
      url: `https://example.com/constraint-base/${token}`,
      icon_key: 'github',
    })

    if (!createdRow) {
      throw new Error('Expected insertAdminRow to return a created row')
    }

    registerCleanup('social_links', createdRow)

    await expect(
      insertAdminRow(config, {
        profile_id: 1,
        order_index: orderIndex,
        name: `Constraint duplicate ${token}`,
        url: `https://example.com/constraint-duplicate/${token}`,
        icon_key: 'linkedin',
      })
    ).rejects.toThrow('Database error')
  })
})
