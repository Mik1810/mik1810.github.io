import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AuthContext } from './authContextValue'
import type { AuthUser, ProviderProps } from '../types/app.js'

const ADMIN_AUTH_REQUEST_TIMEOUT_MS = 15000

const withRequestTimeout = (timeoutMs: number) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  return {
    controller,
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  }
}

export function AuthProvider({ children }: ProviderProps) {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const sessionRequestIdRef = useRef(0)
  const sessionAbortControllerRef = useRef<AbortController | null>(null)

  const refreshSession = useCallback(async () => {
    const requestId = ++sessionRequestIdRef.current
    sessionAbortControllerRef.current?.abort()
    const timeout = withRequestTimeout(ADMIN_AUTH_REQUEST_TIMEOUT_MS)
    sessionAbortControllerRef.current = timeout.controller

    try {
      const response = await fetch('/api/admin/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: timeout.signal,
      })
      const data = (await response.json()) as {
        authenticated?: boolean
        user?: AuthUser | null
      }
      const isAuthenticated = Boolean(response.ok && data?.authenticated)
      if (requestId !== sessionRequestIdRef.current) {
        return isAuthenticated
      }
      setAuthenticated(isAuthenticated)
      setUser(isAuthenticated ? data.user || null : null)
      return isAuthenticated
    } catch {
      if (requestId !== sessionRequestIdRef.current) {
        return false
      }
      setAuthenticated(false)
      setUser(null)
      return false
    } finally {
      timeout.cleanup()
      if (sessionAbortControllerRef.current === timeout.controller) {
        sessionAbortControllerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const pathname = window.location.pathname
    const isAdminSurface =
      pathname === '/login' ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/')

    if (!isAdminSurface) {
      setAuthLoading(false)
      setAuthenticated(false)
      setUser(null)
      return
    }

    const bootstrap = async () => {
      setAuthLoading(true)
      await refreshSession()
      setAuthLoading(false)
    }
    void bootstrap()
  }, [refreshSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const timeout = withRequestTimeout(ADMIN_AUTH_REQUEST_TIMEOUT_MS)
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: timeout.signal,
        })

        const data = (await response.json()) as { error?: string; user?: AuthUser | null }
        if (!response.ok) {
          return {
            ok: false,
            error: data?.error || 'Login fallito',
          }
        }

        setAuthenticated(true)
        setUser(data?.user || null)
        setAuthLoading(false)
        void refreshSession()
        return { ok: true }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return {
            ok: false,
            error: 'Timeout login: il server non ha risposto in tempo',
          }
        }
        return {
          ok: false,
          error: 'Errore di rete durante il login',
        }
      } finally {
        timeout.cleanup()
      }
    },
    [refreshSession]
  )

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setAuthenticated(false)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      authLoading,
      authenticated,
      user,
      login,
      logout,
      refreshSession,
    }),
    [authLoading, authenticated, user, login, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
