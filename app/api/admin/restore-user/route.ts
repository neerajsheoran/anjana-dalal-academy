import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin-log';

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const adminUid = await requireAdmin();
  if (!adminUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { uid } = await req.json();
  if (!uid || typeof uid !== 'string') {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = (userDoc.data()?.name as string) || uid;

    await adminDb.collection('users').doc(uid).update({
      deleted: FieldValue.delete(),
      deletedAt: FieldValue.delete(),
      deletedBy: FieldValue.delete(),
    });

    await logAdminAction({
      action: 'restore_user',
      adminUid,
      targetUid: uid,
      targetName: userName,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to restore user:', err);
    return NextResponse.json({ error: 'Failed to restore user' }, { status: 500 });
  }
}
