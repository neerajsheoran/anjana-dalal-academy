import Link from "next/link";
import { getSubjectsForClass, getClassLabel, getChapters } from "@/lib/content";
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
  "social-science": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    hover: "hover:bg-amber-100 hover:border-amber-400",
    text: "text-amber-800",
    sub: "text-amber-600",
  },
  "political-science": {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    hover: "hover:bg-indigo-100 hover:border-indigo-400",
    text: "text-indigo-800",
    sub: "text-indigo-600",
  },
};

// Defensive fallback so adding a future subject to the registry without
// also updating this style map doesn't crash on `styles.bg`.
const FALLBACK_SUBJECT_STYLE = {
  bg: "bg-gray-50",
  border: "border-gray-200",
  hover: "hover:bg-gray-100 hover:border-gray-400",
  text: "text-gray-800",
  sub: "text-gray-500",
};

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: ClassId }>;
}) {
  const { classId } = await params;
  const classLabel = getClassLabel(classId);
  const subjects = getSubjectsForClass(classId);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: classLabel }]} />

        <h1 className="text-3xl font-bold text-gray-800 mb-2">{classLabel}</h1>
        <p className="text-gray-500 mb-8">Choose a subject to start learning</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {subjects.map((subject) => {
            const styles = SUBJECT_STYLES[subject.id] ?? FALLBACK_SUBJECT_STYLE;
            const chapterCount = getChapters(classId, subject.id).length;
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
                    {chapterCount} chapters
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
