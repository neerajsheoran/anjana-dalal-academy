import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPlatformConfig } from '@/lib/subscription';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  // Authenticate
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

  const body = await req.json();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, referralCode } = body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
  }

  // Verify Razorpay signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  try {
    // Idempotency: check if subscription with this orderId already exists
    const existingSnap = await adminDb
      .collection('subscriptions')
      .where('razorpayOrderId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Already processed — return success
      const existing = existingSnap.docs[0].data();
      return NextResponse.json({
        ok: true,
        subscriptionEndsAt: existing.endsAt?.toDate?.() || null,
      });
    }

    const config = await getPlatformConfig();
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setFullYear(endsAt.getFullYear() + 1);

    // Look up referral code / partner
    let referredByUid: string | null = null;
    let validReferralCode: string | null = null;
    let commissionPercent = 0;
    let commissionAmountINR = 0;
    let discountPercent = 0;
    let discountAmountINR = 0;

    // Check referral code from payment, or fall back to user's existing referredBy
    const codeToCheck = referralCode?.toUpperCase();
    if (codeToCheck) {
      const codeDoc = await adminDb.collection('referralCodes').doc(codeToCheck).get();
      if (codeDoc.exists && codeDoc.data()?.isActive === true) {
        validReferralCode = codeToCheck;
        referredByUid = codeDoc.data()!.partnerUid;
        discountPercent = config.referralDiscountPercent;
        discountAmountINR = Math.round((config.yearlyPriceINR * discountPercent) / 100);
        commissionPercent = config.commissionPercent;
        // Commission is calculated on the amount actually paid (after discount)
        const paidAmount = config.yearlyPriceINR - discountAmountINR;
        commissionAmountINR = Math.round((paidAmount * commissionPercent) / 100);
      }
    } else {
      // Check if user was previously referred (for renewals)
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data()?.referredBy) {
        referredByUid = userDoc.data()!.referredBy;
        validReferralCode = userDoc.data()!.referralCode || null;
        discountPercent = config.referralDiscountPercent;
        discountAmountINR = Math.round((config.yearlyPriceINR * discountPercent) / 100);
        commissionPercent = config.commissionPercent;
        const paidAmount = config.yearlyPriceINR - discountAmountINR;
        commissionAmountINR = Math.round((paidAmount * commissionPercent) / 100);
      }
    }

    const finalAmountINR = config.yearlyPriceINR - discountAmountINR;

    // Create subscription document
    await adminDb.collection('subscriptions').add({
      uid,
      planType: 'yearly',
      amountINR: finalAmountINR,
      originalAmountINR: config.yearlyPriceINR,
      discountPercent,
      discountAmountINR,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: 'active',
      startsAt: now,
      endsAt,
      referralCode: validReferralCode,
      referredByUid,
      commissionPercent,
      commissionAmountINR,
      commissionPaid: false,
      commissionPaidAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update user document
    const userUpdate: Record<string, unknown> = {
      subscriptionStatus: 'active',
      subscriptionEndsAt: endsAt,
    };
    if (validReferralCode && referredByUid) {
      userUpdate.referredBy = referredByUid;
      userUpdate.referralCode = validReferralCode;
    }
    await adminDb.collection('users').doc(uid).update(userUpdate);

    // Increment referral code usage counter
    if (validReferralCode) {
      await adminDb
        .collection('referralCodes')
        .doc(validReferralCode)
        .update({ totalUses: FieldValue.increment(1) });
    }

    return NextResponse.json({ ok: true, subscriptionEndsAt: endsAt.toISOString() });
  } catch (err) {
    console.error('Payment verification failed:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
