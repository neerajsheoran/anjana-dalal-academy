import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, city, reason } = body;

  if (!name || !email || !phone || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if user is logged in (optional — link to uid if available)
  let uid: string | null = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (session) {
      const decoded = await adminAuth.verifySessionCookie(session);
      uid = decoded.uid;
    }
  } catch {
    // Not logged in — that's fine
  }

  try {
    await adminDb.collection('partnerApplications').add({
      name,
      email,
      phone,
      city: city || '',
      reason,
      uid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to save partner application:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
