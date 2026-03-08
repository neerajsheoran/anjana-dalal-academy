import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

  const body = await req.json();
  const { applicationId, action } = body;

  if (!applicationId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const appRef = adminDb.collection('partnerApplications').doc(applicationId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const data = appDoc.data()!;

    // Update application status
    await appRef.update({ status: action === 'approve' ? 'approved' : 'rejected' });

    // If approved and the applicant has a uid, update their role to partner
    if (action === 'approve' && data.uid) {
      await adminDb.collection('users').doc(data.uid).update({ role: 'partner' });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to process partner application:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
