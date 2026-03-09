import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAdminSession } from '../../lib/requireAdminSession.js';
import { getAdminTableConfig } from '../../lib/adminTables.js';

function parseLimit(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return 200;
  return Math.min(Math.max(parsed, 1), 1000);
}

function normalizePayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function hasAllPrimaryKeys(config, keys) {
  return config.primaryKeys.every((key) => keys[key] !== undefined && keys[key] !== null);
}

function applyPrimaryKeys(query, keys) {
  let current = query;
  for (const [key, value] of Object.entries(keys)) {
    current = current.eq(key, value);
  }
  return current;
}

export default async function handler(req, res) {
  const admin = requireAdminSession(req, res);
  if (!admin) return undefined;

  const table = req.query?.table;
  if (!table || typeof table !== 'string') {
    return res.status(400).json({ error: 'Missing table parameter' });
  }

  const config = getAdminTableConfig(table);
  if (!config) {
    return res.status(400).json({ error: 'Table not allowed' });
  }

  try {
    if (req.method === 'GET') {
      const limit = parseLimit(req.query?.limit);
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(limit);
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' });
      }
      return res.status(200).json({ rows: data || [] });
    }

    if (req.method === 'POST') {
      const row = normalizePayload(req.body?.row);
      const { data, error } = await supabaseAdmin
        .from(table)
        .insert(row)
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' });
      }
      return res.status(201).json({ row: data || null });
    }

    if (req.method === 'PATCH') {
      const keys = normalizePayload(req.body?.keys);
      const row = normalizePayload(req.body?.row);
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' });
      }

      let query = supabaseAdmin.from(table).update(row);
      query = applyPrimaryKeys(query, keys);
      const { data, error } = await query.select('*').limit(1).maybeSingle();
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' });
      }
      return res.status(200).json({ row: data || null });
    }

    if (req.method === 'DELETE') {
      const keys = normalizePayload(req.body?.keys);
      if (!hasAllPrimaryKeys(config, keys)) {
        return res.status(400).json({ error: 'Missing primary key fields in keys payload' });
      }

      let query = supabaseAdmin.from(table).delete();
      query = applyPrimaryKeys(query, keys);
      const { error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message || 'Database error' });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
