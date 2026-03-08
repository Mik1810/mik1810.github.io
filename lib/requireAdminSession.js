import { getSessionFromRequest } from './authSession.js';

export function requireAdminSession(req, res) {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return { id: session.sub, email: session.email };
}
