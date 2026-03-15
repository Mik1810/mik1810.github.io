type WarmPriority = 'high' | 'low' | 'auto'

const warmedImages = new Map<string, Promise<void>>()

function setImagePriority(image: HTMLImageElement, priority: WarmPriority) {
  try {
    ;(image as HTMLImageElement & { fetchPriority?: WarmPriority }).fetchPriority =
      priority
  } catch {
    image.setAttribute('fetchpriority', priority)
  }
}

export function warmImage(src: string, priority: WarmPriority = 'auto') {
  if (!src || typeof window === 'undefined') {
    return Promise.resolve()
  }

  const existing = warmedImages.get(src)
  if (existing) return existing

  const image = new window.Image()
  image.decoding = 'async'
  setImagePriority(image, priority)

  const promise = new Promise<void>((resolve) => {
    const finish = () => resolve()

    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().catch(() => undefined).finally(finish)
        return
      }

      finish()
    }

    image.onerror = finish
    image.src = src

    if (image.complete) {
      image.onload?.(new Event('load'))
    }
  })

  warmedImages.set(src, promise)
  return promise
}

export function warmImageBatch(
  sources: string[],
  priority: WarmPriority = 'low'
) {
  return Promise.all(
    Array.from(new Set(sources.filter(Boolean))).map((src) => warmImage(src, priority))
  )
}

export function scheduleWarmImageBatch(
  sources: string[],
  priority: WarmPriority = 'low'
) {
  if (typeof window === 'undefined') return

  const run = () => {
    void warmImageBatch(sources, priority)
  }

  if ('requestIdleCallback' in window) {
    ;(
      window as Window & {
        requestIdleCallback?: (callback: IdleRequestCallback) => number
      }
    ).requestIdleCallback?.(() => run())
    return
  }

  setTimeout(run, 120)
}
