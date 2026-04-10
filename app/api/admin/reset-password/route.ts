import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
    const userRecord = await adminAuth.getUser(uid);
    if (!userRecord.email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    // Check if user signed up with email/password (not Google-only)
    const hasPasswordProvider = userRecord.providerData.some(
      (p) => p.providerId === 'password'
    );
    if (!hasPasswordProvider) {
      return NextResponse.json(
        { error: 'User signed in with Google — no password to reset' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: userRecord.email,
        }),
      }
    );

    if (!res.ok) {
      console.error('Firebase REST API error:', await res.text());
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    await logAdminAction({
      action: 'send_password_reset',
      adminUid,
      targetUid: uid,
      targetName: userRecord.displayName || userRecord.email,
    });

    return NextResponse.json({ ok: true, email: userRecord.email });
  } catch (err) {
    console.error('Failed to send password reset:', err);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
