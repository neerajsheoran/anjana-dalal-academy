// One-time backfill: add a stable chapterKey (UUID v4) to every chapter's
// frontmatter. This unblocks the content-key architecture where:
//   - URLs / slugs are cosmetic and can change when content updates
//   - chapterKey is the canonical identifier used by quiz attempts,
//     progress tracking, bookmarks, and any other reference
//
// The script is IDEMPOTENT — it only adds a chapterKey if one isn't
// already present. Safe to re-run any number of times. Will print a
// summary at the end.
//
// Run from project root:
//   npx tsx scripts/backfill-chapter-keys.ts
//
// Once every chapter has a chapterKey, the type can become required and
// lib/content.ts can expose the key on ChapterMeta. New chapters
// authored after this point should include a chapterKey from creation —
// either set manually with `crypto.randomUUID()` or via Keystatic field
// defaults (TODO: configure Keystatic to default the field).

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const CONTENT_DIR = path.join(process.cwd(), "content");

interface Stats {
  scanned: number;
  alreadyHadKey: number;
  added: number;
  skippedNoFrontmatter: number;
  failed: number;
}

const stats: Stats = {
  scanned: 0,
  alreadyHadKey: 0,
  added: 0,
  skippedNoFrontmatter: 0,
  failed: 0,
};

function walkMdxFiles(dir: string, results: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMdxFiles(full, results);
    } else if (entry.isFile() && entry.name === "index.mdx") {
      results.push(full);
    }
  }
  return results;
}

function backfillOne(filePath: string): void {
  stats.scanned++;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`  [read failed] ${filePath}:`, err);
    stats.failed++;
    return;
  }

  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!fmMatch) {
    console.warn(`  [no frontmatter] ${filePath}`);
    stats.skippedNoFrontmatter++;
    return;
  }

  const fmBlock = fmMatch[1];
  if (/^chapterKey\s*:/m.test(fmBlock)) {
    stats.alreadyHadKey++;
    return;
  }

  const newKey = randomUUID();
  // Insert chapterKey on a new line right after the `title:` line, falling
  // back to inserting at the top of the frontmatter block.
  let newFm: string;
  if (/^title\s*:/m.test(fmBlock)) {
    newFm = fmBlock.replace(
      /^(title\s*:.*)$/m,
      `$1\nchapterKey: "${newKey}"`,
    );
  } else {
    newFm = `chapterKey: "${newKey}"\n${fmBlock}`;
  }

  const before = fmMatch[0];
  const after = `---\n${newFm}\n---\n`;
  const newRaw = after + raw.slice(before.length);

  try {
    fs.writeFileSync(filePath, newRaw, "utf8");
    stats.added++;
  } catch (err) {
    console.error(`  [write failed] ${filePath}:`, err);
    stats.failed++;
  }
}

console.log(`Scanning ${CONTENT_DIR} for index.mdx files...`);
const files = walkMdxFiles(CONTENT_DIR);
console.log(`Found ${files.length} chapter files.\n`);

for (const f of files) {
  backfillOne(f);
}

console.log("\nBackfill summary:");
console.log(`  Files scanned         : ${stats.scanned}`);
console.log(`  Already had chapterKey: ${stats.alreadyHadKey}`);
console.log(`  Added chapterKey      : ${stats.added}`);
console.log(`  Skipped (no FM)       : ${stats.skippedNoFrontmatter}`);
console.log(`  Failed                : ${stats.failed}`);

if (stats.failed > 0) {
  process.exit(1);
}
