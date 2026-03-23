import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin-log';

const ALLOWED_ROLES = ['student', 'teacher', 'partner'];

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Verify caller is admin
  try {
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
  }

  const body = await req.json();
  const { uid, role } = body;

  if (!uid || typeof uid !== 'string' || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userName = (userDoc.data()?.name as string) || uid;
    await adminDb.collection('users').doc(uid).update({ role });
    await logAdminAction({
      action: 'change_role',
      adminUid: callerUid,
      targetUid: uid,
      targetName: userName,
      details: `Changed role to ${role}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to update role:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
