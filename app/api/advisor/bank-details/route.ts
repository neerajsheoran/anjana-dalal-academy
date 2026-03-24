import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

  // Verify user is an advisor or admin
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const role = userDoc.data()?.role;
  if (role !== 'partner' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { mobile, accountHolder, bankName, bankAccount, bankIFSC, pan } = body;

  try {
    await adminDb.collection('users').doc(uid).update({
      mobile: mobile?.trim() || null,
      accountHolder: accountHolder?.trim() || null,
      bankName: bankName?.trim() || null,
      bankAccount: bankAccount?.trim() || null,
      bankIFSC: bankIFSC?.trim().toUpperCase() || null,
      pan: pan?.trim().toUpperCase() || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to update bank details:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
