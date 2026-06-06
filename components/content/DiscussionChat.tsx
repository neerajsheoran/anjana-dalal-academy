"use client";

import { useRef, Fragment } from "react";
import DiscussionAudio from "./DiscussionAudio";
import ContentBlur from "./ContentBlur";
import { ContentAccessLevel } from "@/lib/types";

type Speaker = "Mother" | "Child" | "Mentor" | "Student" | "Meera" | "Arjun";
// Speakers rendered on the left side of the chat with amber bubbles.
// (Right-side speakers — Child / Student / Arjun — get green bubbles.)
// Meera and Arjun are equal peers, not a teacher/student pair — the
// left/right split is purely for visual flow, like a WhatsApp thread.
const GUIDE_SPEAKERS = new Set<Speaker>(["Mother", "Mentor", "Meera"]);
const SPEAKER_RE = /^\*\*(Mother|Child|Mentor|Student|Meera|Arjun):\*\*\s*(.+)/;

interface ChatLine {
  speaker: Speaker;
  body: string; // multi-paragraph markdown body (first line included)
}

interface Section {
  heading: string | null;
  lines: ChatLine[];
}

// Parse a discussion.mdx body into sections. A speaker's turn starts on a
// `**Speaker:** ...` line and runs until the next speaker line or `## heading`.
// All intervening paragraphs, sub-headings, and bullet lists belong to that
// speaker.
function parseDiscussion(source: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { heading: null, lines: [] };
  let pending: ChatLine | null = null;
  const pendingBody: string[] = [];

  const flushPending = () => {
    if (pending) {
      pending.body = pendingBody.join("\n").trimEnd();
      currentSection.lines.push(pending);
      pending = null;
      pendingBody.length = 0;
    }
  };

  const pushSection = () => {
    flushPending();
    if (currentSection.heading || currentSection.lines.length > 0) {
      sections.push(currentSection);
    }
  };

  for (const raw of source.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const trimmed = line.trim();

    // Strip frontmatter delimiter (we don't parse frontmatter here)
    if (trimmed === "---" && !pending) continue;

    // Section heading — opens a new section
    if (line.startsWith("## ")) {
      pushSection();
      currentSection = { heading: line.replace(/^## /, "").trim(), lines: [] };
      continue;
    }

    // New speaker turn
    const match = trimmed.match(SPEAKER_RE);
    if (match) {
      flushPending();
      pending = { speaker: match[1] as Speaker, body: "" };
      pendingBody.push(match[2]);
      continue;
    }

    // Body content of the current speaker turn (paragraph or bullet line)
    if (pending) {
      pendingBody.push(line);
    }
  }

  pushSection();
  return sections;
}

function avatarFor(speaker: Speaker): string {
  switch (speaker) {
    case "Mother": return "👩";
    case "Child": return "🧒";
    case "Mentor": return "🧑‍🏫";
    case "Student": return "🧑‍🎓";
    case "Meera": return "👧";
    case "Arjun": return "👦";
  }
}

// Render inline markdown bold **text** to <strong>
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// Block-level renderer for a speaker's body. Handles paragraphs (blank-line
// separated), bullet lists (- lines), and inline bold.
function renderBody(body: string) {
  // Split into logical blocks: a blank line ends the current block.
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const raw of body.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(trimmed);
  }
  if (current.length) blocks.push(current);

  return blocks.map((blockLines, bi) => {
    const isList = blockLines.every((l) => l.startsWith("- ") || l.startsWith("* "));
    if (isList) {
      return (
        <ul key={bi} className="list-disc ml-5 my-1.5 space-y-1">
          {blockLines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="m-0 mb-1.5 last:mb-0">
        {blockLines.map((l, li) => (
          <Fragment key={li}>
            {li > 0 && " "}
            {renderInline(l)}
          </Fragment>
        ))}
      </p>
    );
  });
}

interface DiscussionChatProps {
  source: string;
  accessLevel: ContentAccessLevel;
  currentPath: string;
}

export default function DiscussionChat({ source, accessLevel, currentPath }: DiscussionChatProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const sections = parseDiscussion(source);

  return (
    <>
      <DiscussionAudio contentRef={contentRef} />
      <ContentBlur accessLevel={accessLevel} currentPath={currentPath}>
        <div ref={contentRef} className="space-y-8">
          {sections.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide text-center">
                    {section.heading}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              )}
              <div className="space-y-3">
                {section.lines.map((line, li) => {
                  const isGuide = GUIDE_SPEAKERS.has(line.speaker);
                  return (
                    <div
                      key={li}
                      className={`flex items-end gap-2 ${isGuide ? "flex-row" : "flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${
                          isGuide
                            ? "bg-amber-100"
                            : "bg-green-100"
                        }`}
                        title={line.speaker}
                      >
                        {avatarFor(line.speaker)}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`relative max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isGuide
                            ? "bg-amber-50 text-gray-800 rounded-bl-md"
                            : "bg-green-50 text-gray-800 rounded-br-md"
                        }`}
                      >
                        <span className={`block text-[10px] font-bold mb-0.5 ${
                          isGuide ? "text-amber-600" : "text-green-600"
                        }`}>
                          {line.speaker}
                        </span>
                        <div className="text-sm leading-relaxed">
                          {renderBody(line.body)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ContentBlur>
    </>
  );
}
