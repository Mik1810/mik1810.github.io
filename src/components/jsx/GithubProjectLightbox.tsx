import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { GithubProjectItem } from '../../types/app.js'
import { warmImage, warmImageBatch } from '../../utils/imageWarmup.js'
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
  const [hasImageError, setHasImageError] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const headingId = useId()
  const metaId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('github-project-lightbox-open')
    document.body.style.overflow = 'hidden'

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true })
    })

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
        return
      }
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        if (!focusableElements || focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const focusable = Array.from(focusableElements).filter(
          (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true'
        )

        if (focusable.length === 0) {
          event.preventDefault()
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
          return
        }

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('github-project-lightbox-open')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus({ preventScroll: true })
    }
  }, [onClose, onNext, onPrev, showControls])

  useEffect(() => {
    setHasImageError(false)
  }, [imageSrc])

  useEffect(() => {
    const probe = new window.Image()
    const applyLayoutMode = () => {
      const ratio =
        probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : 1
      setLayoutMode(ratio >= 1.6 ? 'wide' : 'tall')
    }

    probe.src = initialImageSrc

    if (probe.complete) {
      if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        applyLayoutMode()
      }
      return undefined
    }

    probe.addEventListener('load', applyLayoutMode)
    return () => {
      probe.removeEventListener('load', applyLayoutMode)
    }
  }, [initialImageSrc])

  useEffect(() => {
    void warmImage(imageSrc, 'high')

    if (!showControls) return

    const nextIndex = (activeIndex + 1) % images.length
    const prevIndex = (activeIndex - 1 + images.length) % images.length

    void warmImage(images[nextIndex] || '', 'high')
    void warmImage(images[prevIndex] || '', 'low')
    void warmImageBatch(images, 'low')
  }, [activeIndex, imageSrc, images, showControls])

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
        aria-labelledby={headingId}
        aria-describedby={metaId}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="github-project-lightbox-close"
          onClick={onClose}
          aria-label={`Close ${project.title} preview`}
          ref={closeButtonRef}
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
          <strong id={headingId}>{project.title}</strong>
          <span id={metaId}>
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
            {hasImageError ? (
              <div
                className="github-project-lightbox-fallback"
                role="status"
                aria-live="polite"
              >
                <strong>{project.title}</strong>
                <span>Screenshot unavailable</span>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={`${project.title} screenshot ${activeIndex + 1}`}
                className="github-project-lightbox-image"
                decoding="async"
                fetchPriority="high"
                onLoad={() => setHasImageError(false)}
                onError={() => setHasImageError(true)}
              />
            )}
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
