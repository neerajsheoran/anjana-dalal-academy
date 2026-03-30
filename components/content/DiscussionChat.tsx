"use client";

import { useRef } from "react";
import DiscussionAudio from "./DiscussionAudio";
import ContentBlur from "./ContentBlur";
import { ContentAccessLevel } from "@/lib/types";

interface ChatLine {
  speaker: "Mother" | "Child";
  text: string;
}

interface Section {
  heading: string | null;
  lines: ChatLine[];
}

function parseDiscussion(source: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { heading: null, lines: [] };

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line === "---") continue;

    // Heading
    if (line.startsWith("## ")) {
      if (currentSection.heading || currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: line.replace(/^## /, ""), lines: [] };
      continue;
    }

    // Dialogue line: **Mother:** or **Child:**
    const match = line.match(/^\*\*(Mother|Child):\*\*\s*(.+)/);
    if (match) {
      currentSection.lines.push({
        speaker: match[1] as "Mother" | "Child",
        text: match[2],
      });
    }
  }

  if (currentSection.heading || currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

// Render inline markdown bold **text** to <strong>
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
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
                  const isMother = line.speaker === "Mother";
                  return (
                    <div
                      key={li}
                      className={`flex items-end gap-2 ${isMother ? "flex-row" : "flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${
                          isMother
                            ? "bg-amber-100"
                            : "bg-green-100"
                        }`}
                        title={line.speaker}
                      >
                        {isMother ? "👩" : "🧒"}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`relative max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMother
                            ? "bg-amber-50 text-gray-800 rounded-bl-md"
                            : "bg-green-50 text-gray-800 rounded-br-md"
                        }`}
                      >
                        <span className={`block text-[10px] font-bold mb-0.5 ${
                          isMother ? "text-amber-600" : "text-green-600"
                        }`}>
                          {line.speaker}
                        </span>
                        <p className="m-0">{renderText(line.text)}</p>
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
