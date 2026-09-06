import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Crawl rules. Content pages stay open — the free chapters are the organic
// acquisition surface — while anything internal, authenticated, or per-user
// is kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // no crawlable API surface
          '/admin',         // admin console
          '/keystatic',     // CMS
          '/design',        // internal design previews (palette, activities)
          '/advisor',       // partner-facing dashboards
          '/dashboard',     // per-user
          '/profile',       // per-user, PIN-gated
          '/family',        // per-user
          '/achievements',  // per-user
          '/quiz',          // session-scoped, no standalone value
          '/quiz-start',
          '/login',         // never useful in search results
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
