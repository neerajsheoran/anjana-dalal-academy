import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'session';
const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(req: Request) {
  const { idToken } = await req.json();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: FIVE_DAYS_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    // Create Firestore user document on first login (non-blocking)
    try {
      const userRef = adminDb.collection('users').doc(decoded.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          role: 'student',
          name: decoded.name || null,
          email: decoded.email || null,
          createdAt: new Date(),
        });
      }
    } catch {
      // Firestore errors should not block login
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
