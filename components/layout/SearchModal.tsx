"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchEntry {
  id: string;
  title: string;
  classId: string;
  classLabel: string;
  subject: string;
  subjectLabel: string;
  headings: string[];
  snippet: string;
  url: string;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search index on first open
  useEffect(() => {
    if (!open || index.length > 0) return;
    setLoading(true);
    fetch("/api/search-index")
      .then((res) => res.json())
      .then((data) => setIndex(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, index.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  // Filter results
  const results = query.trim().length < 2
    ? []
    : index.filter((entry) => {
        const q = query.toLowerCase();
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.classLabel.toLowerCase().includes(q) ||
          entry.subjectLabel.toLowerCase().includes(q) ||
          entry.headings.some((h) => h.toLowerCase().includes(q)) ||
          entry.snippet.toLowerCase().includes(q)
        );
      }).slice(0, 10);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="Search (Ctrl+K)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline text-sm">Search</span>
        <kbd className="hidden sm:inline text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chapters, topics..."
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {loading && (
                <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {!loading && query.trim().length < 2 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  Type at least 2 characters to search
                </p>
              )}

              {results.map((entry) => {
                const subjectColor =
                  entry.subject === "maths"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-green-50 text-green-600";

                // Find matching heading if any
                const q = query.toLowerCase();
                const matchingHeading = entry.headings.find((h) =>
                  h.toLowerCase().includes(q)
                );

                return (
                  <button
                    key={entry.id}
                    onClick={() => navigate(entry.url)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${subjectColor}`}>
                        {entry.subjectLabel}
                      </span>
                      <span className="text-xs text-gray-400">{entry.classLabel}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {entry.title}
                    </p>
                    {matchingHeading && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Section: {matchingHeading}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
