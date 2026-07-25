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
  // Class 1 Maths — content-based rename pass 2026-07-25.
  // Story-based AI-rephrased slugs replaced with descriptive topic
  // slugs. Voice: warm + topic for Class 1 age band.
  "class-1": {
    "maths": {
      "chapter-1-finding-the-furry-cat": "chapter-1-position-play",
      "chapter-2-what-is-long-what-is-round": "chapter-2-shape-fun",
      "chapter-3-mango-treat": "chapter-3-counting-to-9",
      "chapter-5-how-many": "chapter-5-counting-to-20",
      "chapter-6-vegetable-farm": "chapter-6-first-addition-and-subtraction",
      "chapter-7-linas-family": "chapter-7-numbers-in-daily-life",
      "chapter-8-fun-with-numbers": "chapter-8-place-value-beyond-10",
      "chapter-9-utsav": "chapter-9-festival-shapes-and-patterns",
      "chapter-10-how-do-i-spend-my-day": "chapter-10-parts-of-the-day",
      "chapter-11-how-many-times": "chapter-11-counting-in-groups",
      "chapter-12-how-much-can-we-spend": "chapter-12-money-coins-and-notes",
      "chapter-13-so-many-toys": "chapter-13-sorting-and-counting-groups",
    },
  },

  // Class 2 Maths — content-based rename pass 2026-07-25.
  "class-2": {
    "maths": {
      "chapter-1-a-day-at-the-beach": "chapter-1-counting-to-100",
      "chapter-2-shapes-around-us": "chapter-2-shapes-2d-and-3d",
      "chapter-3-fun-with-numbers": "chapter-3-place-value-to-200",
      "chapter-4-shadow-story": "chapter-4-patterns-around-us",
      "chapter-5-playing-with-lines": "chapter-5-lines-and-angles-play",
      "chapter-6-decoration-for-celebration": "chapter-6-addition-of-2-digit-numbers",
      "chapter-7-ranis-gift": "chapter-7-money-purchases-and-change",
      "chapter-8-grouping-and-sharing": "chapter-8-multiplication-and-division",
      "chapter-9-which-season-is-it": "chapter-9-time-and-calendar",
      "chapter-10-fun-at-the-fair": "chapter-10-measurement-length-weight-capacity",
    },
  },

  // Class 3 Maths + Science — content-based rename pass 2026-07-25.
  "class-3": {
    "maths": {
      "chapter-1-whats-in-a-name": "chapter-1-number-names-and-counting",
      "chapter-2-toy-joy": "chapter-2-compare-and-order-numbers",
      "chapter-3-double-century": "chapter-3-numbers-to-200",
      "chapter-4-vacation-with-my-nani-maa": "chapter-4-add-subtract-2-digit",
      "chapter-5-fun-with-shapes": "chapter-5-2d-shapes",
      "chapter-6-house-of-hundreds-i": "chapter-6-numbers-to-999",
      "chapter-7-raksha-bandhan": "chapter-7-introduction-to-multiplication",
      "chapter-8-fair-share": "chapter-8-introduction-to-division",
      "chapter-9-house-of-hundreds-ii": "chapter-9-add-subtract-3-digit",
      "chapter-10-fun-at-class-party": "chapter-10-measurement-length",
      "chapter-11-filling-and-lifting": "chapter-11-measurement-capacity-and-weight",
      "chapter-12-give-and-take": "chapter-12-money-in-daily-life",
      "chapter-13-time-goes-on": "chapter-13-time-clocks-and-calendar",
      "chapter-14-the-surajkund-fair": "chapter-14-symmetry-patterns-and-maps",
    },
    "science": {
      "chapter-2-going-to-the-mela": "chapter-2-community-and-cooperation",
      "chapter-6-living-in-harmony": "chapter-6-kindness-to-living-things",
      "chapter-10-this-world-of-things": "chapter-10-materials-around-us",
      "chapter-11-making-things": "chapter-11-how-things-are-made",
    },
  },

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
