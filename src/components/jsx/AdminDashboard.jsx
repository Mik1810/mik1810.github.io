import { useCallback, useEffect, useMemo, useState } from 'react';
import '../css/AdminAuth.css';

const PAGE_SIZE = 15;
const EMPTY_PRIMARY_KEYS = [];

function prettyValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseEditorValue(rawValue) {
  const trimmed = rawValue.trim();
  if (trimmed === '') return '';
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return rawValue;
    }
  }
  return rawValue;
}

function buildKeys(row, primaryKeys) {
  const keys = {};
  for (const key of primaryKeys || []) {
    keys[key] = row?.[key];
  }
  return keys;
}

function isForeignKeyColumn(column) {
  return column.toLowerCase().endsWith('_id');
}

function isSystemColumn(column) {
  const normalized = column.toLowerCase();
  return normalized === 'created_at' || normalized === 'updated_at';
}

function isLikelyUrlField(fieldName) {
  const normalized = fieldName.toLowerCase();
  return normalized === 'url' || normalized.endsWith('_url') || normalized.endsWith('url');
}

function isKeyColumnName(column) {
  const normalized = column.toLowerCase();
  return (
    normalized === 'id' ||
    normalized.endsWith('_id') ||
    normalized === 'order_index' ||
    normalized.endsWith('_index')
  );
}

function isValidUrlLike(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
}

