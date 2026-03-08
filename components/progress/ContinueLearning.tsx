'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RecentChapter {
  classId: string;
  subject: string;
  chapterId: string;
  chapterTitle: string;
  lastVisitedAt: string | null;
}

export default function ContinueLearning() {
  const [chapters, setChapters] = useState<RecentChapter[]>([]);

  useEffect(() => {
    fetch('/api/progress/recent')
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setChapters(data);
      })
      .catch(() => {
        /* not logged in or error — show nothing */
      });
  }, []);

  if (chapters.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 pb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Continue where you left off
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Pick up from your recent chapters
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {chapters.map((ch) => {
          const classLabel = ch.classId.replace('class-', 'Class ');
          const subjectLabel = ch.subject === 'maths' ? 'Maths' : 'Science';
          const subjectColor =
            ch.subject === 'maths'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-green-50 text-green-600';
          const timeAgo = ch.lastVisitedAt ? formatTimeAgo(ch.lastVisitedAt) : '';

          return (
            <Link
              key={ch.chapterId}
              href={`/class/${ch.classId}/${ch.subject}/${ch.chapterId}`}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subjectColor}`}>
                  {subjectLabel}
                </span>
                <span className="text-xs text-gray-400">{classLabel}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-snug">
                {ch.chapterTitle}
              </p>
              {timeAgo && (
                <p className="text-xs text-gray-400 mt-2">{timeAgo}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
