import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  chapterUrl,
  getChapters,
  getClassLabel,
  getSubjectLabel,
} from "@/lib/content";
import { getBook, getBooks, hasBooks } from "@/lib/books";
import { ChapterMeta, ClassId, SubjectId } from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import Breadcrumb from "@/components/layout/Breadcrumb";

async function getChapterProgress(
  classId: string,
  subject: string,
): Promise<Map<string, { visited: boolean; completed: boolean; completedBy: string | null }>> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return new Map();
    const decoded = await adminAuth.verifySessionCookie(session);
    const snapshot = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("progress")
      .where("classId", "==", classId)
      .where("subject", "==", subject)
      .get();
    const map = new Map<string, { visited: boolean; completed: boolean; completedBy: string | null }>();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      map.set(doc.id, { visited: true, completed: data.completed === true, completedBy: data.completedBy || null });
    }
    return map;
  } catch {
    return new Map();
  }
}

export default async function SubjectClassPage({
  params,
}: {
  params: Promise<{ subjectId: SubjectId; classId: ClassId }>;
}) {
  const { subjectId, classId } = await params;

  // Political Science is now a book under Social Science. Redirect old
  // subject-first URLs to the new umbrella.
  if ((subjectId as string) === "political-science") {
    redirect(`/subject/social-science/${classId}`);
  }

  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subjectId);
  const chapters = getChapters(classId, subjectId);
  const chapterProgress = await getChapterProgress(classId, subjectId);
  const multiBook = hasBooks(classId, subjectId);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: subjectLabel, href: `/subject/${subjectId}` },
            { label: classLabel },
          ]}
        />

        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          {subjectLabel} — {classLabel}
        </h1>

        {/* Progress summary */}
        {(() => {
          const visited = chapterProgress.size;
          const total = chapters.length;
          const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
          const bookCount = multiBook ? getBooks(classId, subjectId).length : 0;
          return (
            <div className="mb-8">
              <p className="text-gray-500 mb-2">
                {total} chapters
                {bookCount > 0 && <span> · {bookCount} books</span>}
                {visited > 0 && (
                  <span className="text-green-600 font-medium ml-2">
                    · {visited}/{total} visited
                  </span>
                )}
              </p>
              {visited > 0 && (
                <div className="w-full max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {chapters.length === 0 ? (
          <p className="text-gray-400">Chapters coming soon...</p>
        ) : multiBook ? (
          <MultiBookGroups
            classId={classId}
            subjectId={subjectId}
            chapters={chapters}
            chapterProgress={chapterProgress}
          />
        ) : (
          <FlatChapterList chapters={chapters} chapterProgress={chapterProgress} />
        )}
      </div>
    </main>
  );
}

// Multi-book subjects render collapsible <details> sections per book.
// All books start collapsed; clicking the header expands one. Native
// HTML — no client JS needed for the toggle.
function MultiBookGroups({
  classId,
  subjectId,
  chapters,
  chapterProgress,
}: {
  classId: ClassId;
  subjectId: SubjectId;
  chapters: ChapterMeta[];
  chapterProgress: Map<string, { visited: boolean; completed: boolean; completedBy: string | null }>;
}) {
  const books = getBooks(classId, subjectId);
  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => {
        const bookChapters = chapters.filter((c) => c.book === book.id);
        const visited = bookChapters.filter((c) => chapterProgress.has(c.chapterId)).length;
        return (
          <details
            key={book.id}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between hover:bg-amber-50/40 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-800 leading-snug truncate">
                  {book.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bookChapters.length === 0
                    ? "Coming soon"
                    : `${bookChapters.length} chapters`}
                  {visited > 0 && (
                    <span className="text-green-600 font-medium ml-2">
                      · {visited} visited
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight
                className="w-5 h-5 text-gray-400 shrink-0 ml-3 transition-transform group-open:rotate-90"
                strokeWidth={2.5}
              />
            </summary>
            {bookChapters.length > 0 && (
              <div className="border-t border-gray-100 px-2 py-2 flex flex-col gap-2">
                {bookChapters.map((chapter) => (
                  <ChapterRow
                    key={chapter.chapterId}
                    chapter={chapter}
                    progress={chapterProgress.get(chapter.chapterId)}
                  />
                ))}
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}

// Flat (single-book) subject layout — same look as before, just using
// the chapterUrl helper so URLs still work for any future flat subject
// whose chapters might one day live inside a book folder.
function FlatChapterList({
  chapters,
  chapterProgress,
}: {
  chapters: ChapterMeta[];
  chapterProgress: Map<string, { visited: boolean; completed: boolean; completedBy: string | null }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {chapters.map((chapter) => (
        <ChapterRow
          key={chapter.chapterId}
          chapter={chapter}
          progress={chapterProgress.get(chapter.chapterId)}
          large
        />
      ))}
    </div>
  );
}

function ChapterRow({
  chapter,
  progress,
  large,
}: {
  chapter: ChapterMeta;
  progress?: { completed: boolean; completedBy: string | null };
  large?: boolean;
}) {
  const titleClass = large
    ? "text-lg font-semibold text-gray-800"
    : "text-sm font-semibold text-gray-800";
  return (
    <Link
      href={chapterUrl(chapter)}
      className={`group bg-white border border-gray-200 rounded-xl ${large ? "p-6" : "px-4 py-3"} hover:border-amber-400 hover:shadow-sm transition-all`}
    >
      <div className="flex items-start gap-4">
        <span className={`font-bold text-amber-200 min-w-[2rem] ${large ? "text-lg" : "text-sm"}`}>
          {String(chapter.order).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <p className={titleClass}>{chapter.title}</p>
          {chapter.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{chapter.description}</p>
          )}
        </div>
        {progress && (
          <span
            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              progress.completed ? "bg-green-100" : "bg-gray-100"
            }`}
            title={
              progress.completed
                ? progress.completedBy === "quiz"
                  ? "Quiz Passed"
                  : "Marked Complete"
                : "Visited"
            }
          >
            <svg
              className={`w-3.5 h-3.5 ${progress.completed ? "text-green-600" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
    </Link>
  );
}
