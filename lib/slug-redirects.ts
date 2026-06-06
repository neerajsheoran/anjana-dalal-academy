// Slug redirect map — covers content updates that change chapter slugs.
//
// When NCERT (or any other source) releases a new edition of a textbook,
// our chapter slugs change because we re-name chapters based on the new
// content. Old bookmarks, search-engine links, and quiz-history clicks
// would 404 without redirects.
//
// Convention:
//   keyed by classId → subjectId → oldSlug → newSlug
//
// Behaviour:
//   - The chapter route checks this map BEFORE calling notFound()
//   - A matching entry triggers a 301 (permanent) redirect to the new URL
//   - Once a redirect is added, leave it forever — it costs nothing to
//     keep and silently helps any caller landing on the old URL
//
// Adding a new redirect entry takes ~10 seconds: just paste the old
// slug → new slug pair into the right class/subject block.

export interface SlugRedirectMap {
  [classId: string]: {
    [subjectId: string]: {
      [oldSlug: string]: string;
    };
  };
}

export const SLUG_REDIRECTS: SlugRedirectMap = {
  // Class 9 Science — NCERT new edition 2026-06.
  // Old book had 12 chapters; new book has 13 with reorganised topics.
  // Where the old topic doesn't map 1:1 to a new chapter, the closest
  // parent-topic chapter is chosen so the kid lands somewhere useful.
  "class-9": {
    "science": {
      "chapter-1-matter-in-our-surroundings":
        "chapter-9-atoms-joining-together", // matter / physical states topic
      "chapter-2-is-matter-around-us-pure":
        "chapter-5-mixtures-and-how-we-separate-them",
      "chapter-3-atoms-and-molecules":
        "chapter-9-atoms-joining-together",
      "chapter-4-structure-of-the-atom":
        "chapter-8-a-journey-inside-the-atom",
      "chapter-5-the-fundamental-unit-of-life":
        "chapter-2-inside-the-cell",
      "chapter-6-tissues":
        "chapter-3-tissues-when-cells-work-as-a-team",
      "chapter-7-motion":
        "chapter-4-describing-motion-around-us",
      "chapter-8-force-and-laws-of-motion":
        "chapter-6-forces-what-makes-things-move-and-stop",
      // Old Ch 9 Gravitation no longer exists in the new book at this
      // level. Redirect to the closest parent topic (Forces).
      "chapter-9-gravitation":
        "chapter-6-forces-what-makes-things-move-and-stop",
      "chapter-10-work-and-energy":
        "chapter-7-work-energy-and-simple-machines",
      "chapter-11-sound":
        "chapter-10-sound-how-it-travels",
      // Old Ch 12 (Food resources) is dropped in the new book. Redirect
      // to the new Diversity & Classification chapter as the closest
      // related landing point.
      "chapter-12-improvement-in-food-resources":
        "chapter-12-the-living-world",
    },
  },
};

export function findRedirect(
  classId: string,
  subjectId: string,
  oldSlug: string,
): string | undefined {
  return SLUG_REDIRECTS[classId]?.[subjectId]?.[oldSlug];
}
