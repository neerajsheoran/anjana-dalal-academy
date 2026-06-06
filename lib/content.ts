// Content registry — auto-discovers chapters from the filesystem.
// To add a new chapter: create content/[classId]/[subject]/[chapterId]/index.mdx
// with frontmatter (title, description, order). No code changes needed.
//
// SERVER-ONLY — uses fs/path. For client components, use lib/content-static.ts.

import fs from "fs";
import path from "path";
import { ClassInfo, SubjectInfo, ClassId, SubjectId, ChapterMeta } from "./types";
import { CLASSES, SUBJECTS } from "./content-static";

// Re-export static data so existing server imports keep working
export { CLASSES, SUBJECTS };

// Parse YAML frontmatter from MDX content
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[key] = value;
    }
  }
  return fm;
}

// Read one chapter directory and return its ChapterMeta, or null if no
// index.mdx is present. `book` is set when the chapter lives inside a
// multi-book subject (e.g. class-10/social-science/history/chapter-1-...).
function readChapter(
  classId: ClassId,
  subject: SubjectId,
  book: string | undefined,
  chapterDir: string,
  slug: string,
): ChapterMeta | null {
  const indexPath = path.join(chapterDir, "index.mdx");
  if (!fs.existsSync(indexPath)) return null;

  const raw = fs.readFileSync(indexPath, "utf8");
  const fm = parseFrontmatter(raw);

  // Extract order from frontmatter or from slug (chapter-3-foo → 3)
  let order = parseInt(fm.order, 10);
  if (isNaN(order)) {
    const numMatch = slug.match(/^chapter-(\d+)/);
    order = numMatch ? parseInt(numMatch[1], 10) : 0;
  }

  // Title: from frontmatter, or prettify slug
  const title =
    fm.title ||
    slug
      .replace(/^chapter-\d+-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Count questions from worksheet.json if it exists
  let questionCount = 0;
  const worksheetPath = path.join(chapterDir, "worksheet.json");
  if (fs.existsSync(worksheetPath)) {
    try {
      const ws = JSON.parse(fs.readFileSync(worksheetPath, "utf8"));
      if (ws.topics && Array.isArray(ws.topics)) {
        for (const t of ws.topics) {
          questionCount +=
            (t.easy?.length || 0) + (t.medium?.length || 0) + (t.hard?.length || 0);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Optional: which volume of a multi-part textbook this chapter
  // came from. Frontmatter `part: 1` or `part: 2` triggers a small
  // pill badge ("P1" / "P2") on the chapter list page.
  let part: 1 | 2 | undefined;
  const partRaw = parseInt(fm.part, 10);
  if (partRaw === 1 || partRaw === 2) part = partRaw;

  // chapterKey: stable Firestore identifier. Fall back to slug with a
  // warning if missing (the backfill script handles existing chapters).
  const chapterKey = fm.chapterKey;
  if (!chapterKey) {
    const bookPart = book ? `${book}/` : "";
    console.warn(
      `[content] Chapter ${classId}/${subject}/${bookPart}${slug} has no chapterKey in frontmatter. Add one (UUID v4) — using slug as a temporary fallback.`,
    );
  }

  return {
    classId,
    subject,
    ...(book ? { book } : {}),
    chapterId: slug,
    chapterKey: chapterKey || slug,
    title,
    description: fm.description || "",
    order,
    questionCount: questionCount || undefined,
    ...(part ? { part } : {}),
  };
}

// Auto-discover chapters from filesystem at build time. Handles two
// structures per subject:
//   1. Flat:   content/[classId]/[subject]/chapter-N-.../
//   2. Nested: content/[classId]/[subject]/[bookId]/chapter-N-.../
// Detection rule: if an immediate child directory's name starts with
// "chapter-", the subject is flat. Otherwise that child is treated as
// a book and we walk one level deeper.
function discoverChapters(): ChapterMeta[] {
  const contentDir = path.join(process.cwd(), "content");
  const chapters: ChapterMeta[] = [];

  for (const cls of CLASSES) {
    for (const subj of SUBJECTS) {
      const subjectDir = path.join(contentDir, cls.id, subj.id);
      if (!fs.existsSync(subjectDir)) continue;

      const entries = fs.readdirSync(subjectDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        if (entry.name.startsWith("chapter-")) {
          // Flat: direct chapter under the subject
          const meta = readChapter(
            cls.id as ClassId,
            subj.id as SubjectId,
            undefined,
            path.join(subjectDir, entry.name),
            entry.name,
          );
          if (meta) chapters.push(meta);
        } else {
          // Nested: this is a book; walk its chapters
          const bookDir = path.join(subjectDir, entry.name);
          const inner = fs.readdirSync(bookDir, { withFileTypes: true });
          for (const ch of inner) {
            if (!ch.isDirectory()) continue;
            if (!ch.name.startsWith("chapter-")) continue;
            const meta = readChapter(
              cls.id as ClassId,
              subj.id as SubjectId,
              entry.name,
              path.join(bookDir, ch.name),
              ch.name,
            );
            if (meta) chapters.push(meta);
          }
        }
      }
    }
  }

  return chapters.sort((a, b) => {
    if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    if ((a.book ?? "") !== (b.book ?? "")) {
      return (a.book ?? "").localeCompare(b.book ?? "");
    }
    return a.order - b.order;
  });
}

// Cached chapters — discovered once per build
let _chapters: ChapterMeta[] | null = null;

export function getAllChapters(): ChapterMeta[] {
  if (!_chapters) {
    _chapters = discoverChapters();
  }
  return _chapters;
}

// Helper: get all chapters for a specific class + subject (across books
// if the subject is multi-book — useful for "subject overview" surfaces).
export function getChapters(classId: ClassId, subject: SubjectId): ChapterMeta[] {
  return getAllChapters()
    .filter((c) => c.classId === classId && c.subject === subject)
    .sort((a, b) => {
      if ((a.book ?? "") !== (b.book ?? "")) {
        return (a.book ?? "").localeCompare(b.book ?? "");
      }
      return a.order - b.order;
    });
}

// Helper: chapters in one book of a multi-book subject.
export function getChaptersInBook(
  classId: ClassId,
  subject: SubjectId,
  book: string,
): ChapterMeta[] {
  return getAllChapters()
    .filter((c) => c.classId === classId && c.subject === subject && c.book === book)
    .sort((a, b) => a.order - b.order);
}

// Helper: build the canonical public URL for a chapter. Handles both
// flat and nested-book structures so callers don't have to branch.
export function chapterUrl(meta: ChapterMeta): string {
  if (meta.book) {
    return `/class/${meta.classId}/${meta.subject}/${meta.book}/${meta.chapterId}`;
  }
  return `/class/${meta.classId}/${meta.subject}/${meta.chapterId}`;
}

// Helper: filesystem path for a chapter's content directory.
export function chapterContentPath(meta: ChapterMeta): string {
  if (meta.book) {
    return path.join(
      process.cwd(),
      "content",
      meta.classId,
      meta.subject,
      meta.book,
      meta.chapterId,
    );
  }
  return path.join(
    process.cwd(),
    "content",
    meta.classId,
    meta.subject,
    meta.chapterId,
  );
}

// Helper: get a single chapter by its (slug-based) ID. Used by the
// flat chapter route — fine because flat-subject slugs are unique. For
// the nested-book route, prefer getChapterInBook() which is precise.
export function getChapter(chapterId: string): ChapterMeta | undefined {
  return getAllChapters().find((c) => c.chapterId === chapterId);
}

// Helper: precise lookup inside a multi-book subject. Use this on the
// nested-book chapter route so we never resolve the wrong chapter when
// two books happen to share a slug.
export function getChapterInBook(
  classId: ClassId,
  subject: SubjectId,
  book: string,
  chapterId: string,
): ChapterMeta | undefined {
  return getAllChapters().find(
    (c) =>
      c.classId === classId &&
      c.subject === subject &&
      c.book === book &&
      c.chapterId === chapterId,
  );
}

// Helper: get a single chapter by its stable key. Use this when
// resolving references stored in Firestore (quiz attempts, progress,
// bookmarks). The key never changes even when the slug does.
export function getChapterByKey(chapterKey: string): ChapterMeta | undefined {
  if (!chapterKey) return undefined;
  return getAllChapters().find((c) => c.chapterKey === chapterKey);
}

// Helper: get subjects that have chapters for a given class
export function getSubjectsForClass(classId: ClassId): SubjectInfo[] {
  return SUBJECTS.filter((s) =>
    getAllChapters().some((c) => c.classId === classId && c.subject === s.id)
  );
}

// Helper: get classes that have chapters for a given subject
export function getClassesForSubject(subjectId: SubjectId): ClassInfo[] {
  return CLASSES.filter((cls) =>
    getAllChapters().some((c) => c.classId === cls.id && c.subject === subjectId)
  );
}

// Helper: get class label from ID
export function getClassLabel(classId: ClassId): string {
  return CLASSES.find((c) => c.id === classId)?.label ?? classId;
}

// Helper: get subject label from ID
export function getSubjectLabel(subjectId: SubjectId): string {
  return SUBJECTS.find((s) => s.id === subjectId)?.label ?? subjectId;
}
