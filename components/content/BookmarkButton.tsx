"use client";

import { useState, useEffect } from "react";

interface BookmarkButtonProps {
  classId: string;
  subject: string;
  chapterId: string;
  chapterTitle: string;
}

export default function BookmarkButton({ classId, subject, chapterId, chapterTitle }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if this chapter is already bookmarked
  useEffect(() => {
    fetch("/api/bookmarks")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((bookmarks: { chapterId: string }[]) => {
        setBookmarked(bookmarks.some((b) => b.chapterId === chapterId));
      })
      .catch(() => {
        // Not logged in or error — hide loading
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (bookmarked) {
        await fetch(`/api/bookmarks?chapterId=${encodeURIComponent(chapterId)}`, { method: "DELETE" });
        setBookmarked(false);
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, subject, chapterId, chapterTitle }),
        });
        setBookmarked(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading && !bookmarked) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        bookmarked
          ? "bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100"
          : "bg-white/10 text-white/80 border border-white/30 hover:bg-white/20 hover:text-white"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
      title={bookmarked ? "Remove bookmark" : "Bookmark this chapter"}
    >
      <svg
        className="w-4 h-4"
        fill={bookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
