import { Link } from 'react-router-dom'

import { RefreshIcon } from './AdminHomeIcons'

interface AdminHomeHeroProps {
  isLoading?: boolean
  loading: boolean
  refreshing: boolean
  runtimeUptimeLabel: string
  checkedAtLabel: string
  totalTables: number
  totalGroups: number
  onRefresh: () => void
}

function AdminHomeHero({
  isLoading = false,
  loading,
  refreshing,
  runtimeUptimeLabel,
  checkedAtLabel,
  totalTables,
  totalGroups,
  onRefresh,
}: AdminHomeHeroProps) {
  if (isLoading) {
    return (
      <header className="admin-card admin-home-hero admin-home-hero-card">
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
          <div className="admin-home-hero-actions">
            <span className="admin-skeleton admin-home-skeleton-button" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="admin-card admin-home-hero admin-home-hero-card">
      <div className="admin-home-hero-copy">
        <div className="admin-home-hero-title-row">
          <h2>Dashboard Admin</h2>
          <button
            type="button"
            className="admin-home-refresh-icon-btn"
            onClick={onRefresh}
            disabled={refreshing || loading}
            aria-label={
              refreshing ? 'Aggiornamento dashboard in corso' : 'Aggiorna stato'
            }
            title={refreshing ? 'Aggiornamento...' : 'Aggiorna stato'}
          >
            <RefreshIcon
              className={`admin-home-refresh-icon ${
                refreshing ? 'is-spinning' : ''
              }`.trim()}
            />
          </button>
        </div>

        <p className="admin-home-lead">
          Stato operativo, accesso rapido alle tabelle e variabili ambiente con
          valori oscurati di default.
        </p>

        <div className="admin-home-hero-summary">
          <div className="admin-home-summary-chip">
            <span>Tables</span>
            <strong>{loading ? '...' : totalTables}</strong>
          </div>
          <div className="admin-home-summary-chip">
            <span>Groups</span>
            <strong>{loading ? '...' : totalGroups}</strong>
          </div>
          <div className="admin-home-summary-chip">
            <span>Uptime</span>
            <strong>{runtimeUptimeLabel}</strong>
          </div>
          <div className="admin-home-summary-chip">
            <span>Checked</span>
            <strong>{checkedAtLabel}</strong>
          </div>
        </div>

        <div className="admin-home-hero-actions">
          <Link className="admin-btn admin-home-primary-link" to="/admin/tables">
            Apri tabelle
          </Link>
        </div>
      </div>
    </header>
  )
}

export default AdminHomeHero
