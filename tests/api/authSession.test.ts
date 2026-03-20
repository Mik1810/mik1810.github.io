import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  parseCookies,
  verifySessionToken,
} from '../../lib/authSession.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Auth session utilities', () => {
  it('parses cookies into a key-value map', () => {
    expect(parseCookies('foo=bar; theme=dark; admin_session=token123')).toEqual({
      foo: 'bar',
      theme: 'dark',
      admin_session: 'token123',
    })
  })

  it('creates and verifies a signed session token', () => {
    const token = createSessionToken({
      id: 'user_1',
      email: 'user@example.com',
    })

    expect(verifySessionToken(token)).toEqual(
      expect.objectContaining({
        sub: 'user_1',
        email: 'user@example.com',
      })
    )
  })

  it('extracts the session from the request cookie header', () => {
    const token = createSessionToken({
      id: 'user_2',
      email: 'user2@example.com',
    })

    const session = getSessionFromRequest({
      headers: {
        cookie: createSessionCookie(token),
      },
    })

    expect(session).toEqual(
      expect.objectContaining({
        sub: 'user_2',
        email: 'user2@example.com',
      })
    )
  })

  it('rejects tampered tokens', () => {
    const token = createSessionToken({
      id: 'user_3',
      email: 'user3@example.com',
    })

    const tamperedToken = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`

    expect(verifySessionToken(tamperedToken)).toBeNull()
  })

  it('rejects expired tokens', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    const token = createSessionToken({
      id: 'user_4',
      email: 'user4@example.com',
    })

    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000 + 8 * 24 * 60 * 60 * 1000)

    expect(verifySessionToken(token)).toBeNull()
  })
})
