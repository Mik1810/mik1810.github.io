import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from './authContextValue'
import type { AuthUser, ProviderProps } from '../types/app.js'

export function AuthProvider({ children }: ProviderProps) {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const data = (await response.json()) as {
        authenticated?: boolean
        user?: AuthUser | null
      }
      const isAuthenticated = Boolean(response.ok && data?.authenticated)
      setAuthenticated(isAuthenticated)
      setUser(isAuthenticated ? data.user || null : null)
      return isAuthenticated
    } catch {
      setAuthenticated(false)
      setUser(null)
      return false
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      setAuthLoading(true)
      await refreshSession()
      setAuthLoading(false)
    }
    void bootstrap()
  }, [refreshSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        return {
          ok: false,
          error: data?.error || 'Login fallito',
        }
      }

      await refreshSession()
      return { ok: true }
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
