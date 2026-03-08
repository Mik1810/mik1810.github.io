import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;

let cachedExperiences = null;
let cachedAt = 0;

export default async function handler(req, res) {
  const startedAt = Date.now();

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const cacheAge = Date.now() - cachedAt;
  if (cachedExperiences && cacheAge < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cachedExperiences);
  }

  try {
    const dbStartedAt = Date.now();
    const { data, error } = await supabaseAdmin
      .from('experiences')
      .select('*')
      .order('order_index', { ascending: true });
    const dbMs = Date.now() - dbStartedAt;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database error',
      });
    }

    cachedExperiences = data;
    cachedAt = Date.now();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    console.log('Fetched experiences timing:', {
      dbMs,
      totalMs: Date.now() - startedAt,
      rows: data?.length ?? 0,
    });
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
