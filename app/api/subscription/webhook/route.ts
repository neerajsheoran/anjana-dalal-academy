import { adminDb } from '@/lib/firebase-admin';
import { getPlatformConfig } from '@/lib/subscription';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Only handle payment.captured events
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  const orderId = payment.order_id;
  const paymentId = payment.id;
  const uid = payment.notes?.uid;

  if (!orderId || !uid) {
    return NextResponse.json({ ok: true });
  }

  try {
    // Idempotency: check if already processed
    const existingSnap = await adminDb
      .collection('subscriptions')
      .where('razorpayOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Already processed by verify-payment route
      return NextResponse.json({ ok: true });
    }

    // Safety net: activate subscription
    const config = await getPlatformConfig();
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setFullYear(endsAt.getFullYear() + 1);

    const referralCode = payment.notes?.referralCode || null;
    let referredByUid: string | null = null;
    let commissionPercent = 0;
    let commissionAmountINR = 0;

    if (referralCode) {
      const codeDoc = await adminDb.collection('referralCodes').doc(referralCode).get();
      if (codeDoc.exists && codeDoc.data()?.isActive === true) {
        referredByUid = codeDoc.data()!.partnerUid;
        commissionPercent = config.commissionPercent;
        commissionAmountINR = Math.round((config.yearlyPriceINR * commissionPercent) / 100);
      }
    }

    await adminDb.collection('subscriptions').add({
      uid,
      planType: 'yearly',
      amountINR: config.yearlyPriceINR,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: '',
      status: 'active',
      startsAt: now,
      endsAt,
      referralCode,
      referredByUid,
      commissionPercent,
      commissionAmountINR,
      commissionPaid: false,
      commissionPaidAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    const userUpdate: Record<string, unknown> = {
      subscriptionStatus: 'active',
      subscriptionEndsAt: endsAt,
    };
    if (referralCode && referredByUid) {
      userUpdate.referredBy = referredByUid;
      userUpdate.referralCode = referralCode;
    }
    await adminDb.collection('users').doc(uid).update(userUpdate);

    if (referralCode) {
      await adminDb
        .collection('referralCodes')
        .doc(referralCode)
        .update({ totalUses: FieldValue.increment(1) });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
