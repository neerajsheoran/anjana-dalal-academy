import Link from "next/link";
import { cookies } from "next/headers";
import { getChapters, getClassLabel, getSubjectLabel } from "@/lib/content";
import { ClassId, SubjectId } from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterQuizSelector from "@/components/quiz/ChapterQuizSelector";

async function getChapterProgress(classId: string, subject: string): Promise<Map<string, { visited: boolean; completed: boolean }>> {
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
    const map = new Map<string, { visited: boolean; completed: boolean }>();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      map.set(doc.id, { visited: true, completed: data.completed === true });
    }
    return map;
  } catch {
    return new Map();
  }
}

export default async function ClassSubjectPage({
  params,
}: {
  params: Promise<{ classId: ClassId; subject: SubjectId }>;
}) {
  const { classId, subject } = await params;
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const chapters = getChapters(classId, subject);
  const chapterProgress = await getChapterProgress(classId, subject);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: classLabel, href: `/class/${classId}` },
            { label: subjectLabel },
          ]}
        />

        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          {classLabel} — {subjectLabel}
        </h1>
        <p className="text-gray-500 mb-8">NCERT · {chapters.length} chapters</p>

        {chapters.length > 0 && (
          <ChapterQuizSelector
            classId={classId}
            subject={subject}
            chapters={chapters}
          />
        )}

        {chapters.length === 0 ? (
          <p className="text-gray-400">Chapters coming soon...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.chapterId}
                href={`/class/${classId}/${subject}/${chapter.chapterId}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-lg font-bold text-blue-200 min-w-[2rem]">
                    {String(chapter.order).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-800">{chapter.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                  </div>
                  {chapterProgress.has(chapter.chapterId) && (() => {
                    const progress = chapterProgress.get(chapter.chapterId)!;
                    const isCompleted = progress.completed;
                    return (
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-green-100" : "bg-gray-100"
                        }`}
                        title={isCompleted ? "Completed" : "Visited"}
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${isCompleted ? "text-green-600" : "text-gray-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    );
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
