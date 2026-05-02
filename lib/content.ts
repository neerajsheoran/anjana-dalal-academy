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

// Auto-discover chapters from filesystem at build time
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
        const indexPath = path.join(subjectDir, entry.name, "index.mdx");
        if (!fs.existsSync(indexPath)) continue;

        const raw = fs.readFileSync(indexPath, "utf8");
        const fm = parseFrontmatter(raw);

        // Extract order from frontmatter or from slug (chapter-3-foo → 3)
        let order = parseInt(fm.order, 10);
        if (isNaN(order)) {
          const numMatch = entry.name.match(/^chapter-(\d+)/);
          order = numMatch ? parseInt(numMatch[1], 10) : 0;
        }

        // Title: from frontmatter, or prettify slug
        const title = fm.title || entry.name
          .replace(/^chapter-\d+-/, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        // Count questions from worksheet.json if it exists
        let questionCount = 0;
        const worksheetPath = path.join(subjectDir, entry.name, "worksheet.json");
        if (fs.existsSync(worksheetPath)) {
          try {
            const ws = JSON.parse(fs.readFileSync(worksheetPath, "utf8"));
            if (ws.topics && Array.isArray(ws.topics)) {
              for (const t of ws.topics) {
                questionCount += (t.easy?.length || 0) + (t.medium?.length || 0) + (t.hard?.length || 0);
              }
            }
          } catch {
            // ignore parse errors
          }
        }

        chapters.push({
          classId: cls.id as ClassId,
          subject: subj.id as SubjectId,
          chapterId: entry.name,
          title,
          description: fm.description || "",
          order,
          questionCount: questionCount || undefined,
        });
      }
    }
  }

  return chapters.sort((a, b) => {
    if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
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

// Helper: get all chapters for a specific class + subject
export function getChapters(classId: ClassId, subject: SubjectId): ChapterMeta[] {
  return getAllChapters()
    .filter((c) => c.classId === classId && c.subject === subject)
    .sort((a, b) => a.order - b.order);
}

// Helper: get a single chapter by its ID
export function getChapter(chapterId: string): ChapterMeta | undefined {
  return getAllChapters().find((c) => c.chapterId === chapterId);
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
