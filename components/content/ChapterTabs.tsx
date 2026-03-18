"use client";

import { useState } from "react";
import WorksheetView from "./WorksheetView";
import ContentBlur from "./ContentBlur";
import { WorksheetData } from "@/lib/types";

interface ChapterTabsProps {
  children: React.ReactNode; // pre-rendered MDX notes from server
  worksheet: WorksheetData | null;
  discussionContent: React.ReactNode | null;
  isLoggedIn: boolean;
  currentPath: string;
}

export default function ChapterTabs({ children, worksheet, discussionContent, isLoggedIn, currentPath }: ChapterTabsProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "discussion" | "worksheet">("notes");

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
        <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
          <ContentBlur isLoggedIn={isLoggedIn} currentPath={currentPath}>
            {children}
          </ContentBlur>
        </article>
      )}

      {activeTab === "discussion" && discussionContent && (
        <article className="bg-white border border-gray-200 rounded-xl p-8 prose prose-slate max-w-none">
          <ContentBlur isLoggedIn={isLoggedIn} currentPath={currentPath}>
            {discussionContent}
          </ContentBlur>
        </article>
      )}

      {activeTab === "worksheet" && (
        <WorksheetView worksheet={worksheet} isLoggedIn={isLoggedIn} currentPath={currentPath} />
      )}
    </div>
  );
}
