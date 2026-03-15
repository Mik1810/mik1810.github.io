import '../css/AdminAuth.css'

const SIDEBAR_GROUPS = [3, 2, 3, 2]
const TABLE_COLUMNS = 5
const TABLE_ROWS = 6
const EDITOR_FIELDS = 5

function AdminDashboardSkeleton() {
  return (
    <main className="admin-page">
      <section className="admin-card admin-card-wide">
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-skeleton admin-skeleton-title" />

            <div className="admin-table-groups">
              {SIDEBAR_GROUPS.map((tableCount, groupIndex) => (
                <section key={`admin-group-skeleton-${groupIndex}`} className="admin-table-group">
                  <div className="admin-group-toggle admin-group-toggle-skeleton">
                    <span className="admin-group-toggle-main">
                      <span className="admin-skeleton admin-skeleton-group-label" />
                      <span className="admin-skeleton admin-skeleton-group-count" />
                    </span>
                    <span className="admin-skeleton admin-skeleton-icon" aria-hidden="true" />
                  </div>

                  {groupIndex === 0 && (
                    <div className="admin-table-list">
                      {Array.from({ length: tableCount }).map((_, tableIndex) => (
                        <span
                          key={`admin-table-skeleton-${tableIndex}`}
                          className="admin-table-item admin-table-item-skeleton"
                          aria-hidden="true"
                        >
                          <span className="admin-skeleton admin-skeleton-table-item" />
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </aside>

          <section className="admin-content">
            <div className="admin-content-header">
              <div className="admin-skeleton admin-skeleton-heading" />
              <div className="admin-skeleton admin-skeleton-button" />
            </div>

            <div className="admin-grid-tools">
              <div className="admin-skeleton admin-skeleton-input" />
              <div className="admin-pagination admin-pagination-skeleton">
                <div className="admin-skeleton admin-skeleton-button admin-skeleton-button-sm" />
                <div className="admin-skeleton admin-skeleton-page-label" />
                <div className="admin-skeleton admin-skeleton-button admin-skeleton-button-sm" />
              </div>
            </div>

            <div className="admin-table-wrap admin-table-wrap-skeleton">
              <div className="admin-table-skeleton">
                <div className="admin-table-skeleton-row admin-table-skeleton-head">
                  {Array.from({ length: TABLE_COLUMNS }).map((_, columnIndex) => (
                    <span
                      key={`admin-head-skeleton-${columnIndex}`}
                      className="admin-skeleton admin-skeleton-table-head"
                    />
                  ))}
                  <span className="admin-skeleton admin-skeleton-table-action" />
                  <span className="admin-skeleton admin-skeleton-table-action" />
                </div>

                {Array.from({ length: TABLE_ROWS }).map((_, rowIndex) => (
                  <div key={`admin-row-skeleton-${rowIndex}`} className="admin-table-skeleton-row">
                    {Array.from({ length: TABLE_COLUMNS }).map((_, columnIndex) => (
                      <span
                        key={`admin-cell-skeleton-${rowIndex}-${columnIndex}`}
                        className="admin-skeleton admin-skeleton-table-cell"
                      />
                    ))}
                    <span className="admin-skeleton admin-skeleton-table-action" />
                    <span className="admin-skeleton admin-skeleton-table-action" />
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-editor admin-editor-skeleton">
              {Array.from({ length: EDITOR_FIELDS }).map((_, fieldIndex) => (
                <div key={`admin-editor-skeleton-${fieldIndex}`} className="admin-editor-skeleton-field">
                  <span className="admin-skeleton admin-skeleton-label" />
                  <span className="admin-skeleton admin-skeleton-editor" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardSkeleton
