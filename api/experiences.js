import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CACHE_TTL_MS = 60 * 1000;

const cache = new Map();

export default async function handler(req, res) {
  const lang = req.query?.lang === 'en' ? 'en' : 'it';
  const cacheKey = `experiences:${lang}`;

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(cached.value);
  }

  try {
    const [{ data: experiencesBase, error: experiencesError }, { data: experiencesI18n, error: experiencesI18nError }, { data: educationBase, error: educationError }, { data: educationI18n, error: educationI18nError }] = await Promise.all([
      supabaseAdmin
        .from('experiences')
        .select('id, order_index, logo, logo_bg')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('experiences_i18n')
        .select(
          'experience_id, role, company, period, description'
        )
        .eq('locale', lang),
      supabaseAdmin
        .from('education')
        .select('id, order_index, logo')
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('education_i18n')
        .select('education_id, degree, institution, period, description')
        .eq('locale', lang),
    ]);

    if (
      experiencesError ||
      experiencesI18nError ||
      educationError ||
      educationI18nError
    ) {
      console.error('Supabase error:', {
        experiencesError,
        experiencesI18nError,
        educationError,
        educationI18nError,
      });
      return res.status(500).json({
        error: 'Database error',
      });
    }

    const experienceTextById = new Map(
      (experiencesI18n || []).map((row) => [row.experience_id, row])
    );
    const educationTextById = new Map(
      (educationI18n || []).map((row) => [row.education_id, row])
    );

    const experiences = (experiencesBase || [])
      .map((row) => {
        const i18n = experienceTextById.get(row.id);
        if (!i18n) return null;
        return {
          id: row.id,
          order_index: row.order_index,
          logo: row.logo,
          logo_bg: row.logo_bg,
          role: i18n.role,
          company: i18n.company,
          period: i18n.period,
          description: i18n.description,
        };
      })
      .filter(Boolean);

    const education = (educationBase || [])
      .map((row) => {
        const i18n = educationTextById.get(row.id);
        if (!i18n) return null;
        return {
          id: row.id,
          order_index: row.order_index,
          logo: row.logo,
          degree: i18n.degree,
          institution: i18n.institution,
          period: i18n.period,
          description: i18n.description,
        };
      })
      .filter(Boolean);

    const payload = {
      experiences,
      education,
    };
    cache.set(cacheKey, { at: Date.now(), value: payload });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
