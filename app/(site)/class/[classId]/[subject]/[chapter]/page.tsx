import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getChapter, getChapters, getClassLabel, getSubjectLabel, SUBJECTS } from "@/lib/content";
import { ClassId, SubjectId, WorksheetData, ContentAccessLevel } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterTabs from "@/components/content/ChapterTabs";
import ProgressTracker from "@/components/progress/ProgressTracker";
import BookmarkButton from "@/components/content/BookmarkButton";
import MarkCompleteButton from "@/components/progress/MarkCompleteButton";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import fs from "fs";
import path from "path";

// Keystatic stores images in content/[classId]/[subject]/[chapterId]/content/filename
// and writes relative paths like ![](filename.png) in the MDX.
// This factory builds a chapter-aware img component that maps those to the API route.
// Images that don't exist on disk are silently hidden (placeholders for future content).
function makeMdxImage(classId: string, subject: string, chapter: string) {
  return function MdxImage({ src, alt }: { src?: string; alt?: string }) {
    if (!src) return null;
    // MDX URL-encodes filenames (spaces → %20), decode for filesystem checks
    const decoded = decodeURIComponent(src);
    // Check if local image file exists before rendering
    if (!decoded.startsWith("/") && !decoded.startsWith("http")) {
      const filePath = path.join(process.cwd(), "content", classId, subject, chapter, "content", decoded);
      if (!fs.existsSync(filePath)) return null;
    }
    const resolved =
      !decoded.startsWith("/") && !decoded.startsWith("http")
        ? `/api/content-image/${classId}/${subject}/${chapter}/content/${encodeURIComponent(decoded)}`
        : decoded;
    return (
      <div className="flex justify-center my-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolved} alt={alt ?? ""} className="max-w-full rounded-lg" />
      </div>
    );
  };
}

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
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ classId: ClassId; subject: SubjectId; chapter: string }>;
}) {
  const { classId, subject, chapter } = await params;

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
      // Check if chapter is completed (only if user has access)
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

  const currentPath = `/class/${classId}/${subject}/${chapter}`;

  function MdxH2({ children }: { children?: React.ReactNode }) {
    const text = typeof children === "string" ? children : String(children ?? "");
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return <h2 id={slug}>{children}</h2>;
  }

  const mdxComponents = { img: makeMdxImage(classId, subject, chapter), h2: MdxH2 };
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const chapterMeta = getChapter(chapter);
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  const banner = SUBJECT_BANNER[subject] ?? SUBJECT_BANNER["science"];

  // Prev / Next chapter navigation
  const allChapters = getChapters(classId, subject);
  const currentIndex = allChapters.findIndex((c) => c.chapterId === chapter);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Ensure titles always show "Chapter N — Title"
  const formatChapterTitle = (ch: { title: string; order: number }) =>
    /^chapter\s+\d/i.test(ch.title) ? ch.title : `Chapter ${ch.order} — ${ch.title}`;

  const displayTitle = chapterMeta ? formatChapterTitle(chapterMeta) : chapter;

  const basePath = path.join(process.cwd(), "content", classId, subject, chapter);

  const notesPath = path.join(basePath, "index.mdx");
  const hasNotes = fs.existsSync(notesPath);
  const notesRaw = hasNotes ? fs.readFileSync(notesPath, "utf8") : null;
  // Strip YAML frontmatter (--- ... ---) added by Keystatic CMS before rendering
  const notesSource = notesRaw ? notesRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  // Extract ## headings for in-page TOC
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
  const hasReview = fs.existsSync(reviewPath);
  const reviewRaw = hasReview ? fs.readFileSync(reviewPath, "utf8") : null;
  const reviewSource = reviewRaw ? reviewRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const discussionPath = path.join(basePath, "discussion.mdx");
  const hasDiscussion = fs.existsSync(discussionPath);
  const discussionRaw = hasDiscussion ? fs.readFileSync(discussionPath, "utf8") : null;
  const discussionSource = discussionRaw ? discussionRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const worksheetPath = path.join(basePath, "worksheet.json");
  const hasWorksheet = fs.existsSync(worksheetPath);
  const worksheet: WorksheetData | null = hasWorksheet
    ? JSON.parse(fs.readFileSync(worksheetPath, "utf8"))
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Chapter Title Banner */}
      <div className={`${banner.bg} text-white px-6 py-6`}>
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            light
            items={[
              { label: "Home", href: "/" },
              { label: classLabel, href: `/class/${classId}` },
              { label: subjectLabel, href: `/class/${classId}/${subject}` },
              { label: chapterMeta ? `Chapter ${chapterMeta.order}` : chapter },
            ]}
          />
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{subjectInfo?.icon}</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${banner.text}`}>
              {classLabel} · {subjectLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {displayTitle}
          </h1>
          {chapterMeta?.description && (
            <p className={`mt-1 text-sm ${banner.text}`}>
              {chapterMeta.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <BookmarkButton
              classId={classId}
              subject={subject}
              chapterId={chapter}
              chapterTitle={displayTitle}
            />
            {isLoggedIn && hasFullAccess(accessLevel) && (
              <MarkCompleteButton
                classId={classId}
                subject={subject}
                chapterId={chapter}
                chapterTitle={displayTitle}
                initialCompleted={isChapterCompleted}
                completedBy={completedBy}
              />
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next Chapter Navigation — Top */}
      {(prevChapter || nextChapter) && (
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <div className="flex items-stretch gap-4">
            {prevChapter ? (
              <Link
                href={`/class/${classId}/${subject}/${prevChapter.chapterId}`}
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
                href={`/class/${classId}/${subject}/${nextChapter.chapterId}`}
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <ChapterTabs
          worksheet={worksheet}
          accessLevel={accessLevel}
          currentPath={currentPath}
          headings={headings}
          worksheetTopics={worksheet?.topics.map((t) => t.topic) ?? []}
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

      {/* Prev / Next Chapter Navigation */}
      {(prevChapter || nextChapter) && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-stretch gap-4">
            {prevChapter ? (
              <Link
                href={`/class/${classId}/${subject}/${prevChapter.chapterId}`}
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
                href={`/class/${classId}/${subject}/${nextChapter.chapterId}`}
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
        chapterTitle={displayTitle}
      />
    </main>
  );
}
