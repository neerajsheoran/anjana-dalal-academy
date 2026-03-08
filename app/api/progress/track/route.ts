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
  const { classId, subject, chapterId, chapterTitle } = body;

  if (!classId || !subject || !chapterId || !chapterTitle) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('progress')
      .doc(chapterId)
      .set(
        {
          classId,
          subject,
          chapterId,
          chapterTitle,
          lastVisitedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to track progress:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
