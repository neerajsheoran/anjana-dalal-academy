import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { sendExtensionRequestEmail } from '@/lib/email';

export async function POST() {
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

  try {
    // Check if user already has a pending extension request
    const existing = await adminDb
      .collection('extensionRequests')
      .where('uid', '==', uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ ok: true, message: 'Already requested' });
    }

    // Get user info
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const userName = (userData.name as string) || 'Unknown';
    const userEmail = (userData.email as string) || '';

    // Save extension request
    await adminDb.collection('extensionRequests').add({
      uid,
      userName,
      userEmail,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send notification to all admins
    const admins = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    for (const admin of admins.docs) {
      await adminDb
        .collection('users')
        .doc(admin.id)
        .collection('notifications')
        .add({
          type: 'extension_request',
          title: 'Extension Request',
          message: `${userName} (${userEmail}) is requesting a trial extension.`,
          read: false,
          createdAt: new Date().toISOString(),
          linkTo: '/admin',
        });
    }

    // Send email to admin
    await sendExtensionRequestEmail(userName, userEmail);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to create extension request:', err);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
