import { useEffect, useState } from 'react'
import '../css/ScrollProgress.css'

function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let rafId = 0

    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
      rafId = 0
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(updateProgress)
    }

    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div
        className="scroll-progress-bar"
        style={{
          transform: `scaleX(${Math.max(0, Math.min(progress, 100)) / 100})`,
        }}
      />
    </div>
  )
}

export default ScrollProgress
