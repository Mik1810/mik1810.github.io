import { clearSessionCookie } from '../../lib/authSession.js';
import { requireAdminSession } from '../../lib/requireAdminSession.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = requireAdminSession(req, res);
  if (!admin) return;

  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ ok: true });
}
