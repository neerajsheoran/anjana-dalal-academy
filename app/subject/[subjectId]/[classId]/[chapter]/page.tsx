// Route: /subject/science/class-6/chapter-1-...
// Redirects to canonical URL: /class/class-6/science/chapter-1-...
// Content is stored ONCE — this path just redirects

import { redirect } from "next/navigation";
import { ClassId, SubjectId } from "@/lib/types";

export default async function SubjectChapterRedirect({
  params,
}: {
  params: Promise<{ subjectId: SubjectId; classId: ClassId; chapter: string }>;
}) {
  const { subjectId, classId, chapter } = await params;
  redirect(`/class/${classId}/${subjectId}/${chapter}`);
}
