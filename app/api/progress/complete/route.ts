import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await req.json();
  const { classId, subject, chapterId, chapterKey, chapterTitle, completed } = body;

  if (!classId || !subject || !chapterId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const progressRef = adminDb
      .collection('users')
      .doc(uid)
      .collection('progress')
      .doc(chapterId);

    if (completed) {
      // Mark as manually completed (don't overwrite quiz completion)
      const existing = await progressRef.get();
      if (existing.exists && existing.data()?.completedBy === 'quiz') {
        return NextResponse.json({ error: 'Already quiz-passed' }, { status: 400 });
      }

      await progressRef.set(
        {
          completed: true,
          completedBy: 'manual',
          completedAt: FieldValue.serverTimestamp(),
          classId,
          subject,
          chapterId,
          ...(chapterKey ? { chapterKey } : {}),
          chapterTitle: chapterTitle || chapterId,
        },
        { merge: true }
      );
    } else {
      // Unmark manual completion (don't allow un-marking quiz completion)
      const existing = await progressRef.get();
      if (existing.exists && existing.data()?.completedBy === 'quiz') {
        return NextResponse.json({ error: 'Cannot unmark quiz-passed' }, { status: 400 });
      }

      await progressRef.set(
        {
          completed: false,
          completedBy: FieldValue.delete(),
          completedAt: FieldValue.delete(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to toggle completion:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
