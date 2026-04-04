import { NextResponse } from "next/server";
import { getAllChapters, getClassLabel, getSubjectLabel } from "@/lib/content";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  const chapters = getAllChapters();

  const index = chapters.map((ch) => {
    // Read MDX to extract h2 headings and a text snippet
    const mdxPath = path.join(process.cwd(), "content", ch.classId, ch.subject, ch.chapterId, "index.mdx");
    let headings: string[] = [];
    let snippet = "";

    if (fs.existsSync(mdxPath)) {
      const raw = fs.readFileSync(mdxPath, "utf8");
      // Strip frontmatter
      const content = raw.replace(/^---[\s\S]*?---\s*\n?/, "");
      // Extract h2 headings
      const matches = content.matchAll(/^## (.+)$/gm);
      for (const m of matches) {
        headings.push(m[1].replace(/\*\*/g, "").trim());
      }
      // Text snippet: strip markdown syntax, take first 300 chars
      snippet = content
        .replace(/^#{1,6}\s+.*/gm, "")
        .replace(/[*_`~\[\]()!|>]/g, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 300);
    }

    return {
      id: ch.chapterId,
      title: ch.title,
      classId: ch.classId,
      classLabel: getClassLabel(ch.classId),
      subject: ch.subject,
      subjectLabel: getSubjectLabel(ch.subject),
      headings,
      snippet,
      url: `/class/${ch.classId}/${ch.subject}/${ch.chapterId}`,
    };
  });

  return NextResponse.json(index, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
