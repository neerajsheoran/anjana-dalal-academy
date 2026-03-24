import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { uid, verified } = await req.json();

  if (!uid || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await adminDb.collection('users').doc(uid).update({
      phoneVerified: verified,
    });

    await logAdminAction({
      action: 'verify_phone',
      adminUid: admin,
      targetUid: uid,
      details: `Phone ${verified ? 'verified' : 'unverified'}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to update phone verification:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
