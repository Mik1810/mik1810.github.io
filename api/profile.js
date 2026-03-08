import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `profile:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [
      { data: profileRow, error: profileError },
      { data: profileI18nRows, error: profileI18nError },
      { data: socialRows, error: socialError },
      { data: roleBaseRows, error: roleBaseError },
      { data: roleI18nRows, error: roleI18nError },
    ] = await Promise.all([
      supabaseAdmin
        .from('profile')
        .select('id, full_name, photo_url, email, cv_url, university_logo_url')
        .eq('id', 1)
        .single(),
      supabaseAdmin
        .from('profile_i18n')
        .select('locale, greeting, location, university_name')
        .eq('profile_id', 1)
        .eq('locale', lang),
      supabaseAdmin
        .from('social_links')
        .select('order_index, name, url, icon_key')
        .eq('profile_id', 1)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('hero_roles')
        .select('id, order_index')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('hero_roles_i18n')
        .select('hero_role_id, role')
        .eq('locale', lang),
    ]);

    if (
      profileError ||
      profileI18nError ||
      socialError ||
      roleBaseError ||
      roleI18nError
    ) {
      console.error('Supabase error:', {
        profileError,
        profileI18nError,
        socialError,
        roleBaseError,
        roleI18nError,
      });
      return res.status(500).json({ error: 'Database error' });
    }

    const profileI18n = (profileI18nRows || [])[0] || {};
    const roleById = new Map((roleI18nRows || []).map((row) => [row.hero_role_id, row.role]));
    const roles = (roleBaseRows || [])
      .map((row) => roleById.get(row.id))
      .filter(Boolean);

    const payload = {
      name: profileRow?.full_name || '',
      photo: profileRow?.photo_url || '',
      email: profileRow?.email || '',
      cv: profileRow?.cv_url || '',
      greeting: profileI18n.greeting || '',
      location: profileI18n.location || '',
      university: {
        name: profileI18n.university_name || '',
        logo: profileRow?.university_logo_url || '',
      },
      roles,
      socials: (socialRows || []).map((row) => ({
        name: row.name,
        url: row.url,
        icon: row.icon_key,
      })),
    };

    cache.set(cacheKey, { at: Date.now(), value: payload });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
