import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getChapter, getClassLabel, getSubjectLabel, SUBJECTS } from "@/lib/content";
import { ClassId, SubjectId, WorksheetData } from "@/lib/types";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ChapterTabs from "@/components/content/ChapterTabs";
import fs from "fs";
import path from "path";

// Keystatic stores images in content/[classId]/[subject]/[chapterId]/content/filename
// and writes relative paths like ![](filename.png) in the MDX.
// This factory builds a chapter-aware img component that maps those to the API route.
function makeMdxImage(classId: string, subject: string, chapter: string) {
  return function MdxImage({ src, alt }: { src?: string; alt?: string }) {
    const resolved =
      src && !src.startsWith("/") && !src.startsWith("http")
        ? `/api/content-image/${classId}/${subject}/${chapter}/content/${src}`
        : src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={alt ?? ""} className="max-w-full rounded-lg my-4" />;
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
  const mdxComponents = { img: makeMdxImage(classId, subject, chapter) };
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
          <div className="mt-4">
            <a
              href={`/quiz?class=${classId}&subject=${subject}&chapters=${chapter}`}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors border border-white/30"
            >
              🧠 Quiz / Revision
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <ChapterTabs worksheet={worksheet}>
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
    </main>
  );
}
