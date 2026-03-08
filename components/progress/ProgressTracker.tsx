'use client';

import { useEffect, useRef } from 'react';

export default function ProgressTracker({
  classId,
  subject,
  chapterId,
  chapterTitle,
}: {
  classId: string;
  subject: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch('/api/progress/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, subject, chapterId, chapterTitle }),
    }).catch(() => {
      /* silently ignore — not logged in or network error */
    });
  }, [classId, subject, chapterId, chapterTitle]);

  return null;
}
