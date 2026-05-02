"use client";

import { useState, useRef } from "react";
import WorksheetView from "./WorksheetView";
import ContentBlur from "./ContentBlur";
import DiscussionAudio from "./DiscussionAudio";
import DiscussionChat from "./DiscussionChat";
import { WorksheetData, ContentAccessLevel } from "@/lib/types";

interface Heading {
  text: string;
  slug: string;
}

interface ChapterTabsProps {
  children: React.ReactNode; // pre-rendered MDX notes from server
  worksheet: WorksheetData | null;
  reviewContent: React.ReactNode | null;
  discussionContent: React.ReactNode | null;
  discussionSource?: string | null;
  accessLevel: ContentAccessLevel;
  currentPath: string;
  headings?: Heading[];
  worksheetTopics?: string[];
  chapterOrder?: number;
  classId?: string;
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

export default function ChapterTabs({ children, worksheet, reviewContent, discussionContent, discussionSource, accessLevel, currentPath, headings = [], worksheetTopics = [], chapterOrder, classId }: ChapterTabsProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "review" | "discussion" | "worksheet">("notes");
  const [jumpToTopic, setJumpToTopic] = useState<number | null>(null);
  const notesRef = useRef<HTMLDivElement>(null);
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
          Concepts
        </button>
        {reviewContent && (
          <button
            onClick={() => setActiveTab("review")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "review"
                ? "bg-white border border-b-white border-gray-200 text-green-700 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Quick Review
          </button>
        )}
        {discussionContent && (
          <button
            onClick={() => setActiveTab("discussion")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "discussion"
                ? "bg-white border border-b-white border-gray-200 text-purple-700 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Let&apos;s Discuss
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
          Practice
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "notes" && (
        <>
          <DiscussionAudio contentRef={notesRef} />
          {headings.length > 0 && (
            <nav className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">In this chapter</p>
              <ul className="space-y-1">
                {headings.map((h) => (
                    <li key={h.slug}>
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
                    </li>
                  ))}
              </ul>
            </nav>
          )}
          <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
            <ContentBlur accessLevel={accessLevel} currentPath={currentPath} chapterOrder={chapterOrder}>
              <div ref={notesRef}>
                {children}
              </div>
            </ContentBlur>
          </article>
        </>
      )}

      {activeTab === "review" && reviewContent && (
        <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
          <ContentBlur accessLevel={accessLevel} currentPath={currentPath} chapterOrder={chapterOrder}>
            {reviewContent}
          </ContentBlur>
        </article>
      )}

      {activeTab === "discussion" && (discussionSource || discussionContent) && (
        <article className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          {discussionSource ? (
            <DiscussionChat source={discussionSource} accessLevel={accessLevel} currentPath={currentPath} />
          ) : (
            <>
              <DiscussionAudio contentRef={discussionRef} />
              <div className="prose prose-slate max-w-none">
                <ContentBlur accessLevel={accessLevel} currentPath={currentPath} chapterOrder={chapterOrder}>
                  <div ref={discussionRef}>
                    {discussionContent}
                  </div>
                </ContentBlur>
              </div>
            </>
          )}
        </article>
      )}

      {activeTab === "worksheet" && (
        <WorksheetView worksheet={worksheet} accessLevel={accessLevel} currentPath={currentPath} initialTopicIndex={jumpToTopic} classId={classId} />
      )}
    </div>
  );
}
