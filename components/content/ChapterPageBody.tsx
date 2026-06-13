// Shared server component that renders the full chapter page (banner,
// breadcrumb, prev/next, tabs, progress tracker). Used by both the flat
// chapter route (/class/[classId]/[subject]/[chapter]) and the nested
// book chapter route (/class/[classId]/[subject]/[book]/[chapter]).
//
// Splitting it out keeps both route files small and means a fix to the
// chapter UI only happens in one place.

import Link from "next/link";
import { cookies } from "next/headers";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import fs from "fs";
import path from "path";

import {
  chapterUrl,
  getChapters,
  getChaptersInBook,
  getClassLabel,
  getSubjectLabel,
  SUBJECTS,
} from "@/lib/content";
import {
  ChapterMeta,
  ClassId,
  ContentAccessLevel,
  SubjectId,
  WorksheetData,
} from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterTabs from "@/components/content/ChapterTabs";
import ProgressTracker from "@/components/progress/ProgressTracker";
import BookmarkButton from "@/components/content/BookmarkButton";
import MarkCompleteButton from "@/components/progress/MarkCompleteButton";

const SUBJECT_BANNER: Record<string, { bg: string; text: string; badge: string }> = {
  science: {
    bg: "bg-gradient-to-r from-green-600 to-green-700",
    text: "text-green-100",
    badge: "bg-green-500 text-white",
  },
  maths: {
    bg: "bg-gradient-to-r from-blue-600 to-blue-700",
    text: "text-blue-100",
    badge: "bg-blue-500 text-white",
  },
  "social-science": {
    bg: "bg-gradient-to-r from-amber-600 to-amber-700",
    text: "text-amber-100",
    badge: "bg-amber-500 text-white",
  },
};

// Build a chapter-aware <img> component. Image files live under the
// chapter folder's `content/` subdirectory; this maps relative URLs to
// the API route that serves them.
function makeMdxImage(
  classId: string,
  subject: string,
  chapter: string,
  book: string | undefined,
) {
  return function MdxImage({ src, alt }: { src?: string; alt?: string }) {
    if (!src) return null;
    const decoded = decodeURIComponent(src);
    if (!decoded.startsWith("/") && !decoded.startsWith("http")) {
      const segments = book
        ? [classId, subject, book, chapter, "content", decoded]
        : [classId, subject, chapter, "content", decoded];
      const filePath = path.join(process.cwd(), "content", ...segments);
      if (!fs.existsSync(filePath)) return null;
    }
    const apiSegments = book
      ? `${classId}/${subject}/${book}/${chapter}/content/${encodeURIComponent(decoded)}`
      : `${classId}/${subject}/${chapter}/content/${encodeURIComponent(decoded)}`;
    const resolved =
      !decoded.startsWith("/") && !decoded.startsWith("http")
        ? `/api/content-image/${apiSegments}`
        : decoded;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt ?? ""}
        className="block mx-auto my-4 max-w-full rounded-lg"
      />
    );
  };
}

interface ChapterPageBodyProps {
  classId: ClassId;
  subject: SubjectId;
  chapter: string;       // chapter slug
  chapterMeta?: ChapterMeta;
  book?: string;         // optional book id (for nested-book subjects)
  bookLabel?: string;    // optional book display name (for breadcrumb)
}

