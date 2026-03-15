import type { MouseEvent } from 'react'

import type { ProjectItem } from '../../types/app.js'
import '../css/PortfolioProjectsGrid.css'

type TiltState = {
  rect: DOMRect
  frameId: number | null
  clientX: number
  clientY: number
}

const tiltStates = new WeakMap<HTMLDivElement, TiltState>()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const applyTilt = (card: HTMLDivElement, state: TiltState) => {
  state.frameId = window.requestAnimationFrame(() => {
    state.frameId = null

    const x = state.clientX - state.rect.left
    const y = state.clientY - state.rect.top
    const centerX = state.rect.width / 2
    const centerY = state.rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -5
    const rotateY = ((x - centerX) / centerX) * 5

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
  })
}

const handleTiltStart = (event: MouseEvent<HTMLDivElement>) => {
  if (prefersReducedMotion()) return

  const card = event.currentTarget
  card.classList.remove('is-resetting-tilt')
  card.classList.add('is-tilting')
  tiltStates.set(card, {
    rect: card.getBoundingClientRect(),
    frameId: null,
    clientX: event.clientX,
    clientY: event.clientY,
  })
}

const handleTilt = (event: MouseEvent<HTMLDivElement>) => {
  if (prefersReducedMotion()) return

  const card = event.currentTarget
  const state = tiltStates.get(card) ?? {
    rect: card.getBoundingClientRect(),
    frameId: null,
    clientX: event.clientX,
    clientY: event.clientY,
  }

  state.clientX = event.clientX
  state.clientY = event.clientY
  tiltStates.set(card, state)

  if (state.frameId === null) {
    applyTilt(card, state)
  }
}

const handleTiltReset = (event: MouseEvent<HTMLDivElement>) => {
  const card = event.currentTarget
  const state = tiltStates.get(card)

  if (state?.frameId !== null) {
    window.cancelAnimationFrame(state.frameId)
  }

  tiltStates.delete(card)
  card.classList.remove('is-tilting')

  window.requestAnimationFrame(() => {
    card.classList.add('is-resetting-tilt')
    card.style.transform = ''
  })
}

function ProjectCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={`project-card project-card-skeleton reveal reveal-delay-${Math.min(index + 1, 4)}`}
      aria-hidden="true"
    >
      <div className="project-card-content">
        <span
          className="ui-skeleton ui-skeleton-line"
          style={{ width: '58%', height: '22px', marginBottom: '0.9rem' }}
        />
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
          style={{ width: '72%', height: '14px', marginBottom: '1.25rem' }}
        />
        <div className="project-tags">
          {Array.from({ length: 3 }, (_, tagIndex) => (
            <span
              key={`project-tag-skeleton-${index}-${tagIndex}`}
              className="ui-skeleton ui-skeleton-chip"
            />
          ))}
        </div>
        <div className="project-links project-links-skeleton">
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '92px', height: '14px' }}
          />
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '92px', height: '14px' }}
          />
        </div>
      </div>
    </div>
  )
}

function PortfolioProjectsGrid({
  projects,
  codeLabel,
  siteLabel,
}: {
  projects: ProjectItem[]
  codeLabel: string
  siteLabel: string
}) {
  const showProjectSkeletons = projects.length === 0

  return (
    <div className="projects-grid">
      {showProjectSkeletons
        ? Array.from({ length: 3 }, (_, index) => (
            <ProjectCardSkeleton key={`project-skeleton-${index}`} index={index} />
          ))
        : projects.map((project, index) => (
            <div
              key={project.id || index}
              className={`project-card reveal reveal-delay-${index + 1}`}
              onMouseEnter={handleTiltStart}
              onMouseMove={handleTilt}
              onMouseLeave={handleTiltReset}
              onTransitionEnd={(event) => {
                if (event.propertyName === 'transform') {
                  event.currentTarget.classList.remove('is-resetting-tilt')
                }
              }}
            >
              <div className="project-card-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      {codeLabel}
                    </a>
                  )}
                  {project.live && project.live !== '#' && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                      {siteLabel}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
    </div>
  )
}

export default PortfolioProjectsGrid
