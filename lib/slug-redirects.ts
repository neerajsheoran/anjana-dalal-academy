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

  // Class 4 Maths + Science — content-based rename pass 2026-07-25.
  "class-4": {
    "maths": {
      "chapter-2-hide-and-seek": "chapter-2-number-puzzles-and-estimation",
      "chapter-4-thousands-around-us": "chapter-4-numbers-to-9999",
      "chapter-5-sharing-and-measuring": "chapter-5-introduction-to-fractions",
      "chapter-7-the-cleanest-village": "chapter-7-adding-subtracting-larger-numbers",
      "chapter-8-weigh-it-pour-it": "chapter-8-weight-and-capacity",
      "chapter-9-equal-groups": "chapter-9-multiplication-and-division-strategies",
      "chapter-10-elephants-tigers-and-leopards": "chapter-10-reading-data-tables-and-pictographs",
      "chapter-11-fun-with-symmetry": "chapter-11-symmetry-and-mirror-reflection",
      "chapter-12-ticking-clocks-and-turning-calendar": "chapter-12-time-and-calendar",
      "chapter-13-the-transport-museum": "chapter-13-multiplication-division-word-problems",
    },
    "science": {
      "chapter-1-living-together": "chapter-1-community-and-caring-for-nature",
      "chapter-3-the-amazing-world-of-plants": "chapter-3-diversity-of-plants",
      "chapter-4-growing-up-with-nature": "chapter-4-habitats-and-food-chains",
      "chapter-7-how-things-work": "chapter-7-forces-motion-and-patterns",
      "chapter-10-our-sky": "chapter-10-sun-moon-and-stars",
    },
  },

  // Class 5 Maths + Science — content-based rename pass 2026-07-25.
  "class-5": {
    "maths": {
      "chapter-1-we-the-travellers-i": "chapter-1-large-numbers-to-5-digits",
      "chapter-3-angles-as-turns": "chapter-3-angles-and-rotations",
      "chapter-4-we-the-travellers-ii": "chapter-4-large-numbers-to-lakhs",
      "chapter-5-far-and-near": "chapter-5-length-and-distance",
      "chapter-6-the-dairy-farm": "chapter-6-multiplication-division-larger-numbers",
      "chapter-9-coconut-farm": "chapter-9-multi-step-arithmetic",
      "chapter-10-symmetrical-designs": "chapter-10-symmetry-and-mirror-reflection",
      "chapter-11-grandmothers-quilt": "chapter-11-area-and-perimeter",
      "chapter-12-racing-seconds": "chapter-12-time-hours-minutes-seconds",
      "chapter-13-animal-jumps": "chapter-13-multiples-and-skip-counting",
      "chapter-15-data-through-pictures": "chapter-15-data-handling-graphs",
    },
    "science": {
      "chapter-1-water-the-essence-of-life": "chapter-1-water-cycle-and-conservation",
      "chapter-2-journey-of-a-river": "chapter-2-rivers-and-water-systems",
      "chapter-3-the-mystery-of-food": "chapter-3-food-spoilage-and-preservation",
      "chapter-4-our-school-a-happy-place": "chapter-4-green-schools-and-sustainability",
      "chapter-5-our-vibrant-country": "chapter-5-india-diversity-and-culture",
      "chapter-6-some-unique-places": "chapter-6-indias-ecological-regions",
      "chapter-7-energy-how-things-work": "chapter-7-forms-and-uses-of-energy",
      "chapter-8-clothes-how-things-are-made": "chapter-8-clothes-fabric-and-weaving",
      "chapter-9-rhythms-of-nature": "chapter-9-natural-cycles-day-night-seasons",
      "chapter-10-earth-our-shared-home": "chapter-10-earth-a-connected-planet",
    },
  },

  // Class 6 Maths + Science + Social Science — content-based rename pass 2026-07-25.
  "class-6": {
    "maths": {
      "chapter-3-number-play": "chapter-3-number-tricks-and-divisibility",
      "chapter-5-prime-time": "chapter-5-primes-factors-and-multiples",
      "chapter-8-playing-with-constructions": "chapter-8-geometric-constructions",
      "chapter-10-the-other-side-of-zero": "chapter-10-integers-and-negative-numbers",
    },
    "science": {
      "chapter-1-the-wonderful-world-of-science": "chapter-1-what-is-science",
      "chapter-3-mindful-eating-a-path-to-a-healthy-body": "chapter-3-nutrition-and-balanced-diet",
      "chapter-8-a-journey-through-states-of-water": "chapter-8-states-of-water",
      "chapter-10-living-creatures-exploring-their-characteristics": "chapter-10-characteristics-of-living-things",
      "chapter-11-natures-treasures": "chapter-11-natural-resources",
      "chapter-12-beyond-earth": "chapter-12-solar-system-and-universe",
    },
    "social-science": {
      "chapter-1-finding-our-place-on-earth": "chapter-1-maps-latitudes-and-longitudes",
      "chapter-3-landforms-mountains-to-plains": "chapter-3-landforms-of-earth",
      "chapter-4-reading-the-past": "chapter-4-studying-history-sources-and-timelines",
      "chapter-5-the-land-we-call-india": "chapter-5-names-and-identity-of-india",
      "chapter-6-where-it-all-began": "chapter-6-indus-valley-civilisation",
      "chapter-7-roots-of-our-culture": "chapter-7-vedic-traditions-and-early-religions",
      "chapter-8-one-country-many-cultures": "chapter-8-diversity-and-unity-of-india",
      "chapter-9-living-together": "chapter-9-family-and-community",
      "chapter-10-how-we-govern-ourselves": "chapter-10-government-and-democracy",
      "chapter-11-village-government": "chapter-11-panchayati-raj",
      "chapter-13-why-work-matters": "chapter-13-kinds-of-work",
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
