import Link from "next/link";
import { SUBJECTS, getClassLabel } from "@/lib/content";
import { ClassId } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";

const SUBJECT_STYLES: Record<string, { bg: string; border: string; hover: string; text: string; sub: string }> = {
  maths: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    hover: "hover:bg-blue-100 hover:border-blue-400",
    text: "text-blue-800",
    sub: "text-blue-500",
  },
  science: {
    bg: "bg-green-50",
    border: "border-green-200",
    hover: "hover:bg-green-100 hover:border-green-400",
    text: "text-green-800",
    sub: "text-green-500",
  },
};

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: ClassId }>;
}) {
  const { classId } = await params;
  const classLabel = getClassLabel(classId);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: classLabel }]} />

        <h1 className="text-3xl font-bold text-gray-800 mb-2">{classLabel}</h1>
        <p className="text-gray-500 mb-8">Choose a subject to start learning</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUBJECTS.map((subject) => {
            const styles = SUBJECT_STYLES[subject.id];
            return (
              <Link
                key={subject.id}
                href={`/class/${classId}/${subject.id}`}
                className={`${styles.bg} border ${styles.border} ${styles.hover} rounded-xl p-8 flex items-center gap-5 transition-all`}
              >
                <span className="text-4xl">{subject.icon}</span>
                <div>
                  <p className={`text-xl font-semibold ${styles.text}`}>
                    {subject.label}
                  </p>
                  <p className={`text-sm mt-1 ${styles.sub}`}>
                    {classLabel} · NCERT
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
