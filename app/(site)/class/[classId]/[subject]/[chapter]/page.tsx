// Flat chapter route: /class/[classId]/[subject]/[chapter]
//
// The `chapter` URL segment may actually be a BOOK slug under a multi-
// book subject (e.g. /class/class-10/social-science/history). In that
// case we render the book's chapter list instead of treating it as a
// chapter. The nested chapter content for multi-book subjects lives at
// .../[chapter]/[subchapter]/page.tsx.

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  chapterUrl,
  getChapter,
  getChaptersInBook,
  getClassLabel,
  getSubjectLabel,
} from "@/lib/content";
import { getBook } from "@/lib/books";
import { findRedirect } from "@/lib/slug-redirects";
import { ClassId, SubjectId } from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getContentAccessLevel, hasFullAccess } from "@/lib/subscription";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterPageBody from "@/components/content/ChapterPageBody";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ classId: ClassId; subject: SubjectId; chapter: string }>;
}) {
  const { classId, subject, chapter } = await params;

  // Class 10 Political Science migration: old chapter URLs land here
  // (subject="political-science"). Rewrite to the new nested location.
  if (classId === "class-10" && (subject as string) === "political-science") {
    redirect(`/class/class-10/social-science/political-science/${chapter}`);
  }

  // Book detour: if the slug is actually a book name, render that
  // book's chapter list instead.
  const bookInfo = getBook(classId, subject, chapter);
  if (bookInfo) {
    return renderBookChapterList(classId, subject, bookInfo.id, bookInfo.label);
  }

  // Try to resolve the chapter; fall through to slug redirects before
  // giving up. Note that we only do flat-subject lookups here — nested
  // chapters are served by the [subchapter] route.
  let chapterMeta = getChapter(chapter);
  if (!chapterMeta) {
    const newSlug = findRedirect(classId, subject, chapter);
    if (newSlug) {
      redirect(`/class/${classId}/${subject}/${newSlug}`);
    }
  }
  chapterMeta = getChapter(chapter);

  return (
    <ChapterPageBody
      classId={classId}
      subject={subject}
      chapter={chapter}
      chapterMeta={chapterMeta}
    />
  );
}

// Renders the chapter list inside a single book of a multi-book subject.
async function renderBookChapterList(
  classId: ClassId,
  subject: SubjectId,
  bookId: string,
  bookLabel: string,
) {
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const chapters = getChaptersInBook(classId, subject, bookId);

  let chapterProgress = new Map<string, { completed: boolean; completedBy: string | null }>();
  let userHasAccess = false;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (session) {
      const decoded = await adminAuth.verifySessionCookie(session);
      const snap = await adminDb
        .collection("users")
        .doc(decoded.uid)
        .collection("progress")
        .where("classId", "==", classId)
        .where("subject", "==", subject)
        .get();
      const map = new Map<string, { completed: boolean; completedBy: string | null }>();
      for (const doc of snap.docs) {
        const data = doc.data();
        map.set(doc.id, {
          completed: data.completed === true,
          completedBy: (data.completedBy as string) || null,
        });
      }
      chapterProgress = map;
      const accessLevel = await getContentAccessLevel(decoded.uid);
      userHasAccess = hasFullAccess(accessLevel);
    }
  } catch {
    // Anonymous fallthrough.
  }

  // notFound guard — if a registered book has zero chapters yet, still
  // render the breadcrumb + a friendly placeholder rather than 404. But
  // if `bookId` is unknown, defensive notFound.
  if (!getBook(classId, subject, bookId)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: classLabel, href: `/class/${classId}` },
            { label: subjectLabel, href: `/class/${classId}/${subject}` },
            { label: bookLabel },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{bookLabel}</h1>
        <p className="text-gray-500 mb-8">
          {classLabel} · {subjectLabel} · {chapters.length} chapters
        </p>

        {chapters.length === 0 ? (
          <p className="text-gray-400">Chapters coming soon...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.chapterId}
                href={chapterUrl(chapter)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-amber-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-lg font-bold text-amber-200 min-w-[2rem]">
                    {String(chapter.order).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-semibold text-gray-800">{chapter.title}</p>
                      {chapter.order <= 2 ? (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      ) : !userHasAccess && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Sign up free
                        </span>
                      )}
                    </div>
                    {chapter.description && (
                      <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                    )}
                  </div>
                  {chapterProgress.has(chapter.chapterId) && (
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${chapterProgress.get(chapter.chapterId)!.completed ? "bg-green-100" : "bg-gray-100"}`}>
                      <svg className={`w-3.5 h-3.5 ${chapterProgress.get(chapter.chapterId)!.completed ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