export default async function ChapterPageBody({
  classId,
  subject,
  chapter,
  chapterMeta,
  book,
  bookLabel,
}: ChapterPageBodyProps) {
  // ── Auth + access + completion state ──────────────────────────────
  let accessLevel: ContentAccessLevel = "anonymous";
  let isChapterCompleted = false;
  let completedBy: string | null = null;
  let isLoggedIn = false;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (session) {
      const decoded = await adminAuth.verifySessionCookie(session);
      isLoggedIn = true;
      accessLevel = await getContentAccessLevel(decoded.uid);
      if (hasFullAccess(accessLevel)) {
        const progressDoc = await adminDb
          .collection("users")
          .doc(decoded.uid)
          .collection("progress")
          .doc(chapter)
          .get();
        if (progressDoc.exists && progressDoc.data()?.completed === true) {
          isChapterCompleted = true;
          completedBy = (progressDoc.data()?.completedBy as string) || "quiz";
        }
      }
    }
  } catch {
    accessLevel = "anonymous";
  }

  // ── Display + nav ─────────────────────────────────────────────────
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  const banner = SUBJECT_BANNER[subject] ?? SUBJECT_BANNER["science"];

  const currentPath = book
    ? `/class/${classId}/${subject}/${book}/${chapter}`
    : `/class/${classId}/${subject}/${chapter}`;

  // Prev / next chapters — scope to the current book if nested, else
  // all chapters in the subject.
  const siblingChapters = book
    ? getChaptersInBook(classId, subject, book)
    : getChapters(classId, subject);
  const currentIndex = siblingChapters.findIndex((c) => c.chapterId === chapter);
  const prevChapter = currentIndex > 0 ? siblingChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < siblingChapters.length - 1
      ? siblingChapters[currentIndex + 1]
      : null;

  const formatChapterTitle = (ch: { title: string; order: number }) =>
    /^chapter\s+\d/i.test(ch.title) ? ch.title : `Chapter ${ch.order} — ${ch.title}`;

  const displayTitle = chapterMeta ? formatChapterTitle(chapterMeta) : chapter;

  // ── File reads (index/review/discussion/worksheet) ────────────────
  const basePath = book
    ? path.join(process.cwd(), "content", classId, subject, book, chapter)
    : path.join(process.cwd(), "content", classId, subject, chapter);

  const notesPath = path.join(basePath, "index.mdx");
  const notesRaw = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8") : null;
  const notesSource = notesRaw ? notesRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const headings: { text: string; slug: string }[] = [];
  if (notesSource) {
    const matches = notesSource.matchAll(/^## (.+)$/gm);
    for (const m of matches) {
      const text = m[1].replace(/\*\*/g, "").trim();
      const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ text, slug });
    }
  }

  const reviewPath = path.join(basePath, "review.mdx");
  const reviewRaw = fs.existsSync(reviewPath) ? fs.readFileSync(reviewPath, "utf8") : null;
  const reviewSource = reviewRaw ? reviewRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const discussionPath = path.join(basePath, "discussion.mdx");
  const discussionRaw = fs.existsSync(discussionPath) ? fs.readFileSync(discussionPath, "utf8") : null;
  const discussionSource = discussionRaw ? discussionRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const worksheetPath = path.join(basePath, "worksheet.json");
  const worksheet: WorksheetData | null = fs.existsSync(worksheetPath)
    ? JSON.parse(fs.readFileSync(worksheetPath, "utf8"))
    : null;

  // ── MDX components ────────────────────────────────────────────────
  function MdxH2({ children }: { children?: React.ReactNode }) {
    const text = typeof children === "string" ? children : String(children ?? "");
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return <h2 id={slug}>{children}</h2>;
  }
  const mdxComponents = { img: makeMdxImage(classId, subject, chapter, book), h2: MdxH2 };

  // ── Breadcrumb ────────────────────────────────────────────────────
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: classLabel, href: `/class/${classId}` },
    { label: subjectLabel, href: `/class/${classId}/${subject}` },
    ...(book && bookLabel
      ? [{ label: bookLabel, href: `/class/${classId}/${subject}/${book}` }]
      : []),
    { label: chapterMeta ? `Chapter ${chapterMeta.order}` : chapter },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className={`${banner.bg} text-white px-6 py-6`}>
        <div className="max-w-5xl mx-auto">
          <Breadcrumb light items={breadcrumbItems} />
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{subjectInfo?.icon}</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${banner.text}`}>
              {classLabel} · {subjectLabel}
              {bookLabel && <> · {bookLabel}</>}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {displayTitle}
          </h1>
          {chapterMeta?.description && (
            <p className={`mt-1 text-sm ${banner.text}`}>{chapterMeta.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <BookmarkButton
              classId={classId}
              subject={subject}
              chapterId={chapter}
              chapterKey={chapterMeta?.chapterKey}
              chapterTitle={displayTitle}
            />
            {isLoggedIn && hasFullAccess(accessLevel) && (
              <MarkCompleteButton
                classId={classId}
                subject={subject}
                chapterId={chapter}
                chapterKey={chapterMeta?.chapterKey}
                chapterTitle={displayTitle}
                initialCompleted={isChapterCompleted}
                completedBy={completedBy}
              />
            )}
          </div>
        </div>
      </div>

      {(prevChapter || nextChapter) && (
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <div className="flex items-stretch gap-4">
            {prevChapter ? (
              <Link
                href={chapterUrl(prevChapter)}
                className="flex-1 group bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <ChevronLeft className="w-3 h-3" strokeWidth={2.5} />
                  Previous
                </span>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 mt-0.5 leading-snug">
                  {formatChapterTitle(prevChapter)}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextChapter ? (
              <Link
                href={chapterUrl(nextChapter)}
                className="flex-1 group bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all text-right"
              >
                <span className="inline-flex items-center justify-end gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide w-full">
                  Next
                  <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </span>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 mt-0.5 leading-snug">
                  {formatChapterTitle(nextChapter)}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <ChapterTabs
          worksheet={worksheet}
          accessLevel={accessLevel}
          currentPath={currentPath}
          headings={headings}
          chapterOrder={chapterMeta?.order}
          classId={classId}
          reviewContent={
            reviewSource ? (
              <MDXRemote
                source={reviewSource}
                components={mdxComponents}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              />
            ) : null
          }
          discussionSource={discussionSource}
          discussionContent={
            discussionSource ? (
              <MDXRemote
                source={discussionSource}
                components={mdxComponents}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              />
            ) : null
          }
        >
          {notesSource ? (
            <MDXRemote
              source={notesSource}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          ) : (
            <p className="text-gray-400">Notes coming soon...</p>
          )}
        </ChapterTabs>
      </div>

      {(prevChapter || nextChapter) && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-stretch gap-4">
            {prevChapter ? (
              <Link
                href={chapterUrl(prevChapter)}
                className="flex-1 group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <ChevronLeft className="w-3 h-3" strokeWidth={2.5} />
                  Previous
                </span>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 mt-1 leading-snug">
                  {formatChapterTitle(prevChapter)}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextChapter ? (
              <Link
                href={chapterUrl(nextChapter)}
                className="flex-1 group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all text-right"
              >
                <span className="inline-flex items-center justify-end gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide w-full">
                  Next
                  <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </span>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 mt-1 leading-snug">
                  {formatChapterTitle(nextChapter)}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      )}

      <ProgressTracker
        classId={classId}
        subject={subject}
        chapterId={chapter}
        chapterKey={chapterMeta?.chapterKey}
        chapterTitle={displayTitle}
      />
    </main>
  );
}
