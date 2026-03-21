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
  const { score, total, percentage, classId, subject, chapterIds, chapterTitles, difficulty } = body;

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
        chapterTitles: chapterTitles || [],
        difficulty,
        timestamp: FieldValue.serverTimestamp(),
      });

    // Mark chapters as completed when score >= 60%
    if (percentage >= 60 && Array.isArray(chapterIds)) {
      const titles = chapterTitles || [];
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
            completedAt: FieldValue.serverTimestamp(),
            bestScore: Math.max(percentage, existingBest),
            classId,
            subject,
            chapterId: chapId,
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
