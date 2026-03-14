import { supabaseAdmin } from '../../lib/supabaseAdmin.js'
import { createSessionCookie, createSessionToken } from '../../lib/authSession.js'
import type { ApiHandler, ApiRequest } from '../../lib/types/http.js'
import type { SessionUser } from '../../lib/types/auth.js'

interface LoginBody {
  email?: string
  password?: string
}

const handler: ApiHandler<LoginBody> = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = (req as ApiRequest<LoginBody>).body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password obbligatorie' })
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    const user: SessionUser | null = data?.user
      ? { id: data.user.id, email: data.user.email || '' }
      : null
    if (!user || !user.email) {
      return res.status(401).json({ error: 'Invalid user session' })
    }

    const token = createSessionToken(user)
    res.setHeader('Set-Cookie', createSessionCookie(token))

    return res.status(200).json({
      user,
    })
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
