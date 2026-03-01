import Link from "next/link";
import { getChapters, getClassLabel, getSubjectLabel } from "@/lib/content";
import { ClassId, SubjectId } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default async function SubjectClassPage({
  params,
}: {
  params: Promise<{ subjectId: SubjectId; classId: ClassId }>;
}) {
  const { subjectId, classId } = await params;
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subjectId);
  const chapters = getChapters(classId, subjectId);

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
        <p className="text-gray-500 mb-8">NCERT · {chapters.length} chapters</p>

        {chapters.length === 0 ? (
          <p className="text-gray-400">Chapters coming soon...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.chapterId}
                href={`/class/${classId}/${subjectId}/${chapter.chapterId}`}
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
