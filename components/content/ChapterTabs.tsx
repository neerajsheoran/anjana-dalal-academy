"use client";

import { useState, useRef } from "react";
import WorksheetView from "./WorksheetView";
import ContentBlur from "./ContentBlur";
import DiscussionAudio from "./DiscussionAudio";
import { WorksheetData, ContentAccessLevel } from "@/lib/types";

interface Heading {
  text: string;
  slug: string;
}

interface ChapterTabsProps {
  children: React.ReactNode; // pre-rendered MDX notes from server
  worksheet: WorksheetData | null;
  discussionContent: React.ReactNode | null;
  accessLevel: ContentAccessLevel;
  currentPath: string;
  headings?: Heading[];
  worksheetTopics?: string[];
}

function findMatchingTopicIndex(heading: string, topics: string[]): number {
  const h = heading.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i].toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (h === t || h.includes(t) || t.includes(h)) return i;
    // Check if most words match
    const hWords = h.split(/\s+/);
    const tWords = t.split(/\s+/);
    const overlap = hWords.filter((w) => tWords.includes(w)).length;
    if (overlap >= Math.min(2, Math.min(hWords.length, tWords.length))) return i;
  }
  return -1;
}

export default function ChapterTabs({ children, worksheet, discussionContent, accessLevel, currentPath, headings = [], worksheetTopics = [] }: ChapterTabsProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "discussion" | "worksheet">("notes");
  const [jumpToTopic, setJumpToTopic] = useState<number | null>(null);
  const discussionRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === "notes"
              ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Notes
        </button>
        {discussionContent && (
          <button
            onClick={() => setActiveTab("discussion")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "discussion"
                ? "bg-white border border-b-white border-gray-200 text-purple-700 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Discussion
          </button>
        )}
        <button
          onClick={() => setActiveTab("worksheet")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === "worksheet"
              ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Worksheet
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "notes" && (
        <>
          {headings.length > 0 && (
            <nav className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">In this chapter</p>
              <ul className="space-y-1">
                {headings.map((h) => {
                  const topicIdx = findMatchingTopicIndex(h.text, worksheetTopics);
                  return (
                    <li key={h.slug} className="flex items-center justify-between gap-2">
                      <a
                        href={`#${h.slug}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.slug)?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {h.text}
                      </a>
                      {topicIdx >= 0 && (
                        <button
                          onClick={() => {
                            setJumpToTopic(topicIdx);
                            setActiveTab("worksheet");
                          }}
                          className="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                          Practice
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
            <ContentBlur accessLevel={accessLevel} currentPath={currentPath}>
              {children}
            </ContentBlur>
          </article>
        </>
      )}

      {activeTab === "discussion" && discussionContent && (
        <>
          <DiscussionAudio contentRef={discussionRef} />
          <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
            <ContentBlur accessLevel={accessLevel} currentPath={currentPath}>
              <div ref={discussionRef}>
                {discussionContent}
              </div>
            </ContentBlur>
          </article>
        </>
      )}

      {activeTab === "worksheet" && (
        <WorksheetView worksheet={worksheet} accessLevel={accessLevel} currentPath={currentPath} initialTopicIndex={jumpToTopic} />
      )}
    </div>
  );
}
