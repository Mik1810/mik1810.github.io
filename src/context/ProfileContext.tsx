import { useCallback, useEffect, useState } from 'react'

import type { ProfileData, ProviderProps } from '../types/app.js'
import { ProfileContext } from './profileContextValue'
import { useLanguage } from './useLanguage'

const PROFILE_REQUEST_TIMEOUT_MS = 15000
const PROFILE_RETRY_DELAY_MS = 250
const PROFILE_QUICK_ABORT_THRESHOLD_MS = 1200
const isDebugLoggingEnabled = import.meta.env.VITE_DEBUG_LOGS === 'true'

const areSocialListsEqual = (
  current: ProfileData['socials'],
  next: ProfileData['socials']
) => {
  if (current.length !== next.length) return false
  return current.every((item, index) => {
    const other = next[index]
    return (
      item?.name === other?.name &&
      item?.url === other?.url &&
      item?.icon === other?.icon
    )
  })
}

const areProfilesEqual = (current: ProfileData | null, next: ProfileData) => {
  if (!current) return false
  if (
    current.name !== next.name ||
    current.photo !== next.photo ||
    current.email !== next.email ||
    current.cv !== next.cv ||
    current.greeting !== next.greeting ||
    current.location !== next.location ||
    current.bio !== next.bio
  ) {
    return false
  }

  if (
    current.university.name !== next.university.name ||
    current.university.logo !== next.university.logo
  ) {
    return false
  }

  if (current.roles.length !== next.roles.length) return false
  if (!current.roles.every((role, index) => role === next.roles[index])) {
    return false
  }

  return areSocialListsEqual(current.socials, next.socials)
}

export function ProfileProvider({ children }: ProviderProps) {
  const { lang } = useLanguage()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLang, setProfileLang] = useState<typeof lang | null>(null)
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
      let profileLoaded = false
      if (isDebugLoggingEnabled) {
        console.info('[DEBUG] profile.bootstrap.start', {
          lang,
          endpoint: `/api/profile?lang=${lang}`,
        })
      }
      try {
        const runOnce = async () => {
          const startedAt = performance.now()
          const timeout = withTimeoutSignal(PROFILE_REQUEST_TIMEOUT_MS)
          try {
            const response = await fetch(`/api/profile?lang=${lang}`, {
              signal: timeout.signal,
              cache: 'no-store',
            })
            const data = (await response.json()) as ProfileData
            return {
              ok: response.ok,
              data: response.ok ? data : null,
              aborted: false,
              elapsedMs: performance.now() - startedAt,
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              if (controller.signal.aborted) throw error
              return {
                ok: false,
                data: null,
                aborted: true,
                elapsedMs: performance.now() - startedAt,
              }
            }
            return {
              ok: false,
              data: null,
              aborted: false,
              elapsedMs: performance.now() - startedAt,
            }
          } finally {
            timeout.cleanup()
          }
        }

        let attempt = await runOnce()
        const shouldRetryQuickAbort =
          attempt.aborted &&
          (attempt.elapsedMs ?? PROFILE_REQUEST_TIMEOUT_MS) <
            PROFILE_QUICK_ABORT_THRESHOLD_MS

        if (
          !attempt.ok &&
          (!attempt.aborted || shouldRetryQuickAbort) &&
          !controller.signal.aborted
        ) {
          await new Promise((resolve) => setTimeout(resolve, PROFILE_RETRY_DELAY_MS))
          if (!controller.signal.aborted) {
            attempt = await runOnce()
          }
        }

        if (!controller.signal.aborted && attempt.ok && attempt.data) {
          setProfile((current) =>
            areProfilesEqual(current, attempt.data as ProfileData)
              ? current
              : (attempt.data as ProfileData)
          )
          setProfileLang(lang)
          profileLoaded = true
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          // Keep previous profile snapshot on transient failures.
        }
      }
      setLoading(false)
      if (isDebugLoggingEnabled) {
        console.info('[DEBUG] profile.bootstrap.end', {
          lang,
          profileLoaded,
        })
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [lang, reloadKey])

  return (
    <ProfileContext.Provider
      value={{ profile, loading, profileLang, refreshProfile }}
    >
      {children}
    </ProfileContext.Provider>
  )
}
