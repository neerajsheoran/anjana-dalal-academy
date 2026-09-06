// Canonical public origin for the site. Single source of truth for anything
// that needs an absolute URL: Open Graph tags, sitemap.xml, robots.txt, and
// email links.
//
// Set NEXT_PUBLIC_SITE_URL in Vercel to override per-environment (e.g. a
// preview deployment). Falls back to the production domain so local builds
// and previews still emit valid absolute URLs rather than crashing.
//
// Trailing slash is stripped so callers can safely do `${SITE_URL}/path`.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://cognilift.in'
).replace(/\/+$/, '');
