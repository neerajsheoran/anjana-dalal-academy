'use client';

import { useEffect, useRef } from 'react';

export default function ProgressTracker({
  classId,
  subject,
  chapterId,
  chapterKey,
  chapterTitle,
}: {
  classId: string;
  subject: string;
  chapterId: string;
  // Stable identifier for the chapter — survives slug changes. Optional
  // for backward compatibility with any caller that hasn't been updated
  // yet; the API tolerates missing chapterKey.
  chapterKey?: string;
  chapterTitle: string;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch('/api/progress/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, subject, chapterId, chapterKey, chapterTitle }),
    }).catch(() => {
      /* silently ignore — not logged in or network error */
    });
  }, [classId, subject, chapterId, chapterKey, chapterTitle]);

  return null;
}
