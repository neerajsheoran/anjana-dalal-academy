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
  const {
    score,
    total,
    percentage,
    classId,
    subject,
    chapterIds,
    chapterKeys,
    chapterTitles,
    difficulty,
    timeTaken,
  } = body;

  if (
    typeof score !== 'number' ||
    typeof total !== 'number' ||
    typeof percentage !== 'number' ||
    !classId ||
    !subject ||
    !Array.isArray(chapterIds) ||
    !difficulty
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    // chapterIds[] stays for backward compatibility with the existing
    // history UI. chapterKeys[] is the new canonical reference — both
    // are written when the client provides them. Older clients that
    // don't yet send chapterKeys still work; their attempts just lack
    // the stable reference (a Firestore migration script can backfill
    // those later — see scripts/backfill-firestore-chapter-keys.ts).
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('quizAttempts')
      .add({
        score,
        total,
        percentage,
        classId,
        subject,
        chapterIds,
        ...(Array.isArray(chapterKeys) ? { chapterKeys } : {}),
        chapterTitles: chapterTitles || [],
        difficulty,
        ...(typeof timeTaken === 'number' ? { timeTaken } : {}),
        timestamp: FieldValue.serverTimestamp(),
      });

    // Mark chapters as quiz-passed when score >= 80%
    if (percentage >= 80 && Array.isArray(chapterIds)) {
      const titles = chapterTitles || [];
      const keys: string[] = Array.isArray(chapterKeys) ? chapterKeys : [];
      for (let i = 0; i < chapterIds.length; i++) {
        const chapId = chapterIds[i];
        const progressRef = adminDb
          .collection('users')
          .doc(uid)
          .collection('progress')
          .doc(chapId);

        const existing = await progressRef.get();
        const existingBest = existing.exists ? (existing.data()?.bestScore ?? 0) : 0;

        await progressRef.set(
          {
            completed: true,
            completedBy: 'quiz',
            completedAt: FieldValue.serverTimestamp(),
            bestScore: Math.max(percentage, existingBest),
            classId,
            subject,
            chapterId: chapId,
            ...(keys[i] ? { chapterKey: keys[i] } : {}),
            chapterTitle: titles[i] || chapId,
          },
          { merge: true }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to save quiz attempt:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
