import { useCallback, useEffect, useState } from 'react'

import type { ProfileData, ProviderProps } from '../types/app.js'
import { ProfileContext } from './profileContextValue'
import { useLanguage } from './useLanguage'

export function ProfileProvider({ children }: ProviderProps) {
  const { lang } = useLanguage()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const refreshProfile = useCallback(() => {
    setReloadKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const withTimeoutSignal = (timeoutMs: number) => {
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)
      const abortFromParent = () => timeoutController.abort()
      controller.signal.addEventListener('abort', abortFromParent)

      return {
        signal: timeoutController.signal,
        cleanup: () => {
          clearTimeout(timeoutId)
          controller.signal.removeEventListener('abort', abortFromParent)
        },
      }
    }

    const loadProfile = async () => {
      setLoading(true)
      const timeout = withTimeoutSignal(8000)
      try {
        const response = await fetch(`/api/profile?lang=${lang}`, {
          signal: timeout.signal,
          cache: 'no-store',
        })
        const data = (await response.json()) as ProfileData
        if (response.ok) {
          setProfile(data)
        } else {
          setProfile(null)
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setProfile(null)
        }
      } finally {
        timeout.cleanup()
      }
      setLoading(false)
    }

    void loadProfile()
    return () => controller.abort()
  }, [lang, reloadKey])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
