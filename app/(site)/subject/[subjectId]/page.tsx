import Link from "next/link";
import { CLASSES, SUBJECTS, getSubjectLabel } from "@/lib/content";
import { SubjectId } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: SubjectId }>;
}) {
  const { subjectId } = await params;
  const subjectLabel = getSubjectLabel(subjectId);
  const subjectInfo = SUBJECTS.find((s) => s.id === subjectId);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: subjectLabel }]} />

        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl">{subjectInfo?.icon}</span>
          <h1 className="text-3xl font-bold text-gray-800">{subjectLabel}</h1>
        </div>
        <p className="text-gray-500 mb-8">Choose a class to start learning</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {CLASSES.map((cls) => (
            <Link
              key={cls.id}
              href={`/subject/${subjectId}/${cls.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 text-center font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-700 hover:shadow-sm transition-all"
            >
              {cls.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
