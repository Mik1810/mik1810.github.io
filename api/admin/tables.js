import { requireAdminSession } from '../../lib/requireAdminSession.js';
import { ADMIN_TABLES } from '../../lib/adminTables.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = requireAdminSession(req, res);
  if (!admin) return undefined;

  const tables = Object.entries(ADMIN_TABLES).map(([name, config]) => ({
    name,
    label: config.label,
    primaryKeys: config.primaryKeys,
    defaultRow: config.defaultRow || {},
  }));

  return res.status(200).json({ tables });
}