function AdminDashboard() {
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [activeTableName, setActiveTableName] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [draftRow, setDraftRow] = useState({});
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const activeTable = useMemo(
    () => tables.find((item) => item.name === activeTableName) || null,
    [tables, activeTableName]
  );

  const primaryKeys = useMemo(
    () => activeTable?.primaryKeys || EMPTY_PRIMARY_KEYS,
    [activeTable]
  );
  const selectedRow = selectedIndex >= 0 ? rows[selectedIndex] : null;

  const loadRows = useCallback(async (tableName) => {
    if (!tableName) return;
    setLoadingRows(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/table?table=${encodeURIComponent(tableName)}&limit=500`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        setRows([]);
        setSelectedIndex(-1);
        setDraftRow({});
        setError(data?.error || 'Errore nel caricamento delle righe');
        return;
      }
      const nextRows = Array.isArray(data?.rows) ? data.rows : [];
      setRows(nextRows);
      setPage(1);
      if (nextRows.length > 0) {
        setSelectedIndex(0);
        setDraftRow(nextRows[0]);
      } else {
        setSelectedIndex(-1);
        setDraftRow(activeTable?.defaultRow || {});
      }
    } catch {
      setRows([]);
      setSelectedIndex(-1);
      setDraftRow({});
      setPage(1);
      setError('Errore di rete durante il caricamento');
    } finally {
      setLoadingRows(false);
    }
  }, [activeTable]);

  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true);
      setError('');
      try {
        const response = await fetch('/api/admin/tables', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.error || 'Impossibile caricare la lista tabelle');
          setTables([]);
          return;
        }
        const nextTables = Array.isArray(data?.tables) ? data.tables : [];
        setTables(nextTables);
        if (nextTables.length > 0) {
          setActiveTableName(nextTables[0].name);
        }
      } catch {
        setError('Errore di rete durante il caricamento tabelle');
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, []);

  useEffect(() => {
    if (!activeTableName) return;
    loadRows(activeTableName);
  }, [activeTableName, loadRows]);

  useEffect(() => {
    setSearchQuery('');
    setShowDeleteConfirm(false);
    setEditorOpen(false);
  }, [activeTableName]);

  const handleSelectRow = (index) => {
    const nextRow = rows[index];
    setSelectedIndex(index);
    setDraftRow(nextRow || {});
    setError('');
    setEditorOpen(true);
  };

  const handleAskDeleteRow = (index) => {
    const nextRow = rows[index];
    setSelectedIndex(index);
    setDraftRow(nextRow || {});
    setShowDeleteConfirm(true);
    setError('');
  };

  const handleFieldChange = (key, value) => {
    setDraftRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateNew = () => {
    const sourceRow = selectedRow || rows[0] || {};
    const inheritedForeignKeys = Object.fromEntries(
      Object.entries(sourceRow).filter(([key]) => isForeignKeyColumn(key))
    );
    setSelectedIndex(-1);
    setDraftRow({
      ...inheritedForeignKeys,
      ...(activeTable?.defaultRow || {}),
    });
    setShowDeleteConfirm(false);
    setError('');
    setEditorOpen(true);
  };

  const runAction = async (action, fn) => {
    setBusyAction(action);
    setError('');
    try {
      await fn();
      await loadRows(activeTableName);
    } catch (nextError) {
      setError(nextError.message || 'Operazione fallita');
    } finally {
      setBusyAction('');
    }
  };

  const validateDraftRow = () => {
    for (const [key, value] of Object.entries(draftRow || {})) {
      if (!isLikelyUrlField(key)) continue;
      if (value === null || value === undefined || value === '') continue;
      if (!isValidUrlLike(value)) {
        throw new Error(`Campo URL non valido: ${key}`);
      }
    }
  };

  const handleInsert = () =>
    runAction('insert', async () => {
      validateDraftRow();
      const response = await fetch(`/api/admin/table?table=${encodeURIComponent(activeTableName)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: draftRow }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Insert fallita');
      setEditorOpen(false);
    });

  const handleUpdate = () =>
    runAction('update', async () => {
      if (!selectedRow) throw new Error('Seleziona una riga da aggiornare');
      validateDraftRow();
      const response = await fetch(`/api/admin/table?table=${encodeURIComponent(activeTableName)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: buildKeys(selectedRow, primaryKeys),
          row: draftRow,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Update fallito');
      setEditorOpen(false);
    });

  const performDelete = () =>
    runAction('delete', async () => {
      if (!selectedRow) throw new Error('Seleziona una riga da cancellare');
      const response = await fetch(`/api/admin/table?table=${encodeURIComponent(activeTableName)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: buildKeys(selectedRow, primaryKeys),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Delete fallita');
      setShowDeleteConfirm(false);
      setEditorOpen(false);
    });

  const columns = useMemo(() => {
    const set = new Set();
    for (const row of rows) {
      Object.keys(row || {}).forEach((key) => set.add(key));
    }
    Object.keys(draftRow || {}).forEach((key) => set.add(key));
    return Array.from(set);
  }, [rows, draftRow]);

  const hiddenColumns = useMemo(() => {
    return new Set(
      columns.filter(
        (column) =>
          primaryKeys.includes(column) || isForeignKeyColumn(column) || isSystemColumn(column)
      )
    );
  }, [columns, primaryKeys]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.has(column)),
    [columns, hiddenColumns]
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      visibleColumns.some((column) =>
        prettyValue(row?.[column]).toLowerCase().includes(query)
      )
    );
  }, [rows, visibleColumns, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage);
  }, [currentPage, page]);

  const hasSelection = Boolean(selectedRow);

  return (
    <main className="admin-page">
      <section className="admin-card admin-card-wide">
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h4>Tabelle</h4>
            {loadingTables && <p>Caricamento...</p>}
            {!loadingTables && tables.length === 0 && <p>Nessuna tabella disponibile</p>}
            <div className="admin-table-list">
              {tables.map((table) => (
                <button
                  key={table.name}
                  className={`admin-table-item ${table.name === activeTableName ? 'is-active' : ''}`}
                  onClick={() => setActiveTableName(table.name)}
                >
                  {table.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="admin-content">
            <div className="admin-content-header">
              <h4>{activeTable?.label || 'Tabella'}</h4>
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
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
                  <col className="admin-col-index" />
                  {visibleColumns.map((column) => (
                    <col
                      key={`col-${column}`}
                      className={isKeyColumnName(column) ? 'admin-col-key' : 'admin-col-data'}
                    />
                  ))}
                  <col className="admin-col-action" />
                  <col className="admin-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="admin-index-col">#</th>
                    {visibleColumns.map((column) => (
                      <th
                        key={column}
                        className={isKeyColumnName(column) ? 'admin-key-col' : 'admin-data-col'}
                      >
                        {column}
                      </th>
                    ))}
                    <th className="admin-action-col">Delete</th>
                    <th className="admin-action-col">Modify</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows && (
                    <tr>
                      <td colSpan={Math.max(visibleColumns.length + 3, 4)}>Caricamento righe...</td>
                    </tr>
                  )}
                  {!loadingRows && rows.length === 0 && (
                    <tr>
                      <td colSpan={Math.max(visibleColumns.length + 3, 4)}>Nessuna riga disponibile</td>
                    </tr>
                  )}
                  {!loadingRows &&
                    paginatedRows.map((row, index) => {
                      const absoluteIndex = pageStart + index;
                      return (
                      <tr
                        key={`${activeTableName}-${absoluteIndex}`}
                        className={absoluteIndex === selectedIndex ? 'is-active' : ''}
                      >
                        <td className="admin-index-cell">{absoluteIndex + 1}</td>
                        {visibleColumns.map((column) => (
                          <td
                            key={`${absoluteIndex}-${column}`}
                            className={isKeyColumnName(column) ? 'admin-key-cell' : 'admin-data-cell'}
                          >
                            {prettyValue(row?.[column])}
                          </td>
                        ))}
                        <td className="admin-action-cell">
                          <button
                            className="admin-icon-btn admin-delete-icon-btn"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAskDeleteRow(absoluteIndex);
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
                              event.stopPropagation();
                              handleSelectRow(absoluteIndex);
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
                      );
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
                    setEditorOpen(false);
                    setShowDeleteConfirm(false);
                  }}
                >
                  Chiudi
                </button>
              </div>

              <div className="admin-editor">
                {visibleColumns.length === 0 && <p className="admin-small-text">Nessun campo modificabile disponibile</p>}
                {visibleColumns.map((column) => (
                  <label key={`field-${column}`} className="admin-label">
                    {column}
                    <textarea
                      className="admin-input admin-textarea"
                      value={prettyValue(draftRow?.[column])}
                      onChange={(e) => handleFieldChange(column, parseEditorValue(e.target.value))}
                      disabled={busyAction !== ''}
                      rows={column.toLowerCase().includes('description') || column.toLowerCase().includes('bio') ? 4 : 2}
                    />
                  </label>
                ))}
              </div>

              <div className="admin-modal-actions">
                {selectedIndex >= 0 && (
                  <>
                    <button
                      className="admin-btn admin-btn-inline"
                      onClick={handleUpdate}
                      disabled={busyAction === 'update' || !hasSelection}
                    >
                      {busyAction === 'update' ? 'Aggiornamento...' : 'Salva modifiche'}
                    </button>
                  </>
                )}
                {selectedIndex < 0 && (
                  <button
                    className="admin-btn admin-btn-inline"
                    onClick={handleInsert}
                    disabled={busyAction === 'insert'}
                  >
                    {busyAction === 'insert' ? 'Salvataggio...' : 'Crea riga'}
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
                Stai eliminando la riga con chiavi: {JSON.stringify(buildKeys(selectedRow, primaryKeys))}
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
  );
}

export default AdminDashboard;
