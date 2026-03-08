import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const toCamelLeaf = (key) =>
  key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const setNested = (obj, path, value) => {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!cur[part] || typeof cur[part] !== 'object') cur[part] = {};
    cur = cur[part];
  }
  cur[toCamelLeaf(parts[parts.length - 1])] = value;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `ui:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [{ data: uiRows, error: uiError }, { data: navBaseRows, error: navBaseError }, { data: navI18nRows, error: navI18nError }] =
      await Promise.all([
        supabaseAdmin.from('ui_texts').select('key, value').eq('locale', lang),
        supabaseAdmin.from('nav_links').select('id, href, order_index'),
        supabaseAdmin
          .from('nav_links_i18n')
          .select('nav_link_id, label')
          .eq('locale', lang),
      ]);

    if (uiError || navBaseError || navI18nError) {
      console.error('Supabase error:', { uiError, navBaseError, navI18nError });
      return res.status(500).json({ error: 'Database error' });
    }

    const payload = {};
    for (const row of uiRows || []) {
      setNested(payload, row.key, row.value);
    }

    payload.nav = payload.nav || {};
    const labelById = new Map((navI18nRows || []).map((r) => [r.nav_link_id, r.label]));
    const navRows = (navBaseRows || [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((base) => ({ href: base.href, label: labelById.get(base.id) }));

    for (const row of navRows) {
      const href = row.href;
      if (href === '#hero') payload.nav.home = row.label;
      else if (href === '#about') payload.nav.about = row.label;
      else if (href === '#projects') payload.nav.projects = row.label;
      else if (href === '#experience') payload.nav.experience = row.label;
      else if (href === '#skills') payload.nav.skills = row.label;
      else if (href === '#contact') payload.nav.contact = row.label;
    }

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
