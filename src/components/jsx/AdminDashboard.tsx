import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import type {
  SupportedLocale,
  AdminFieldDefinition,
  AdminFieldEditorOption,
  AdminCreateResponse,
  AdminOkResponse,
  AdminRowResponse,
  AdminRowsResponse,
  AdminTableDefinition,
  AdminTablesResponse,
} from '../../types/app.js'
import icons from '../../data/icons.js'
import AdminDashboardSkeleton from './AdminDashboardSkeleton'
import '../css/AdminAuth.css'

const PAGE_SIZE = 15
const EMPTY_PRIMARY_KEYS: string[] = []
const ADMIN_TABLE_SKELETON_ROWS = 6
const BILINGUAL_LOCALES: SupportedLocale[] = ['it', 'en']
const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'

const buildSubgroupStateKey = (groupKey: string, subgroupKey: string) =>
  `${groupKey}:${subgroupKey}`

const buildInitialExpandedGroups = (nextTables: AdminTableDefinition[]) => {
  const groups = Array.from(new Set(nextTables.map((table) => table.group)))
  return Object.fromEntries(groups.map((group) => [group, false])) as Record<
    string,
    boolean
  >
}

const buildInitialExpandedSubgroups = (nextTables: AdminTableDefinition[]) => {
  const subgroupKeys = Array.from(
    new Set(
      nextTables.map((table) => buildSubgroupStateKey(table.group, table.subgroup))
    )
  )

  return Object.fromEntries(subgroupKeys.map((key) => [key, false])) as Record<
    string,
    boolean
  >
}

const prettyValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const toInputValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value : String(value)
}

const buildKeys = (row: Record<string, unknown> | null, primaryKeys: string[]) => {
  const keys: Record<string, unknown> = {}
  for (const key of primaryKeys || []) {
    keys[key] = row?.[key]
  }
  return keys
}

const isForeignKeyColumn = (column: string) => column.toLowerCase().endsWith('_id')

const isSystemColumn = (column: string) => {
  const normalized = column.toLowerCase()
  return normalized === 'created_at' || normalized === 'updated_at'
}

const isLikelyUrlField = (fieldName: string) => {
  const normalized = fieldName.toLowerCase()
  return (
    normalized === 'url' ||
    normalized.endsWith('_url') ||
    normalized.endsWith('url')
  )
}

const isValidUrlLike = (value: unknown) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true
  try {
    const parsed = new URL(trimmed)
    return Boolean(parsed.protocol && parsed.host)
  } catch {
    return false
  }
}

const getUrlPreviewType = (
  fieldName: string,
  value: unknown
): 'image' | 'pdf' | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase().split('#')[0]?.split('?')[0] || ''
  if (normalized.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(normalized)) return 'image'

  const loweredField = fieldName.toLowerCase()
  if (
    loweredField.includes('image') ||
    loweredField.includes('photo') ||
    loweredField === 'logo' ||
    loweredField.endsWith('_logo')
  ) {
    return 'image'
  }

  return null
}

const isHexColorValue = (value: unknown) =>
  typeof value === 'string' &&
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())

const isIconField = (fieldName: string) =>
  fieldName === 'icon_key' || fieldName.endsWith('_icon_key')

const isDeviconField = (fieldName: string) =>
  fieldName === 'devicon' || fieldName.endsWith('_devicon')

const getColumnLayoutClass = (
  column: string,
  field: AdminFieldDefinition | undefined
) => {
  const normalized = column.toLowerCase()

  if (field?.primaryKey || field?.foreignKey) {
    return 'admin-col-key'
  }

  if (
    field?.editor.kind === 'color' ||
    normalized.includes('color')
  ) {
    return 'admin-col-swatch'
  }

  if (normalized === 'order_index') {
    return 'admin-col-order'
  }

  if (isIconField(normalized) || isDeviconField(normalized)) {
    return 'admin-col-icon'
  }

  if (
    normalized === 'url' ||
    normalized === 'live_url' ||
    normalized === 'github_url' ||
    normalized === 'cv_url' ||
    normalized.endsWith('_url') ||
    normalized === 'logo'
  ) {
    return 'admin-col-media'
  }

  if (normalized === 'email') {
    return 'admin-col-email'
  }

  if (
    normalized.includes('description') ||
    normalized.includes('bio')
  ) {
    return 'admin-col-copy'
  }

  if (
    normalized.includes('title') ||
    normalized.includes('name') ||
    normalized.includes('label') ||
    normalized === 'slug'
  ) {
    return 'admin-col-title'
  }

  return 'admin-col-data'
}

const getColumnHeaderAlignmentClass = (
  column: string,
  field: AdminFieldDefinition | undefined
) => {
  const layoutClass = getColumnLayoutClass(column, field)

  if (
    layoutClass === 'admin-col-media' ||
    layoutClass === 'admin-col-icon' ||
    layoutClass === 'admin-col-swatch'
  ) {
    return 'admin-column-header-center'
  }

  return 'admin-column-header-left'
}

const getColumnCellAlignmentClass = (
  column: string,
  field: AdminFieldDefinition | undefined
) => {
  const layoutClass = getColumnLayoutClass(column, field)

  if (
    layoutClass === 'admin-col-media' ||
    layoutClass === 'admin-col-icon' ||
    layoutClass === 'admin-col-swatch' ||
    layoutClass === 'admin-col-order'
  ) {
    return 'admin-column-cell-center'
  }

  return 'admin-column-cell-left'
}

const getSubgroupRootTable = (subgroup: {
  key: string
  tables: AdminTableDefinition[]
}) =>
  subgroup.tables.find((table) => table.name === subgroup.key) ||
  subgroup.tables.find((table) => !table.fields.some((field) => field.foreignKey)) ||
  subgroup.tables[0]

