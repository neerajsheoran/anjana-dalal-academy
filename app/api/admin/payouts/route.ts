import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
  const adminUid = await requireAdmin();
  if (!adminUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'markPaid') {
      const { partnerUid, subscriptionIds, amount, notes } = body;
      if (!partnerUid || !Array.isArray(subscriptionIds) || !amount) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      // Get partner info
      const partnerDoc = await adminDb.collection('users').doc(partnerUid).get();
      const partnerData = partnerDoc.data() || {};

      // Create payout record
      await adminDb.collection('payouts').add({
        partnerUid,
        partnerName: partnerData.name || '',
        partnerEmail: partnerData.email || '',
        amountINR: amount,
        subscriptionIds,
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        paidBy: adminUid,
        notes: notes || '',
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mark each subscription's commission as paid
      for (const subId of subscriptionIds) {
        await adminDb.collection('subscriptions').doc(subId).update({
          commissionPaid: true,
          commissionPaidAt: FieldValue.serverTimestamp(),
        });
      }

      await logAdminAction({
        action: 'mark_commission_paid',
        adminUid,
        targetUid: partnerUid,
        targetName: (partnerData.name as string) || partnerUid,
        details: `Paid ₹${amount} for ${subscriptionIds.length} subscription(s)`,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Payout action failed:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
