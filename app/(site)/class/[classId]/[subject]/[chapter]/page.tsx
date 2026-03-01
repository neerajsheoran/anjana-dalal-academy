import { MDXRemote } from "next-mdx-remote/rsc";
import { getChapter, getClassLabel, getSubjectLabel, SUBJECTS } from "@/lib/content";
import { ClassId, SubjectId, WorksheetData } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterTabs from "@/components/content/ChapterTabs";
import fs from "fs";
import path from "path";

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
  const classLabel = getClassLabel(classId);
  const subjectLabel = getSubjectLabel(subject);
  const chapterMeta = getChapter(chapter);
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  const banner = SUBJECT_BANNER[subject] ?? SUBJECT_BANNER["science"];

  const basePath = path.join(process.cwd(), "content", classId, subject, chapter);

  const notesPath = path.join(basePath, "index.mdx");
  const hasNotes = fs.existsSync(notesPath);
  const notesRaw = hasNotes ? fs.readFileSync(notesPath, "utf8") : null;
  // Strip YAML frontmatter (--- ... ---) added by Keystatic CMS before rendering
  const notesSource = notesRaw ? notesRaw.replace(/^---[\s\S]*?---\s*\n?/, "") : null;

  const worksheetPath = path.join(basePath, "worksheet.json");
  const hasWorksheet = fs.existsSync(worksheetPath);
  const worksheet: WorksheetData | null = hasWorksheet
    ? JSON.parse(fs.readFileSync(worksheetPath, "utf8"))
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Chapter Title Banner */}
      <div className={`${banner.bg} text-white px-6 py-8`}>
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            light
            items={[
              { label: "Home", href: "/" },
              { label: classLabel, href: `/class/${classId}` },
              { label: subjectLabel, href: `/class/${classId}/${subject}` },
              { label: chapterMeta?.title ?? chapter },
            ]}
          />
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{subjectInfo?.icon}</span>
            <span className={`text-sm font-semibold uppercase tracking-wide ${banner.text}`}>
              {classLabel} · {subjectLabel} · NCERT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {chapterMeta?.title ?? chapter}
          </h1>
          {chapterMeta?.description && (
            <p className={`mt-2 text-sm ${banner.text}`}>
              {chapterMeta.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <ChapterTabs worksheet={worksheet}>
          {notesSource ? (
            <MDXRemote source={notesSource} />
          ) : (
            <p className="text-gray-400">Notes coming soon...</p>
          )}
        </ChapterTabs>
      </div>
    </main>
  );
}
