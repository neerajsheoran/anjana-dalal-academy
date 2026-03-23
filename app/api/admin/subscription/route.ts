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

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'extendTrial') {
      const { uid, extendDays } = body;
      if (!uid || !extendDays || typeof extendDays !== 'number') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      const extendedUntil = new Date();
      extendedUntil.setDate(extendedUntil.getDate() + extendDays);
      await adminDb.collection('users').doc(uid).update({
        adminExtendedUntil: extendedUntil,
      });
      const userDoc = await adminDb.collection('users').doc(uid).get();
      await logAdminAction({
        action: 'extend_subscription',
        adminUid: admin,
        targetUid: uid,
        targetName: (userDoc.data()?.name as string) || uid,
        details: `Extended by ${extendDays} days until ${extendedUntil.toLocaleDateString('en-IN')}`,
      });
      return NextResponse.json({ ok: true, extendedUntil: extendedUntil.toISOString() });
    }

    if (action === 'updateConfig') {
      const update: Record<string, unknown> = {};
      if (typeof body.trialDays === 'number') update.trialDays = body.trialDays;
      if (typeof body.yearlyPriceINR === 'number') update.yearlyPriceINR = body.yearlyPriceINR;
      if (typeof body.commissionPercent === 'number') update.commissionPercent = body.commissionPercent;
      if (typeof body.razorpayEnabled === 'boolean') update.razorpayEnabled = body.razorpayEnabled;

      if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
      }

      await adminDb.doc('platformConfig/settings').set(update, { merge: true });
      await logAdminAction({
        action: 'update_config',
        adminUid: admin,
        details: `Updated: ${Object.keys(update).join(', ')}`,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Admin subscription action failed:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
