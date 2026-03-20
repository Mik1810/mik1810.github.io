import '../css/AdminAuth.css'
import '../css/AdminHomeLayout.css'
import '../css/AdminHomeCards.css'

function AdminHomeSkeleton() {
  return (
    <main className="admin-page admin-page-home" aria-busy="true" aria-live="polite">
      <section className="admin-home-shell">
        <section className="admin-card admin-home-hero">
          <div className="admin-home-hero-copy">
            <div className="admin-home-hero-title-row">
              <span className="admin-skeleton admin-home-skeleton-title" />
              <span className="admin-skeleton admin-home-skeleton-refresh-icon" />
            </div>
            <span className="admin-skeleton admin-home-skeleton-copy" />
            <span className="admin-skeleton admin-home-skeleton-copy admin-home-skeleton-copy-short" />
            <div className="admin-home-hero-summary">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`admin-home-summary-skeleton-${index}`} className="admin-home-summary-chip">
                  <span className="admin-skeleton admin-home-skeleton-chip-label" />
                  <span className="admin-skeleton admin-home-skeleton-chip-value" />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-home-hero-actions">
            <span className="admin-skeleton admin-home-skeleton-button" />
          </div>
        </section>

        <article className="admin-card admin-home-card admin-home-card-database">
          <div className="admin-home-card-header">
            <div className="admin-home-card-title">
              <span className="admin-skeleton admin-home-skeleton-icon" />
              <div className="admin-home-skeleton-stack">
                <span className="admin-skeleton admin-home-skeleton-eyebrow" />
                <span className="admin-skeleton admin-home-skeleton-card-title" />
              </div>
            </div>
            <span className="admin-skeleton admin-home-skeleton-pill" />
          </div>
          <div className="admin-home-stat-grid admin-home-stat-grid-database">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`admin-home-database-metric-skeleton-${index}`} className="admin-home-stat-tile">
                <span className="admin-skeleton admin-home-skeleton-metric-label" />
                <span className="admin-skeleton admin-home-skeleton-metric-value" />
              </div>
            ))}
          </div>
        </article>

        <section className="admin-home-grid-trio">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={`admin-home-card-skeleton-${index}`} className="admin-card admin-home-card">
              <div className="admin-home-card-header">
                <div className="admin-home-card-title">
                  <span className="admin-skeleton admin-home-skeleton-icon" />
                  <div className="admin-home-skeleton-stack">
                    <span className="admin-skeleton admin-home-skeleton-eyebrow" />
                    <span className="admin-skeleton admin-home-skeleton-card-title" />
                  </div>
                </div>
              </div>
              <div className="admin-home-metrics">
                {Array.from({ length: 3 }).map((__, metricIndex) => (
                  <div key={`admin-home-metric-skeleton-${index}-${metricIndex}`}>
                    <span className="admin-skeleton admin-home-skeleton-metric-label" />
                    <span className="admin-skeleton admin-home-skeleton-metric-value" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="admin-card admin-home-card admin-home-env-card">
          <div className="admin-home-card-header">
            <div className="admin-home-card-title">
              <span className="admin-skeleton admin-home-skeleton-icon" />
              <div className="admin-home-skeleton-stack">
                <span className="admin-skeleton admin-home-skeleton-eyebrow" />
                <span className="admin-skeleton admin-home-skeleton-card-title" />
              </div>
            </div>
          </div>

          <div className="admin-home-env-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={`admin-home-env-skeleton-${index}`} className="admin-home-env-item">
                <div className="admin-home-env-header">
                  <div className="admin-home-skeleton-stack">
                    <span className="admin-skeleton admin-home-skeleton-env-key" />
                    <span className="admin-skeleton admin-home-skeleton-env-badge" />
                  </div>
                  <span className="admin-skeleton admin-home-skeleton-toggle" />
                </div>
                <span className="admin-skeleton admin-home-skeleton-env-value" />
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default AdminHomeSkeleton