const isArrowToggleClick = (event: ReactMouseEvent<HTMLButtonElement>) =>
  event.target instanceof Element &&
  Boolean(event.target.closest('[data-admin-toggle-arrow="true"]'))

const getDeviconPreviewUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed
  }
  const normalized = trimmed.replace(/\.svg$/i, '').replace(/^\/+/, '')
  return `${DEVICON_BASE}/${normalized}.svg`
}

const buildRelationOptionLabel = (
  row: Record<string, unknown>,
  valueColumn: string,
  labelColumns: string[]
) => {
  const valueText = prettyValue(row[valueColumn])
  const labelParts = labelColumns
    .map((column) => prettyValue(row[column]).trim())
    .filter(Boolean)

  if (labelParts.length === 0) {
    return valueText
  }

  if (!labelColumns.includes(valueColumn) && valueText) {
    return `${labelParts.join(' · ')} · #${valueText}`
  }

  return labelParts.join(' · ')
}

const PdfPreviewIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
    <path
      d="M7 3H14L19 8V20C19 20.5523 18.5523 21 18 21H7C6.44772 21 6 20.5523 6 20V4C6 3.44772 6.44772 3 7 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14 3V8H19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 14H15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M9 17H13.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

const LinkPreviewIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
    <path
      d="M10 14L14 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M7.5 13.5L5.8 15.2C4.4 16.6 4.4 18.8 5.8 20.2C7.2 21.6 9.4 21.6 10.8 20.2L12.5 18.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 10.5L18.2 8.8C19.6 7.4 19.6 5.2 18.2 3.8C16.8 2.4 14.6 2.4 13.2 3.8L11.5 5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function AdminDashboard() {
  const [tables, setTables] = useState<AdminTableDefinition[]>([])
  const [loadingTables, setLoadingTables] = useState(true)
  const [activeTableName, setActiveTableName] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [draftRow, setDraftRow] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [expandedSubgroups, setExpandedSubgroups] = useState<Record<string, boolean>>({})
  const [localeDraftRows, setLocaleDraftRows] = useState<
    Record<SupportedLocale, Record<string, unknown>>
  >({
    it: {},
    en: {},
  })
  const [relationOptionsByTable, setRelationOptionsByTable] = useState<
    Record<string, AdminFieldEditorOption[]>
  >({})
  const [loadingRelationTables, setLoadingRelationTables] = useState<
    Record<string, boolean>
  >({})

  const activeTable = useMemo(
    () => tables.find((item) => item.name === activeTableName) || null,
    [tables, activeTableName]
  )

  const primaryKeys = useMemo(
    () => activeTable?.primaryKeys || EMPTY_PRIMARY_KEYS,
    [activeTable]
  )
  const fieldDefinitions = useMemo(
    () => activeTable?.fields || [],
    [activeTable]
  )
  const fieldsByName = useMemo(
    () =>
      Object.fromEntries(fieldDefinitions.map((field) => [field.name, field])) as Record<
        string,
        AdminFieldDefinition
      >,
    [fieldDefinitions]
  )
  const selectedRow = selectedIndex >= 0 ? rows[selectedIndex] : null
  const localeField = useMemo(
    () => fieldDefinitions.find((field) => field.name === 'locale') || null,
    [fieldDefinitions]
  )
  const isLocaleTranslationTable = Boolean(localeField) && primaryKeys.includes('locale')
  const groupedTables = useMemo(() => {
    const groupMap = new Map<
      string,
      {
        key: string
        label: string
        subgroups: Array<{
          key: string
          label: string
          tables: AdminTableDefinition[]
        }>
      }
    >()

    for (const table of tables) {
      if (!groupMap.has(table.group)) {
        groupMap.set(table.group, {
          key: table.group,
          label: table.groupLabel,
          subgroups: [],
        })
      }
      const group = groupMap.get(table.group)
      if (!group) continue

      let subgroup = group.subgroups.find((item) => item.key === table.subgroup)
      if (!subgroup) {
        subgroup = {
          key: table.subgroup,
          label: table.subgroupLabel,
          tables: [],
        }
        group.subgroups.push(subgroup)
      }

      subgroup.tables.push(table)
    }

    return Array.from(groupMap.values()).map((group) => ({
      ...group,
      subgroups: [...group.subgroups].sort((left, right) => {
        const leftChildCount =
          left.tables.filter((table) => table.name !== getSubgroupRootTable(left)?.name)
            .length
        const rightChildCount =
          right.tables.filter((table) => table.name !== getSubgroupRootTable(right)?.name)
            .length

        if (leftChildCount === 0 && rightChildCount > 0) return 1
        if (leftChildCount > 0 && rightChildCount === 0) return -1
        return 0
      }),
    }))
  }, [tables])
  const tableLabelsByName = useMemo(
    () =>
      Object.fromEntries(tables.map((table) => [table.name, table.label])) as Record<
        string,
        string
      >,
    [tables]
  )

  const loadRows = useCallback(
    async (tableName: string) => {
      if (!tableName) return
      setLoadingRows(true)
      setError('')
      setRows([])
      setSelectedIndex(-1)
      setDraftRow(activeTable?.defaultRow || {})
      try {
        const response = await fetch(
          `/api/admin/table?table=${encodeURIComponent(tableName)}&limit=500`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )
        const data = (await response.json()) as AdminRowsResponse
        if (!response.ok) {
          setRows([])
          setSelectedIndex(-1)
          setDraftRow({})
          setError(data?.error || 'Errore nel caricamento delle righe')
          return
        }
        const nextRows = Array.isArray(data?.rows) ? data.rows : []
        setRows(nextRows)
        setPage(1)
        if (nextRows.length > 0) {
          setSelectedIndex(0)
          setDraftRow(nextRows[0])
        } else {
          setSelectedIndex(-1)
          setDraftRow(activeTable?.defaultRow || {})
        }
      } catch {
        setRows([])
        setSelectedIndex(-1)
        setDraftRow({})
        setPage(1)
        setError('Errore di rete durante il caricamento')
      } finally {
        setLoadingRows(false)
      }
    },
    [activeTable]
  )

  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true)
      setError('')
      try {
        const response = await fetch('/api/admin/tables', {
          method: 'GET',
          credentials: 'include',
        })
        const data = (await response.json()) as AdminTablesResponse
        if (!response.ok) {
          setError(data?.error || 'Impossibile caricare la lista tabelle')
          setTables([])
          return
        }
        const nextTables = Array.isArray(data?.tables) ? data.tables : []
        setTables(nextTables)
        setExpandedGroups(buildInitialExpandedGroups(nextTables))
        setExpandedSubgroups(buildInitialExpandedSubgroups(nextTables))
        if (nextTables.length > 0) {
          setActiveTableName(nextTables[0].name)
        }
      } catch {
        setError('Errore di rete durante il caricamento tabelle')
      } finally {
        setLoadingTables(false)
      }
    }

    void loadTables()
  }, [])

  useEffect(() => {
    if (!activeTableName) return
    void loadRows(activeTableName)
  }, [activeTableName, loadRows])

  useEffect(() => {
    setSearchQuery('')
    setShowDeleteConfirm(false)
    setEditorOpen(false)
    setLocaleDraftRows({ it: {}, en: {} })
  }, [activeTableName])

  useEffect(() => {
    const relationConfigs = fieldDefinitions
      .map((field) => field.editor.relation)
      .filter((relation): relation is NonNullable<AdminFieldDefinition['editor']['relation']> =>
        Boolean(relation)
      )
      .filter(
        (relation, index, items) =>
          items.findIndex((item) => item.table === relation.table) === index
      )

    if (relationConfigs.length === 0) return

    let cancelled = false

    setLoadingRelationTables((prev) => ({
      ...prev,
      ...Object.fromEntries(relationConfigs.map((relation) => [relation.table, true])),
    }))

    void Promise.all(
      relationConfigs.map(async (relation) => {
        try {
          const response = await fetch(
            `/api/admin/table?table=${encodeURIComponent(relation.table)}&limit=500`,
            {
              method: 'GET',
              credentials: 'include',
            }
          )
          const data = (await response.json()) as AdminRowsResponse
          if (!response.ok) {
            return [relation.table, []] as const
          }

          const valueColumn = relation.valueColumn || 'id'
          const options = (Array.isArray(data?.rows) ? data.rows : [])
            .map((row) => {
              const optionValue = prettyValue(row[valueColumn]).trim()
              if (!optionValue) return null
              return {
                value: optionValue,
                label: buildRelationOptionLabel(
                  row,
                  valueColumn,
                  relation.labelColumns
                ),
              }
            })
            .filter(Boolean) as AdminFieldEditorOption[]

          return [relation.table, options] as const
        } catch {
          return [relation.table, []] as const
        }
      })
    ).then((results) => {
      if (cancelled) return

      setRelationOptionsByTable((prev) => ({
        ...prev,
        ...Object.fromEntries(results),
      }))
      setLoadingRelationTables((prev) => ({
        ...prev,
        ...Object.fromEntries(results.map(([table]) => [table, false])),
      }))
    })

    return () => {
      cancelled = true
    }
  }, [fieldDefinitions])

  const handleSelectRow = (index: number) => {
    const nextRow = rows[index]
    setSelectedIndex(index)
    setDraftRow(nextRow || {})
    setError('')
    setEditorOpen(true)
  }

  const handleAskDeleteRow = (index: number) => {
    const nextRow = rows[index]
    setSelectedIndex(index)
    setDraftRow(nextRow || {})
    setShowDeleteConfirm(true)
    setError('')
  }

  const handleFieldChange = (key: string, value: unknown) => {
    setDraftRow((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLocaleDraftFieldChange = (
    locale: SupportedLocale,
    key: string,
    value: unknown
  ) => {
    setLocaleDraftRows((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: value,
      },
    }))
  }

  const handleGroupClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    group: {
      key: string
      subgroups: Array<{
        key: string
        tables: AdminTableDefinition[]
      }>
    }
  ) => {
    if (isArrowToggleClick(event)) {
      setExpandedGroups((prev) => ({
        ...prev,
        [group.key]: !prev[group.key],
      }))
      return
    }

    setExpandedGroups((prev) => ({
      ...prev,
      [group.key]: true,
    }))
  }

  const openSubgroupRoot = (
    groupKey: string,
    subgroupKey: string,
    rootTableName: string
  ) => {
    const stateKey = buildSubgroupStateKey(groupKey, subgroupKey)
    setActiveTableName(rootTableName)
    setExpandedSubgroups((prev) => ({
      ...prev,
      [stateKey]: true,
    }))
  }

  const handleSubgroupClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    groupKey: string,
    subgroupKey: string,
    rootTableName: string
  ) => {
    if (isArrowToggleClick(event)) {
      const stateKey = buildSubgroupStateKey(groupKey, subgroupKey)
      setExpandedSubgroups((prev) => ({
        ...prev,
        [stateKey]: !prev[stateKey],
      }))
      return
    }

    openSubgroupRoot(groupKey, subgroupKey, rootTableName)
  }

  const handleCreateNew = () => {
    const sourceRow = selectedRow || rows[0] || {}
    const inheritedForeignKeys = Object.fromEntries(
      Object.entries(sourceRow).filter(([key]) => isForeignKeyColumn(key))
    )
    const nextDraftRow = {
      ...inheritedForeignKeys,
      ...(activeTable?.defaultRow || {}),
    }

    setSelectedIndex(-1)
    setDraftRow(nextDraftRow)
    if (isLocaleTranslationTable) {
      const localeFieldNames = fieldDefinitions
        .filter(
          (field) =>
            field.editable &&
            !field.system &&
            !field.primaryKey &&
            !field.foreignKey &&
            !field.editor.relation
        )
        .map((field) => field.name)

      const buildLocaleDraft = () =>
        Object.fromEntries(
          localeFieldNames.map((fieldName) => [
            fieldName,
            sourceRow?.[fieldName] ?? activeTable?.defaultRow?.[fieldName] ?? '',
          ])
        )

      setLocaleDraftRows({
        it: buildLocaleDraft(),
        en: buildLocaleDraft(),
      })
    } else {
      setLocaleDraftRows({ it: {}, en: {} })
    }
    setShowDeleteConfirm(false)
    setError('')
    setEditorOpen(true)
  }

  const runAction = async (action: string, fn: () => Promise<void>) => {
    setBusyAction(action)
    setError('')
    try {
      await fn()
      await loadRows(activeTableName)
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : 'Operazione fallita'
      setError(message)
    } finally {
      setBusyAction('')
    }
  }

  const validateDraftRow = () => {
    for (const [key, value] of Object.entries(draftRow || {})) {
      if (!isLikelyUrlField(key)) continue
      if (value === null || value === undefined || value === '') continue
      if (!isValidUrlLike(value)) {
        throw new Error(`Campo URL non valido: ${key}`)
      }
    }
  }

  const validateLocaleDraftRows = () => {
    for (const locale of BILINGUAL_LOCALES) {
      for (const [key, value] of Object.entries(localeDraftRows[locale] || {})) {
        if (!isLikelyUrlField(key)) continue
        if (value === null || value === undefined || value === '') continue
        if (!isValidUrlLike(value)) {
          throw new Error(`Campo URL non valido (${locale}): ${key}`)
        }
      }
    }
  }

  const handleInsert = () =>
    runAction('insert', async () => {
      validateDraftRow()
      if (isLocaleTranslationTable) {
        validateLocaleDraftRows()

        const sharedRow = Object.fromEntries(
          Object.entries(draftRow).filter(([key]) => key !== 'locale')
        )
        const rowsPayload = BILINGUAL_LOCALES.map((locale) => ({
          ...sharedRow,
          locale,
          ...(localeDraftRows[locale] || {}),
        }))

        const response = await fetch(
          `/api/admin/table?table=${encodeURIComponent(activeTableName)}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: rowsPayload }),
          }
        )
        const data = (await response.json()) as AdminCreateResponse
        if (!response.ok) throw new Error(data?.error || 'Insert bilingue fallita')
        setEditorOpen(false)
        return
      }

      const response = await fetch(
        `/api/admin/table?table=${encodeURIComponent(activeTableName)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row: draftRow }),
        }
      )
      const data = (await response.json()) as AdminCreateResponse
      if (!response.ok) throw new Error(data?.error || 'Insert fallita')
      setEditorOpen(false)
    })

  const handleUpdate = () =>
    runAction('update', async () => {
      if (!selectedRow) throw new Error('Seleziona una riga da aggiornare')
      validateDraftRow()
      const response = await fetch(
        `/api/admin/table?table=${encodeURIComponent(activeTableName)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keys: buildKeys(selectedRow, primaryKeys),
            row: draftRow,
          }),
        }
      )
      const data = (await response.json()) as AdminRowResponse
      if (!response.ok) throw new Error(data?.error || 'Update fallito')
      setEditorOpen(false)
    })

  const performDelete = () =>
    runAction('delete', async () => {
      if (!selectedRow) throw new Error('Seleziona una riga da cancellare')
      const response = await fetch(
        `/api/admin/table?table=${encodeURIComponent(activeTableName)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keys: buildKeys(selectedRow, primaryKeys),
          }),
        }
      )
      const data = (await response.json()) as AdminOkResponse
      if (!response.ok) throw new Error(data?.error || 'Delete fallita')
      setShowDeleteConfirm(false)
      setEditorOpen(false)
    })

  const columns = useMemo(() => {
    const columnSet = new Set<string>(fieldDefinitions.map((field) => field.name))
    for (const row of rows) {
      Object.keys(row || {}).forEach((key) => columnSet.add(key))
    }
    Object.keys(draftRow || {}).forEach((key) => columnSet.add(key))
    return Array.from(columnSet)
  }, [fieldDefinitions, rows, draftRow])

  const hiddenColumns = useMemo(() => {
    return new Set(
      columns.filter((column) => {
        const field = fieldsByName[column]
        if (field) {
          return field.primaryKey || field.foreignKey || field.system || !field.editable
        }
        return (
          primaryKeys.includes(column) ||
          isForeignKeyColumn(column) ||
          isSystemColumn(column)
        )
      })
    )
  }, [columns, fieldsByName, primaryKeys])

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.has(column)),
    [columns, hiddenColumns]
  )
  const showRowIndex = useMemo(
    () => !visibleColumns.includes('id'),
    [visibleColumns]
  )

  const editorFields = useMemo(
    () => fieldDefinitions.filter((field) => field.editable && !field.system),
    [fieldDefinitions]
  )
  const referenceEditorFields = useMemo(
    () =>
      editorFields.filter(
        (field) =>
          (field.primaryKey || field.foreignKey || Boolean(field.editor.relation)) &&
          !(isLocaleTranslationTable && field.name === 'locale' && selectedIndex < 0)
      ),
    [editorFields, isLocaleTranslationTable, selectedIndex]
  )
  const contentEditorFields = useMemo(
    () =>
      editorFields.filter(
        (field) =>
          !field.primaryKey &&
          !field.foreignKey &&
          !field.editor.relation &&
          !(isLocaleTranslationTable && field.name === 'locale')
      ),
    [editorFields, isLocaleTranslationTable]
  )

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      visibleColumns.some((column) =>
        prettyValue(row?.[column]).toLowerCase().includes(query)
      )
    )
  }, [rows, visibleColumns, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage)
  }, [currentPage, page])

  const hasSelection = Boolean(selectedRow)

  const handleEditorFieldChange = (field: AdminFieldDefinition, rawValue: string | boolean) => {
    if (field.editor.kind === 'checkbox') {
      handleFieldChange(field.name, Boolean(rawValue))
      return
    }

    if (field.editor.kind === 'number') {
      const nextValue =
        typeof rawValue === 'string' && rawValue.trim() === ''
          ? ''
          : Number(rawValue)
      handleFieldChange(field.name, nextValue)
      return
    }

    handleFieldChange(field.name, rawValue)
  }

  const renderEditorField = (field: AdminFieldDefinition) => {
    const value = draftRow?.[field.name]
    const isReadOnlyField = selectedIndex >= 0 && field.primaryKey

    if (field.editor.kind === 'textarea') {
      return (
        <textarea
          className="admin-input admin-textarea"
          value={toInputValue(value)}
          onChange={(event) =>
            handleEditorFieldChange(field, event.target.value)
          }
          disabled={busyAction !== '' || isReadOnlyField}
          rows={field.editor.rows || 4}
        />
      )
    }

    if (field.editor.kind === 'select') {
      const relationOptions = field.editor.relation
        ? relationOptionsByTable[field.editor.relation.table] || []
        : field.editor.options || []
      const currentValue = toInputValue(value)
      const isLoadingRelationOptions = field.editor.relation
        ? loadingRelationTables[field.editor.relation.table] === true
        : false
      const hasCurrentValue =
        currentValue.length > 0 &&
        relationOptions.some((option) => option.value === currentValue)
      const options = hasCurrentValue
        ? relationOptions
        : currentValue.length > 0
          ? [
              {
                value: currentValue,
                label: `#${currentValue}`,
              },
              ...relationOptions,
            ]
          : relationOptions
      return (
        <select
          className="admin-input admin-select"
          value={currentValue}
          onChange={(event) =>
            handleEditorFieldChange(field, event.target.value)
          }
          disabled={
            busyAction !== '' ||
            isReadOnlyField ||
            (isLoadingRelationOptions && options.length === 0)
          }
        >
          <option value="">
            {isLoadingRelationOptions
              ? 'Caricamento opzioni...'
              : field.editor.relation?.emptyLabel ||
                `Seleziona ${tableLabelsByName[field.editor.relation?.table || ''] || '...'}`}
          </option>
          {options.map((option) => (
            <option key={`${field.name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.editor.kind === 'checkbox') {
      return (
        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(event) =>
              handleEditorFieldChange(field, event.target.checked)
            }
            disabled={busyAction !== '' || isReadOnlyField}
          />
          <span>{value === true ? 'True' : 'False'}</span>
        </label>
      )
    }

    if (field.editor.kind === 'color') {
      const rawValue = toInputValue(value)
      const pickerValue = isHexColorValue(rawValue) ? rawValue : '#999999'

      return (
        <div className="admin-color-field">
          <input
            className="admin-color-picker"
            type="color"
            value={pickerValue}
            onChange={(event) =>
              handleEditorFieldChange(field, event.target.value)
            }
            disabled={busyAction !== '' || isReadOnlyField}
          />
          <input
            className="admin-input"
            type="text"
            value={rawValue}
            onChange={(event) =>
              handleEditorFieldChange(field, event.target.value)
            }
            disabled={busyAction !== '' || isReadOnlyField}
            placeholder="#RRGGBB"
          />
        </div>
      )
    }

    if (field.editor.kind === 'url') {
      const rawValue = toInputValue(value)
      const previewType = getUrlPreviewType(field.name, rawValue)

      return (
        <div className="admin-url-field">
          <input
            className="admin-input"
            type="url"
            value={rawValue}
            onChange={(event) =>
              handleEditorFieldChange(field, event.target.value)
            }
            disabled={busyAction !== '' || isReadOnlyField}
          />
          {previewType === 'image' && rawValue && (
            <a
              className="admin-url-preview admin-url-preview-image"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Anteprima immagine ${field.label}`}
            >
              <img src={rawValue} alt="" loading="lazy" />
            </a>
          )}
          {previewType === 'pdf' && rawValue && (
            <a
              className="admin-url-preview admin-url-preview-pdf"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri PDF ${field.label}`}
            >
              <PdfPreviewIcon />
            </a>
          )}
        </div>
      )
    }

    if (isDeviconField(field.name)) {
      const rawValue = toInputValue(value)
      const previewUrl = rawValue ? getDeviconPreviewUrl(rawValue) : ''

      return (
        <div className="admin-icon-field">
          <input
            className="admin-input"
            type="text"
            value={rawValue}
            onChange={(event) =>
              handleEditorFieldChange(field, event.target.value)
            }
            disabled={busyAction !== '' || isReadOnlyField}
          />
          {previewUrl && (
            <span
              className="admin-icon-preview admin-icon-preview-devicon"
              aria-hidden="true"
              title={rawValue}
            >
              <img src={previewUrl} alt="" loading="lazy" />
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        className="admin-input"
        type={field.editor.kind}
        value={toInputValue(value)}
        onChange={(event) =>
          handleEditorFieldChange(field, event.target.value)
        }
        disabled={busyAction !== '' || isReadOnlyField}
      />
    )
  }

  const renderLocaleEditorField = (
    field: AdminFieldDefinition,
    locale: SupportedLocale
  ) => {
    const value = localeDraftRows[locale]?.[field.name]

    if (field.editor.kind === 'textarea') {
      return (
        <textarea
          className="admin-input admin-textarea"
          value={toInputValue(value)}
          onChange={(event) =>
            handleLocaleDraftFieldChange(locale, field.name, event.target.value)
          }
          disabled={busyAction !== ''}
          rows={field.editor.rows || 4}
        />
      )
    }

    if (field.editor.kind === 'url') {
      const rawValue = toInputValue(value)
      const previewType = getUrlPreviewType(field.name, rawValue)

      return (
        <div className="admin-url-field">
          <input
            className="admin-input"
            type="url"
            value={rawValue}
            onChange={(event) =>
              handleLocaleDraftFieldChange(locale, field.name, event.target.value)
            }
            disabled={busyAction !== ''}
          />
          {previewType === 'image' && rawValue && (
            <a
              className="admin-url-preview admin-url-preview-image"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Anteprima immagine ${field.label} ${locale}`}
            >
              <img src={rawValue} alt="" loading="lazy" />
            </a>
          )}
          {previewType === 'pdf' && rawValue && (
            <a
              className="admin-url-preview admin-url-preview-pdf"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri PDF ${field.label} ${locale}`}
            >
              <PdfPreviewIcon />
            </a>
          )}
        </div>
      )
    }

    return (
      <input
        className="admin-input"
        type={field.editor.kind}
        value={toInputValue(value)}
        onChange={(event) =>
          handleLocaleDraftFieldChange(locale, field.name, event.target.value)
        }
        disabled={busyAction !== ''}
      />
    )
  }

  const renderCellValue = (column: string, value: unknown) => {
    const field = fieldsByName[column]

    if (field?.editor.kind === 'color') {
      const rawValue = prettyValue(value)
      const isValidColor = isHexColorValue(rawValue)

      if (!isValidColor) return rawValue

      return (
        <span
          className="admin-color-cell admin-color-cell-compact"
          title={rawValue}
        >
          <span
            className="admin-color-swatch admin-color-swatch-large"
            style={{ backgroundColor: rawValue }}
            aria-hidden="true"
          />
        </span>
      )
    }

    if (field && field.editor.kind === 'url') {
      const rawValue = prettyValue(value).trim()
      const previewType = getUrlPreviewType(field.name, rawValue)

      if (previewType === 'image') {
        return (
          <span className="admin-url-cell admin-url-cell-compact">
            <a
              className="admin-url-preview admin-url-preview-image"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Anteprima immagine ${field.label}`}
              title={rawValue}
            >
              <img src={rawValue} alt="" loading="lazy" />
            </a>
          </span>
        )
      }

      if (previewType === 'pdf') {
        return (
          <span className="admin-url-cell admin-url-cell-compact">
            <a
              className="admin-url-preview admin-url-preview-pdf"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri PDF ${field.label}`}
              title={rawValue}
            >
              <PdfPreviewIcon />
            </a>
          </span>
        )
      }

      if (rawValue && field.name === 'github_url') {
        return (
          <span className="admin-url-cell admin-url-cell-compact">
            <a
              className="admin-url-preview admin-url-preview-icon"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri link GitHub ${field.label}`}
              title={rawValue}
            >
              {icons.github(15)}
            </a>
          </span>
        )
      }

      if (rawValue && isValidUrlLike(rawValue)) {
        return (
          <span className="admin-url-cell admin-url-cell-compact">
            <a
              className="admin-url-preview admin-url-preview-icon"
              href={rawValue}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apri link ${field.label}`}
              title={rawValue}
            >
              <LinkPreviewIcon />
            </a>
          </span>
        )
      }
    }

    if (field && isIconField(field.name)) {
      const rawValue = prettyValue(value).trim()
      const iconRenderer = rawValue ? icons[rawValue.toLowerCase()] : undefined

      if (!iconRenderer) {
        return rawValue
      }

      return (
        <span className="admin-icon-cell admin-icon-cell-compact">
          <span
            className="admin-icon-preview admin-icon-preview-large"
            aria-hidden="true"
            title={rawValue}
          >
            {iconRenderer(16)}
          </span>
        </span>
      )
    }

    if (field && isDeviconField(field.name)) {
      const rawValue = prettyValue(value).trim()
      const previewUrl = rawValue ? getDeviconPreviewUrl(rawValue) : ''

      return (
        <span className="admin-icon-cell admin-icon-cell-compact">
          <span
            className={`admin-icon-preview admin-icon-preview-devicon admin-icon-preview-large ${previewUrl ? '' : 'is-empty'}`.trim()}
            aria-hidden="true"
            title={rawValue || 'Devicon non disponibile'}
          >
            {previewUrl ? <img src={previewUrl} alt="" loading="lazy" /> : null}
          </span>
        </span>
      )
    }

    return prettyValue(value)
  }

  if (loadingTables && tables.length === 0) {
    return <AdminDashboardSkeleton />
  }

  return (
    <main className="admin-page">
      <section className="admin-card admin-card-wide">
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h4>Tabelle</h4>
            {!loadingTables && tables.length === 0 && (
              <p>Nessuna tabella disponibile</p>
            )}
            <div className="admin-table-groups">
              {groupedTables.map((group) => {
                const isExpanded = expandedGroups[group.key] ?? false
                const groupTableCount = group.subgroups.reduce(
                  (total, subgroup) => total + subgroup.tables.length,
                  0
                )
                return (
                  <section key={group.key} className="admin-table-group">
                    <button
                      type="button"
                      className={`admin-group-toggle ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={(event) => handleGroupClick(event, group)}
                    >
                      <span className="admin-group-toggle-main">
                        <span className="admin-group-label">{group.label}</span>
                        <span className="admin-group-count">{groupTableCount}</span>
                      </span>
                      <span
                        className="admin-group-arrow"
                        aria-hidden="true"
                        data-admin-toggle-arrow="true"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 6L15 12L9 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="admin-subgroup-list">
                        {group.subgroups.map((subgroup) => {
                          const subgroupStateKey = buildSubgroupStateKey(
                            group.key,
                            subgroup.key
                          )
                          const rootTable = getSubgroupRootTable(subgroup)
                          const childTables = subgroup.tables.filter(
                            (table) => table.name !== rootTable?.name
                          )
                          const subgroupLabel = rootTable?.label || subgroup.label
                          const isSubgroupExpanded =
                            expandedSubgroups[subgroupStateKey] ?? false
                          const isSubgroupRootActive =
                            rootTable.name === activeTableName

                          return (
                            <section
                              key={subgroupStateKey}
                              className="admin-table-subgroup"
                            >
                              <button
                                type="button"
                                className={`admin-subgroup-toggle ${isSubgroupExpanded ? 'is-expanded' : ''} ${isSubgroupRootActive ? 'is-active' : ''}`.trim()}
                                onClick={(event) =>
                                  handleSubgroupClick(
                                    event,
                                    group.key,
                                    subgroup.key,
                                    rootTable.name
                                  )
                                }
                              >
                                <span className="admin-subgroup-toggle-main">
                                  <span className="admin-subgroup-label">
                                    {subgroupLabel}
                                  </span>
                                  {childTables.length > 0 && (
                                    <span className="admin-subgroup-count">
                                      {childTables.length}
                                    </span>
                                  )}
                                </span>
                                {childTables.length > 0 && (
                                  <span
                                    className="admin-subgroup-arrow"
                                    aria-hidden="true"
                                    data-admin-toggle-arrow="true"
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M9 6L15 12L9 18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                )}
                              </button>
                              {isSubgroupExpanded && childTables.length > 0 && (
                                <div className="admin-table-list">
                                  {childTables.map((table) => (
                                    <button
                                      key={table.name}
                                      className={`admin-table-item ${table.name === activeTableName ? 'is-active' : ''}`}
                                      onClick={() =>
                                        setActiveTableName(table.name)
                                      }
                                    >
                                      {table.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </section>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          </aside>

          <section className="admin-content">
            <div className="admin-content-header">
              <div className="admin-content-heading">
                <h4>{activeTable?.label || 'Tabella'}</h4>
                {activeTable?.description && (
                  <p className="admin-table-description">
                    {activeTable.description}
                  </p>
                )}
              </div>
              <div className="admin-content-actions">
                <button className="admin-btn admin-btn-inline" onClick={handleCreateNew}>
                  Insert
                </button>
              </div>
            </div>

            <div className="admin-grid-tools">
              <input
                className="admin-input"
                placeholder="Cerca nelle righe..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(1)
                }}
              />
              <div className="admin-pagination">
                <button
                  className="admin-btn admin-btn-inline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  Prev
                </button>
                <span className="admin-small-text admin-page-label">
                  Pagina {currentPage}/{totalPages} - {filteredRows.length} risultati
                </span>
                <button
                  className="admin-btn admin-btn-inline"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
            {error && <p className="admin-error">{error}</p>}

            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <colgroup>
                  {showRowIndex && <col className="admin-col-index" />}
                  {visibleColumns.map((column) => (
                    <col
                      key={`col-${column}`}
                      className={getColumnLayoutClass(column, fieldsByName[column])}
                    />
                  ))}
                  <col className="admin-col-action" />
                  <col className="admin-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    {showRowIndex && <th className="admin-index-col">#</th>}
                    {visibleColumns.map((column) => (
                      <th
                        key={column}
                        className={`${
                          fieldsByName[column]?.primaryKey ||
                          fieldsByName[column]?.foreignKey
                            ? 'admin-key-col'
                            : 'admin-data-col'
                        } ${getColumnHeaderAlignmentClass(
                          column,
                          fieldsByName[column],
                        )}`}
                      >
                        {fieldsByName[column]?.label || column}
                      </th>
                    ))}
                    <th className="admin-action-col">Delete</th>
                    <th className="admin-action-col">Modify</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows &&
                    Array.from({ length: ADMIN_TABLE_SKELETON_ROWS }).map((_, rowIndex) => (
                      <tr
                        key={`admin-loading-row-${rowIndex}`}
                        className="admin-loading-table-row"
                      >
                        {showRowIndex && (
                          <td className="admin-index-cell">
                            <span className="admin-skeleton admin-skeleton-table-chip" />
                          </td>
                        )}
                        {visibleColumns.map((column) => (
                          <td key={`admin-loading-${rowIndex}-${column}`}>
                            <span
                              className={
                                fieldsByName[column]?.editor.kind === 'color'
                                  ? 'admin-skeleton admin-skeleton-table-color'
                                  : 'admin-skeleton admin-skeleton-table-line'
                              }
                            />
                          </td>
                        ))}
                        <td className="admin-action-cell">
                          <span className="admin-skeleton admin-skeleton-table-action" />
                        </td>
                        <td className="admin-action-cell">
                          <span className="admin-skeleton admin-skeleton-table-action" />
                        </td>
                      </tr>
                    ))}
                  {!loadingRows && rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={Math.max(
                          visibleColumns.length + (showRowIndex ? 3 : 2),
                          4
                        )}
                      >
                        Nessuna riga disponibile
                      </td>
                    </tr>
                  )}
                  {!loadingRows &&
                    paginatedRows.map((row, index) => {
                      const absoluteIndex = pageStart + index
                      return (
                        <tr
                          key={`${activeTableName}-${absoluteIndex}`}
                          className={absoluteIndex === selectedIndex ? 'is-active' : ''}
                        >
                          {showRowIndex && (
                            <td className="admin-index-cell">{absoluteIndex + 1}</td>
                          )}
                          {visibleColumns.map((column) => (
                            <td
                              key={`${absoluteIndex}-${column}`}
                              className={`${
                                fieldsByName[column]?.primaryKey ||
                                fieldsByName[column]?.foreignKey
                                  ? 'admin-key-cell'
                                  : 'admin-data-cell'
                              } ${getColumnCellAlignmentClass(
                                column,
                                fieldsByName[column],
                              )}`}
                            >
                              {renderCellValue(column, row?.[column])}
                            </td>
                          ))}
                          <td className="admin-action-cell">
                            <button
                              className="admin-icon-btn admin-delete-icon-btn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleAskDeleteRow(absoluteIndex)
                              }}
                              aria-label="Elimina riga"
                              title="Elimina riga"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3 6H21"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11V17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 11V17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </td>
                          <td className="admin-action-cell">
                            <button
                              className="admin-icon-btn admin-modify-icon-btn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSelectRow(absoluteIndex)
                              }}
                              aria-label="Modifica riga"
                              title="Modifica riga"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <path
                                  d="M12 20H21"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M16.5 3.5C17.3284 2.67157 18.6716 2.67157 19.5 3.5C20.3284 4.32843 20.3284 5.67157 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {editorOpen && (
          <div className="admin-modal-backdrop" role="presentation">
            <div className="admin-modal admin-editor-screen">
              <div className="admin-card-header">
                <h4>{selectedIndex >= 0 ? 'Modifica riga' : 'Nuova riga'}</h4>
                <button
                  className="admin-btn admin-btn-inline"
                  onClick={() => {
                    setEditorOpen(false)
                    setShowDeleteConfirm(false)
                  }}
                >
                  Chiudi
                </button>
              </div>

              <div className="admin-editor">
                {editorFields.length === 0 && (
                  <p className="admin-small-text">
                    Nessun campo modificabile disponibile
                  </p>
                )}
                {referenceEditorFields.length > 0 && (
                  <section className="admin-editor-section">
                    <div className="admin-editor-section-header">
                      <h5 className="admin-editor-section-title">
                        Riferimenti relazionali e chiavi
                      </h5>
                      <p className="admin-editor-section-note">
                        Collegano questa riga al record corretto.
                        {selectedIndex >= 0
                          ? ' In modifica restano bloccati per evitare cambi di chiave.'
                          : ' In creazione vanno impostati prima di salvare.'}
                      </p>
                    </div>
                    <div className="admin-editor-fields">
                      {referenceEditorFields.map((field) => (
                        <label key={`field-reference-${field.name}`} className="admin-label">
                          {field.label}
                          {renderEditorField(field)}
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                {contentEditorFields.length > 0 && (
                  <section className="admin-editor-section admin-editor-section-divider">
                    <div className="admin-editor-section-header">
                      <h5 className="admin-editor-section-title">
                        {isLocaleTranslationTable && selectedIndex < 0
                          ? 'Contenuto localizzato'
                          : 'Contenuto e proprietà modificabili'}
                      </h5>
                      <p className="admin-editor-section-note">
                        {isLocaleTranslationTable && selectedIndex < 0
                          ? 'Compila insieme la versione italiana e quella inglese della stessa voce.'
                          : 'Campi che definiscono il contenuto visibile o il comportamento della riga.'}
                      </p>
                    </div>
                    {isLocaleTranslationTable && selectedIndex < 0 ? (
                      <div className="admin-locale-grid">
                        {BILINGUAL_LOCALES.map((locale) => (
                          <section key={`locale-${locale}`} className="admin-locale-card">
                            <div className="admin-locale-card-header">
                              <h6 className="admin-locale-card-title">
                                {locale === 'it' ? 'Italiano' : 'English'}
                              </h6>
                              <span className="admin-locale-chip">{locale.toUpperCase()}</span>
                            </div>
                            <div className="admin-editor-fields">
                              {contentEditorFields.map((field) => (
                                <label
                                  key={`field-content-${locale}-${field.name}`}
                                  className="admin-label"
                                >
                                  {field.label}
                                  {renderLocaleEditorField(field, locale)}
                                </label>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-editor-fields">
                        {contentEditorFields.map((field) => (
                          <label key={`field-content-${field.name}`} className="admin-label">
                            {field.label}
                            {renderEditorField(field)}
                          </label>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>

              <div className="admin-modal-actions">
                {selectedIndex >= 0 && (
                  <button
                    className="admin-btn admin-btn-inline"
                    onClick={handleUpdate}
                    disabled={busyAction === 'update' || !hasSelection}
                  >
                    {busyAction === 'update' ? 'Aggiornamento...' : 'Salva modifiche'}
                  </button>
                )}
                {selectedIndex < 0 && (
                  <button
                    className="admin-btn admin-btn-inline"
                    onClick={handleInsert}
                    disabled={busyAction === 'insert'}
                  >
                    {busyAction === 'insert'
                      ? 'Salvataggio...'
                      : isLocaleTranslationTable
                        ? 'Crea IT + EN'
                        : 'Crea riga'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="admin-modal-backdrop" role="presentation">
            <div className="admin-modal">
              <h4>Conferma eliminazione</h4>
              <p className="admin-small-text">
                Stai eliminando la riga con chiavi:{' '}
                {JSON.stringify(buildKeys(selectedRow, primaryKeys))}
              </p>
              <div className="admin-modal-actions">
                <button
                  className="admin-btn admin-btn-inline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={busyAction === 'delete'}
                >
                  Annulla
                </button>
                <button
                  className="admin-btn admin-btn-inline admin-btn-danger"
                  onClick={performDelete}
                  disabled={busyAction === 'delete'}
                >
                  {busyAction === 'delete' ? 'Eliminazione...' : 'Conferma Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminDashboard
