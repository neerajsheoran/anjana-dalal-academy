import type { MetadataRoute } from 'next';
import { CLASSES } from '@/lib/content-static';
import { getAllChapters, getSubjectsForClass, chapterUrl } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

// Sitemap for organic discovery. The ~60 free chapters (order <= 2 in every
// subject of every class) are the main acquisition surface, so the chapter
// URLs matter more here than the marketing pages.
//
// IMPORTANT — canonical URL choice:
// The same chapter is reachable by two routes, /class/... and /subject/...
// Listing both would be duplicate content and split ranking signals between
// them. We list only what chapterUrl() returns (the class-first form), which
// is already the canonical shape used across the app.
//
// Auth-gated and internal routes are deliberately absent: /admin, /keystatic,
// /design, /dashboard, /profile, /family, /achievements, /advisor, /quiz.
// robots.ts blocks those separately.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // `as const` keeps changeFrequency as literal types — without it TypeScript
  // widens them to `string`, which MetadataRoute.Sitemap rejects.
  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: '/', changeFrequency: 'weekly', priority: 1 },
    { url: '/classes', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/subjects', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/brain', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/learn', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/kids', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/apply', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/support', changeFrequency: 'yearly', priority: 0.3 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { url: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  ] as const).map((r) => ({ ...r, url: `${SITE_URL}${r.url}`, lastModified: now }));

  // Class landing pages, and one page per (class, subject) that actually has
  // chapters — getSubjectsForClass already filters out empty combinations.
  const classRoutes: MetadataRoute.Sitemap = [];
  for (const cls of CLASSES) {
    const subjects = getSubjectsForClass(cls.id);
    if (subjects.length === 0) continue;

    classRoutes.push({
      url: `${SITE_URL}/class/${cls.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    for (const subject of subjects) {
      classRoutes.push({
        url: `${SITE_URL}/class/${cls.id}/${subject.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Every chapter. Free ones (order <= 2) are fully crawlable and get a higher
  // priority; the rest are still listed so they can rank, but they surface a
  // sign-up prompt rather than the full body.
  const chapterRoutes: MetadataRoute.Sitemap = getAllChapters().map((meta) => ({
    url: `${SITE_URL}${chapterUrl(meta)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: meta.order <= 2 ? 0.9 : 0.5,
  }));

  return [...staticRoutes, ...classRoutes, ...chapterRoutes];
}
