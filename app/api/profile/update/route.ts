import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifySessionCookie(session);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { name } = await req.json();
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const trimmed = name.trim();

  try {
    await adminDb.collection('users').doc(decoded.uid).update({ name: trimmed });
    await adminAuth.updateUser(decoded.uid, { displayName: trimmed });
    return NextResponse.json({ ok: true, name: trimmed });
  } catch (err) {
    console.error('Failed to update profile:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
