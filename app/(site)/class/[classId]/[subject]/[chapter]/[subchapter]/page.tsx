// Nested chapter route for multi-book subjects.
// URL shape: /class/[classId]/[subject]/[book]/[chapter]
//   In this file's params, [chapter] is the BOOK slug, [subchapter] is
//   the actual chapter slug. (Next.js dynamic-segment names are fixed
//   by the folder structure, so we live with the naming mismatch.)

import { redirect, notFound } from "next/navigation";
import { getChapterInBook } from "@/lib/content";
import { getBook } from "@/lib/books";
import { findRedirect } from "@/lib/slug-redirects";
import { ClassId, SubjectId } from "@/lib/types";
import ChapterPageBody from "@/components/content/ChapterPageBody";

export default async function NestedChapterPage({
  params,
}: {
  params: Promise<{
    classId: ClassId;
    subject: SubjectId;
    chapter: string;       // really the BOOK slug
    subchapter: string;    // the actual chapter slug
  }>;
}) {
  const { classId, subject, chapter: bookSlug, subchapter: chapter } = await params;

  // Verify the book exists; otherwise this isn't a valid nested URL.
  const bookInfo = getBook(classId, subject, bookSlug);
  if (!bookInfo) {
    notFound();
  }

  // Resolve the chapter scoped to the book.
  let chapterMeta = getChapterInBook(classId, subject, bookSlug, chapter);

  // Slug redirect: for nested chapters the redirect map key is the
  // book id joined with the old slug — e.g. "history/chapter-1-old-name".
  // This keeps a single redirect namespace per (classId, subject).
  if (!chapterMeta) {
    const redirectKey = `${bookSlug}/${chapter}`;
    const newSlug = findRedirect(classId, subject, redirectKey);
    if (newSlug) {
      // newSlug may itself include a book prefix, or be a bare chapter slug
      // assumed to live in the same book.
      if (newSlug.includes("/")) {
        const [newBook, newChapter] = newSlug.split("/", 2);
        redirect(`/class/${classId}/${subject}/${newBook}/${newChapter}`);
      } else {
        redirect(`/class/${classId}/${subject}/${bookSlug}/${newSlug}`);
      }
    }
    chapterMeta = undefined;
  } else {
    chapterMeta = getChapterInBook(classId, subject, bookSlug, chapter);
  }

  return (
    <ChapterPageBody
      classId={classId}
      subject={subject}
      chapter={chapter}
      chapterMeta={chapterMeta}
      book={bookSlug}
      bookLabel={bookInfo.label}
    />
  );
}
