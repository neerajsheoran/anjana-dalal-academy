// Books registry — used by multi-book subjects (e.g. Class 10 Social
// Science is split across History / Geography / Political Science /
// Economics by NCERT). Single-book subjects (Maths, Science) don't
// appear here at all — the chapter list page renders directly.
//
// When you add a new multi-book subject:
//   1. Add the entry below.
//   2. Author content under content/[classId]/[subject]/[bookId]/chapter-*/
//   3. The discovery in lib/content.ts will pick it up automatically.

import type { BookInfo, ClassId, SubjectId } from "./types";

type BooksRegistry = Partial<
  Record<ClassId, Partial<Record<SubjectId, BookInfo[]>>>
>;

export const BOOKS: BooksRegistry = {
  "class-10": {
    "social-science": [
      { id: "history",            label: "History — India and the Contemporary World II", order: 1 },
      { id: "geography",          label: "Geography — Contemporary India II",             order: 2 },
      { id: "political-science",  label: "Political Science — Democratic Politics II",    order: 3 },
      { id: "economics",          label: "Economics — Understanding Economic Development", order: 4 },
    ],
  },
};

export function getBooks(classId: ClassId, subject: SubjectId): BookInfo[] {
  const list = BOOKS[classId]?.[subject];
  if (!list) return [];
  return [...list].sort((a, b) => a.order - b.order);
}

export function getBook(
  classId: ClassId,
  subject: SubjectId,
  bookId: string,
): BookInfo | undefined {
  return getBooks(classId, subject).find((b) => b.id === bookId);
}

export function hasBooks(classId: ClassId, subject: SubjectId): boolean {
  return getBooks(classId, subject).length > 0;
}
