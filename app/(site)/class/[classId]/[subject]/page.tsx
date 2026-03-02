import Link from "next/link";
import { getChapters, getClassLabel, getSubjectLabel } from "@/lib/content";
import { ClassId, SubjectId } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterQuizSelector from "@/components/quiz/ChapterQuizSelector";

export default async function ClassSubjectPage({
  params,
}: {
  params: Promise<{ classId: ClassId; subject: SubjectId }>;
}) {
  const { classId, subject } = await params;
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const chapters = getChapters(classId, subject);

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
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{chapter.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
