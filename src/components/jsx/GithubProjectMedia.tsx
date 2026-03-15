import { useEffect, useState } from 'react'

import type {
  GithubProjectItem,
  GithubProjectMediaCarouselProps,
} from '../../types/app.js'
import '../css/GithubProjectMedia.css'
import GithubProjectLightbox from './GithubProjectLightbox'

function GithubProjectMediaCarousel({
  project,
  images,
  loopedImages,
  onOpenPreview,
  previewCtaLabel,
  expandHintLabel,
  emptyMediaLabel,
}: GithubProjectMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(images.length > 1 ? 1 : 0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)

  useEffect(() => {
    if (images.length <= 1) return undefined

    const frameId = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [images.length, project.slug])

  useEffect(() => {
    if (images.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      setIsTransitionEnabled(true)
      setCurrentIndex((prev) => {
        if (prev >= images.length) return images.length + 1
        if (prev < 1) return 1
        return prev + 1
      })
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [images.length])

  if (images.length === 0) {
    return (
      <div className="github-project-media github-project-fallback-static">
        <div className="github-project-fallback">
          <span>{project.title}</span>
          <small>{emptyMediaLabel}</small>
        </div>
      </div>
    )
  }

  const showControls = images.length > 1
  const activeDotIndex = showControls
    ? (currentIndex - 1 + images.length) % images.length
    : currentIndex

  const goPrev = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => {
      if (prev <= 1) return 0
      if (prev > images.length) return images.length
      return prev - 1
    })
  }

  const goNext = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => {
      if (prev >= images.length) return images.length + 1
      if (prev < 1) return 1
      return prev + 1
    })
  }

  const handleTrackTransitionEnd = () => {
    if (!showControls) return
    if (currentIndex <= 0) {
      setIsTransitionEnabled(false)
      setCurrentIndex(images.length)
      return
    }
    if (currentIndex >= images.length + 1) {
      setIsTransitionEnabled(false)
      setCurrentIndex(1)
    }
  }

  const activePreviewIndex = showControls
    ? (currentIndex - 1 + images.length) % images.length
    : 0

  return (
    <div
      className="github-project-media github-project-media-trigger"
      onClick={() => onOpenPreview(activePreviewIndex)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenPreview(activePreviewIndex)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${previewCtaLabel} ${project.title}`}
    >
      <div
        className="github-project-media-track"
        onTransitionEnd={handleTrackTransitionEnd}
        data-transition={isTransitionEnabled ? 'enabled' : 'disabled'}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {loopedImages.map((imageSrc, index) => (
          <div key={`${project.slug}-image-${index}`} className="github-project-media-slide">
            <img
              src={imageSrc}
              alt={`${project.title} screenshot ${((index - 1 + images.length) % images.length) + 1}`}
              loading="lazy"
              className="github-project-media-image"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
                const fallback =
                  event.currentTarget.parentElement?.parentElement
                    ?.nextElementSibling as HTMLElement | null
                if (fallback) fallback.hidden = false
              }}
            />
          </div>
        ))}
      </div>
      <div className="github-project-fallback" hidden>
        <span>{project.title}</span>
        <small>{emptyMediaLabel}</small>
      </div>
      <span className="github-project-media-hint">{expandHintLabel}</span>
      {showControls && (
        <>
          <button
            type="button"
            className="github-project-nav github-project-nav-left"
            onClick={(event) => {
              event.stopPropagation()
              goPrev()
            }}
            aria-label={`Previous ${project.title} screenshot`}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="github-project-nav github-project-nav-right"
            onClick={(event) => {
              event.stopPropagation()
              goNext()
            }}
            aria-label={`Next ${project.title} screenshot`}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="github-project-dots" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={`${project.slug}-dot-${index}`}
                className={index === activeDotIndex ? 'is-active' : ''}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GithubProjectMedia({
  project,
  previewCtaLabel,
  expandHintLabel,
  emptyMediaLabel,
}: {
  project: GithubProjectItem
  previewCtaLabel: string
  expandHintLabel: string
  emptyMediaLabel: string
}) {
  const images = Array.isArray(project.images) ? project.images : []
  const loopedImages =
    images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0)

  const openPreview = (index: number) => {
    if (images.length === 0) return
    setActiveLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const goPrev = () =>
    setActiveLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  const goNext = () =>
    setActiveLightboxIndex((prev) => (prev + 1) % images.length)

  return (
    <>
      <GithubProjectMediaCarousel
        key={`${project.slug}:${images.join('|')}`}
        project={project}
        images={images}
        loopedImages={loopedImages}
        onOpenPreview={openPreview}
        previewCtaLabel={previewCtaLabel}
        expandHintLabel={expandHintLabel}
        emptyMediaLabel={emptyMediaLabel}
      />
      {isLightboxOpen && images.length > 0 && (
        <GithubProjectLightbox
          project={project}
          images={images}
          activeIndex={activeLightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </>
  )
}

export default GithubProjectMedia
