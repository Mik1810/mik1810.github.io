import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `about:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [{ data: baseRows, error: baseError }, { data: i18nRows, error: i18nError }] =
      await Promise.all([
        supabaseAdmin
          .from('about_interests')
          .select('id, order_index')
          .order('order_index', { ascending: true }),
        supabaseAdmin
          .from('about_interests_i18n')
          .select('about_interest_id, interest')
          .eq('locale', lang),
      ]);

    if (baseError || i18nError) {
      console.error('Supabase error:', { baseError, i18nError });
      return res.status(500).json({ error: 'Database error' });
    }

    const labelById = new Map(
      (i18nRows || []).map((row) => [row.about_interest_id, row.interest])
    );
    const payload = {
      interests: (baseRows || [])
        .map((row) => labelById.get(row.id))
        .filter(Boolean),
    };

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
