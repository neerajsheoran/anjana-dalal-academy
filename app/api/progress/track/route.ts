import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ACTIVE_CHILD_COOKIE } from '@/lib/active-child';
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
  const { classId, subject, chapterId, chapterKey, chapterTitle } = body;

  if (!classId || !subject || !chapterId || !chapterTitle) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Record which child profile is actively reading. When parent mode
  // (no active child) the field is "parent" so the Continue card on
  // the kid home doesn't pull in the parent's own browsing. Decided
  // 2026-06-13: kid Continue must be per-profile, not per-account.
  const activeChildId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value || 'parent';

  try {
    // Doc ID encodes (childId, chapterId) so two kids on the same
    // family account each get their own progress row for the same
    // chapter. Old single-key docs (chapterId only) stay readable
    // through merge; new writes always use the prefixed key.
    const docId = `${activeChildId}__${chapterId}`;
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('progress')
      .doc(docId)
      .set(
        {
          classId,
          subject,
          chapterId,
          childId: activeChildId,
          ...(chapterKey ? { chapterKey } : {}),
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
