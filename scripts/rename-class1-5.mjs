// ⚠️  STALE — DO NOT RUN.  Verified broken 2026-09-07.
//
// Rewrites `title:` frontmatter for Classes 1-5 from the hardcoded map below.
// Every path in that map is out of date: the content folders were renamed after
// this script was written, so every entry now hits `SKIP (not found)` and the
// script is a silent no-op.
//
//   expects  class-1/maths/chapter-1-finding-the-furry-cat
//   actual   class-1/maths/chapter-1-position-play
//
// Kept only as a record of the intended title wording. Repoint the map at real
// folder names, and confirm the titles are still wanted, before running it.
// See docs/STATUS.md.

import fs from 'fs';
import path from 'path';

const base = 'C:/Users/neera/Documents/Project/anjana-dalal-academy/content';

// Map: [class, subject, chapter-folder] => new title
const renames = {
  // === Class 1 Maths (13 chapters) ===
  'class-1/maths/chapter-1-finding-the-furry-cat': "Chapter 1 — Where Did the Furry Cat Go?",
  'class-1/maths/chapter-2-what-is-long-what-is-round': "Chapter 2 — Long Things and Round Things",
  'class-1/maths/chapter-3-mango-treat': "Chapter 3 — Sharing Mangoes",
  'class-1/maths/chapter-4-making-10': "Chapter 4 — Building the Number 10",
  'class-1/maths/chapter-5-how-many': "Chapter 5 — Let Us Count!",
  'class-1/maths/chapter-6-vegetable-farm': "Chapter 6 — A Trip to the Vegetable Garden",
  'class-1/maths/chapter-7-linas-family': "Chapter 7 — Lina's Family Get-Together",
  'class-1/maths/chapter-8-fun-with-numbers': "Chapter 8 — Playing with Numbers",
  'class-1/maths/chapter-9-utsav': "Chapter 9 — Festival Time!",
  'class-1/maths/chapter-10-how-do-i-spend-my-day': "Chapter 10 — My Daily Routine",
  'class-1/maths/chapter-11-how-many-times': "Chapter 11 — Counting How Often",
  'class-1/maths/chapter-12-how-much-can-we-spend': "Chapter 12 — Money and Spending",
  'class-1/maths/chapter-13-so-many-toys': "Chapter 13 — A World of Toys",

  // === Class 2 Maths (11 chapters) ===
  'class-2/maths/chapter-1-a-day-at-the-beach': "Chapter 1 — Counting at the Seaside",
  'class-2/maths/chapter-2-shapes-around-us': "Chapter 2 — Spotting Shapes Everywhere",
  'class-2/maths/chapter-3-fun-with-numbers': "Chapter 3 — Adventures with Numbers",
  'class-2/maths/chapter-4-shadow-story': "Chapter 4 — The World of Shadows",
  'class-2/maths/chapter-5-playing-with-lines': "Chapter 5 — Lines All Around",
  'class-2/maths/chapter-6-decoration-for-celebration': "Chapter 6 — Decorating for a Party!",
  'class-2/maths/chapter-7-ranis-gift': "Chapter 7 — A Special Gift for Rani",
  'class-2/maths/chapter-8-grouping-and-sharing': "Chapter 8 — Making Groups and Sharing Equally",
  'class-2/maths/chapter-9-which-season-is-it': "Chapter 9 — Seasons of the Year",
  'class-2/maths/chapter-10-fun-at-the-fair': "Chapter 10 — A Day at the Village Fair",
  'class-2/maths/chapter-11-data-handling': "Chapter 11 — Collecting and Organising Information",

  // === Class 3 Maths (14 chapters) ===
  'class-3/maths/chapter-1-whats-in-a-name': "Chapter 1 — The Story Behind Names",
  'class-3/maths/chapter-2-toy-joy': "Chapter 2 — Joy of Counting Toys",
  'class-3/maths/chapter-3-double-century': "Chapter 3 — Reaching Two Hundred!",
  'class-3/maths/chapter-4-vacation-with-my-nani-maa': "Chapter 4 — Holiday Fun at Nani's House",
  'class-3/maths/chapter-5-fun-with-shapes': "Chapter 5 — Exploring Shapes and Figures",
  'class-3/maths/chapter-6-house-of-hundreds-i': "Chapter 6 — Journey into Hundreds — Part I",
  'class-3/maths/chapter-7-raksha-bandhan': "Chapter 7 — Celebrating Raksha Bandhan with Maths",
  'class-3/maths/chapter-8-fair-share': "Chapter 8 — Sharing Things Equally",
  'class-3/maths/chapter-9-house-of-hundreds-ii': "Chapter 9 — Journey into Hundreds — Part II",
  'class-3/maths/chapter-10-fun-at-class-party': "Chapter 10 — Planning a Class Party!",
  'class-3/maths/chapter-11-filling-and-lifting': "Chapter 11 — Measuring by Filling and Lifting",
  'class-3/maths/chapter-12-give-and-take': "Chapter 12 — Adding and Subtracting in Daily Life",
  'class-3/maths/chapter-13-time-goes-on': "Chapter 13 — Tracking Time",
  'class-3/maths/chapter-14-the-surajkund-fair': "Chapter 14 — A Visit to the Surajkund Mela",

  // === Class 3 Science (12 chapters) ===
  'class-3/science/chapter-1-family-and-friends': "Chapter 1 — Our Families and Friendships",
  'class-3/science/chapter-2-going-to-the-mela': "Chapter 2 — A Trip to the Mela",
  'class-3/science/chapter-3-celebrating-festivals': "Chapter 3 — Joy of Festivals",
  'class-3/science/chapter-4-getting-to-know-plants': "Chapter 4 — Discovering the World of Plants",
  'class-3/science/chapter-5-plants-and-animals-live-together': "Chapter 5 — How Plants and Animals Share Their Home",
  'class-3/science/chapter-6-living-in-harmony': "Chapter 6 — Together in Nature's Balance",
  'class-3/science/chapter-7-water-a-precious-gift': "Chapter 7 — Water — Nature's Greatest Gift",
  'class-3/science/chapter-8-food-we-eat': "Chapter 8 — What's on Our Plate?",
  'class-3/science/chapter-9-staying-healthy-and-happy': "Chapter 9 — Healthy Habits for a Happy Life",
  'class-3/science/chapter-10-this-world-of-things': "Chapter 10 — Materials Around Us",
  'class-3/science/chapter-11-making-things': "Chapter 11 — How We Make Things",
  'class-3/science/chapter-12-taking-charge-of-waste': "Chapter 12 — Managing Our Waste",

  // === Class 4 Maths (14 chapters) ===
  'class-4/maths/chapter-1-shapes-around-us': "Chapter 1 — Discovering Shapes in Our World",
  'class-4/maths/chapter-2-hide-and-seek': "Chapter 2 — The Number Hide and Seek Game",
  'class-4/maths/chapter-3-pattern-around-us': "Chapter 3 — Spotting Patterns Everywhere",
  'class-4/maths/chapter-4-thousands-around-us': "Chapter 4 — Exploring the World of Thousands",
  'class-4/maths/chapter-5-sharing-and-measuring': "Chapter 5 — Dividing and Measuring Quantities",
  'class-4/maths/chapter-6-measuring-length': "Chapter 6 — How Long Is It?",
  'class-4/maths/chapter-7-the-cleanest-village': "Chapter 7 — Maths in the Cleanest Village",
  'class-4/maths/chapter-8-weigh-it-pour-it': "Chapter 8 — Weighing and Pouring",
  'class-4/maths/chapter-9-equal-groups': "Chapter 9 — Making Equal Groups",
  'class-4/maths/chapter-10-elephants-tigers-and-leopards': "Chapter 10 — Counting Wildlife — Elephants, Tigers, and Leopards",
  'class-4/maths/chapter-11-fun-with-symmetry': "Chapter 11 — Mirror Images and Symmetry",
  'class-4/maths/chapter-12-ticking-clocks-and-turning-calendar': "Chapter 12 — Reading Clocks and Calendars",
  'class-4/maths/chapter-13-the-transport-museum': "Chapter 13 — A Visit to the Transport Museum",
  'class-4/maths/chapter-14-data-handling': "Chapter 14 — Organising and Reading Data",

  // === Class 4 Science (9 remaining — Ch 3 already renamed) ===
  'class-4/science/chapter-1-living-together': "Chapter 1 — Life in Our Community",
  'class-4/science/chapter-2-exploring-our-neighbourhood': "Chapter 2 — A Walk Through Our Neighbourhood",
  'class-4/science/chapter-4-growing-up-with-nature': "Chapter 4 — Learning and Growing with Nature",
  'class-4/science/chapter-5-food-for-health': "Chapter 5 — Eating Right for Good Health",
  'class-4/science/chapter-6-happy-and-healthy-living': "Chapter 6 — Living a Healthy and Joyful Life",
  'class-4/science/chapter-7-how-things-work': "Chapter 7 — Understanding How Things Work",
  'class-4/science/chapter-8-how-things-are-made': "Chapter 8 — From Raw Materials to Finished Products",
  'class-4/science/chapter-9-different-lands-different-lives': "Chapter 9 — Many Lands, Many Ways of Life",
  'class-4/science/chapter-10-our-sky': "Chapter 10 — Wonders of the Sky",

  // === Class 5 Maths (remaining identical ones) ===
  'class-5/maths/chapter-1-we-the-travellers-i': "Chapter 1 — Our Travel Adventures — Part I",
  'class-5/maths/chapter-4-we-the-travellers-ii': "Chapter 4 — Our Travel Adventures — Part II",
  'class-5/maths/chapter-6-the-dairy-farm': "Chapter 6 — Life at the Dairy Farm",
  'class-5/maths/chapter-9-coconut-farm': "Chapter 9 — Maths at the Coconut Farm",
  'class-5/maths/chapter-11-grandmothers-quilt': "Chapter 11 — Patterns in Grandmother's Quilt",
  'class-5/maths/chapter-12-racing-seconds': "Chapter 12 — Chasing Time — Racing Seconds",
  'class-5/maths/chapter-13-animal-jumps': "Chapter 13 — Measuring Animal Jumps",

  // === Class 5 Science (remaining identical ones) ===
  'class-5/science/chapter-1-water-the-essence-of-life': "Chapter 1 — Why Water is the Source of Life",
  'class-5/science/chapter-2-journey-of-a-river': "Chapter 2 — Following a River's Path",
  'class-5/science/chapter-3-the-mystery-of-food': "Chapter 3 — Unlocking the Secrets of Food",
  'class-5/science/chapter-4-our-school-a-happy-place': "Chapter 4 — Making School a Joyful Place",
  'class-5/science/chapter-5-our-vibrant-country': "Chapter 5 — Discovering India's Vibrant Diversity",
  'class-5/science/chapter-6-some-unique-places': "Chapter 6 — Exploring Unique Places",
  'class-5/science/chapter-9-rhythms-of-nature': "Chapter 9 — Understanding Nature's Rhythms",
  'class-5/science/chapter-10-earth-our-shared-home': "Chapter 10 — Caring for Our Shared Planet",
};

let changed = 0;
let errors = 0;

for (const [relPath, newTitle] of Object.entries(renames)) {
  const indexPath = path.join(base, relPath, 'index.mdx');
  if (!fs.existsSync(indexPath)) {
    console.log(`SKIP (not found): ${indexPath}`);
    errors++;
    continue;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  const oldMatch = content.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  if (!oldMatch) {
    console.log(`SKIP (no title): ${relPath}`);
    errors++;
    continue;
  }

  const oldTitle = oldMatch[0];
  const newTitleLine = `title: "${newTitle}"`;

  if (oldTitle === newTitleLine) {
    console.log(`SKIP (already renamed): ${relPath}`);
    continue;
  }

  content = content.replace(oldMatch[0], newTitleLine);
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log(`RENAMED: ${oldMatch[1]}  →  ${newTitle}`);
  changed++;
}

console.log(`\nDone! Renamed ${changed} chapters. Errors: ${errors}`);
