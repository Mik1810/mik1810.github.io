import { afterEach, describe, expect, it, vi } from 'vitest'

import { signInAdmin } from '../../lib/db/repositories/adminAuthRepository.ts'

vi.mock('../../lib/config/env.ts', () => ({
  getSupabaseAuthConfig: () => ({
    supabaseUrl: 'https://example.supabase.co',
    supabaseSecretKey: 'test-secret',
  }),
}))

describe('adminAuthRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the authenticated admin user when Supabase auth succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
        },
      }),
    } as Response)

    await expect(signInAdmin('admin@example.com', 'secret')).resolves.toEqual({
      id: 'admin-id',
      email: 'admin@example.com',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/token?grant_type=password',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          apikey: 'test-secret',
          Authorization: 'Bearer test-secret',
        }),
      })
    )
  })

  it('maps Supabase auth error payloads into thrown errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        error_description: 'Invalid login credentials',
      }),
    } as Response)

    await expect(signInAdmin('admin@example.com', 'wrong')).rejects.toThrow(
      'Invalid login credentials'
    )
  })

  it('falls back to a generic auth error when the provider payload is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => null,
    } as Response)

    await expect(signInAdmin('admin@example.com', 'wrong')).rejects.toThrow(
      'Invalid login credentials'
    )
  })

  it('rejects successful responses that do not contain a valid admin user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: 'admin-id',
          email: null,
        },
      }),
    } as Response)

    await expect(signInAdmin('admin@example.com', 'secret')).rejects.toThrow(
      'Invalid user session'
    )
  })
})
