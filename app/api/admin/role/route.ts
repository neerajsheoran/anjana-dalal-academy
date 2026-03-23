import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin-log';

function generateReferralCode(name: string): string {
  const prefix = (name || 'PTR')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

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
    const userData = userDoc.data();
    const userName = (userData?.name as string) || uid;
    const userEmail = (userData?.email as string) || '';
    await adminDb.collection('users').doc(uid).update({ role });

    // When setting role to partner, auto-generate a referral code if they don't have one
    if (role === 'partner' && !userData?.partnerCode) {
      let code = generateReferralCode(userName);
      const existingCode = await adminDb.collection('referralCodes').doc(code).get();
      if (existingCode.exists) {
        code = generateReferralCode(userName) + Math.floor(Math.random() * 10);
      }

      await adminDb.collection('referralCodes').doc(code).set({
        partnerUid: uid,
        partnerName: userName,
        partnerEmail: userEmail,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        totalUses: 0,
      });

      await adminDb.collection('users').doc(uid).update({ partnerCode: code });
    }

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
