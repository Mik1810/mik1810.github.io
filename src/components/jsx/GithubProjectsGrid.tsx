import type { GithubProjectItem } from '../../types/app.js'
import '../css/GithubProjectsGrid.css'
import GithubProjectCard from './GithubProjectCard'

function GithubProjectSkeleton({ index }: { index: number }) {
  return (
    <article
      className={`github-project-card github-project-card-skeleton reveal reveal-delay-${Math.min(index + 1, 4)}`}
      aria-hidden="true"
    >
      <div className="github-project-header">
        <div className="github-project-topline">
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '48%', height: '20px' }}
          />
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '72px', height: '28px', borderRadius: '999px' }}
          />
        </div>
      </div>
      <div className="github-project-media github-project-media-skeleton">
        <span className="ui-skeleton ui-skeleton-block github-project-media-skeleton-block" />
      </div>
      <div className="github-project-content">
        <span
          className="ui-skeleton ui-skeleton-line"
          style={{ width: '100%', height: '14px', marginBottom: '0.55rem' }}
        />
        <span
          className="ui-skeleton ui-skeleton-line"
          style={{ width: '94%', height: '14px', marginBottom: '0.55rem' }}
        />
        <span
          className="ui-skeleton ui-skeleton-line"
          style={{ width: '68%', height: '14px', marginBottom: '1.15rem' }}
        />
        <div className="project-tags">
          {Array.from({ length: 3 }, (_, tagIndex) => (
            <span
              key={`github-tag-skeleton-${index}-${tagIndex}`}
              className="ui-skeleton ui-skeleton-chip"
            />
          ))}
        </div>
        <div className="project-links project-links-skeleton">
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '108px', height: '14px' }}
          />
        </div>
      </div>
    </article>
  )
}

function GithubProjectsGrid({
  projects,
  previewCtaLabel,
  expandHintLabel,
  emptyMediaLabel,
  repoLabel,
}: {
  projects: GithubProjectItem[]
  previewCtaLabel: string
  expandHintLabel: string
  emptyMediaLabel: string
  repoLabel: string
}) {
  const showGithubSkeletons = projects.length === 0

  return (
    <div className="github-projects-grid">
      {showGithubSkeletons
        ? Array.from({ length: 2 }, (_, index) => (
            <GithubProjectSkeleton key={`github-skeleton-${index}`} index={index} />
          ))
        : projects.map((project, index) => (
            <GithubProjectCard
              key={project.slug || index}
              project={project}
              index={index}
              previewCtaLabel={previewCtaLabel}
              expandHintLabel={expandHintLabel}
              emptyMediaLabel={emptyMediaLabel}
              repoLabel={repoLabel}
            />
          ))}
    </div>
  )
}

export default GithubProjectsGrid
