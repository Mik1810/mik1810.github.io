import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { GithubProjectItem } from '../../types/app.js'
import '../css/GithubProjectLightbox.css'

function GithubProjectLightbox({
  project,
  images,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: {
  project: GithubProjectItem
  images: string[]
  activeIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}) {
  const imageSrc = images[activeIndex]
  const showControls = images.length > 1
  const [initialImageSrc] = useState(imageSrc)
  const [layoutMode, setLayoutMode] = useState<'wide' | 'tall'>('wide')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.classList.add('github-project-lightbox-open')
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (showControls && event.key === 'ArrowRight') {
        onNext()
        return
      }
      if (showControls && event.key === 'ArrowLeft') {
        onPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('github-project-lightbox-open')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, onNext, onPrev, showControls])

  useEffect(() => {
    const probe = new window.Image()
    const applyLayoutMode = () => {
      const ratio =
        probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : 1
      setLayoutMode(ratio >= 1.6 ? 'wide' : 'tall')
    }

    probe.src = initialImageSrc

    if (probe.complete) {
      applyLayoutMode()
      return undefined
    }

    probe.addEventListener('load', applyLayoutMode)
    return () => {
      probe.removeEventListener('load', applyLayoutMode)
    }
  }, [initialImageSrc])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="github-project-lightbox-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`github-project-lightbox github-project-lightbox-${layoutMode}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} media preview`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="github-project-lightbox-close"
          onClick={onClose}
          aria-label={`Close ${project.title} preview`}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <div className="github-project-lightbox-meta">
          <strong>{project.title}</strong>
          <span>
            {activeIndex + 1}/{images.length}
          </span>
        </div>

        <div className="github-project-lightbox-media-shell">
          {showControls && (
            <button
              type="button"
              className="github-project-lightbox-nav github-project-lightbox-nav-left"
              onClick={onPrev}
              aria-label={`Previous ${project.title} screenshot`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className="github-project-lightbox-stage">
            <img
              src={imageSrc}
              alt={`${project.title} screenshot ${activeIndex + 1}`}
              className="github-project-lightbox-image"
            />
          </div>

          {showControls && (
            <button
              type="button"
              className="github-project-lightbox-nav github-project-lightbox-nav-right"
              onClick={onNext}
              aria-label={`Next ${project.title} screenshot`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GithubProjectLightbox
