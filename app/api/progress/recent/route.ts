import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json([], { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    uid = decoded.uid;
  } catch {
    return NextResponse.json([], { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('progress')
      .orderBy('lastVisitedAt', 'desc')
      .limit(3)
      .get();

    const chapters = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        classId: d.classId,
        subject: d.subject,
        chapterId: d.chapterId,
        chapterTitle: d.chapterTitle,
        lastVisitedAt: d.lastVisitedAt?.toDate?.()
          ? d.lastVisitedAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json(chapters);
  } catch (err) {
    console.error('Failed to fetch recent progress:', err);
    return NextResponse.json([], { status: 500 });
  }
}
