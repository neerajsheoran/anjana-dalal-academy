import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { razorpay } from '@/lib/razorpay';
import { getPlatformConfig } from '@/lib/subscription';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Authenticate
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let uid: string;
  let userName: string | undefined;
  let userEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    uid = decoded.uid;
    userName = decoded.name as string | undefined;
    userEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await req.json();
  const { referralCode } = body;

  // Check if user already has an active subscription
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const data = userDoc.data()!;
    if (data.subscriptionEndsAt) {
      const subEnd = data.subscriptionEndsAt.toDate();
      if (subEnd > new Date()) {
        return NextResponse.json(
          { error: 'You already have an active subscription' },
          { status: 400 }
        );
      }
    }
  }

  // Validate referral code if provided
  let validReferralCode: string | null = null;
  if (referralCode && typeof referralCode === 'string') {
    const codeDoc = await adminDb.collection('referralCodes').doc(referralCode.toUpperCase()).get();
    if (codeDoc.exists && codeDoc.data()?.isActive === true) {
      validReferralCode = referralCode.toUpperCase();
    }
    // Silently ignore invalid codes — don't block payment
  }

  // Get price from config
  const config = await getPlatformConfig();

  // Apply referral discount if valid code
  const originalAmount = config.yearlyPriceINR;
  const discountPercent = validReferralCode ? config.referralDiscountPercent : 0;
  const discountAmount = Math.round((originalAmount * discountPercent) / 100);
  const finalAmount = originalAmount - discountAmount;

  try {
    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: uid,
      notes: {
        uid,
        referralCode: validReferralCode || '',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount,
      originalAmount,
      discountAmount,
      discountPercent,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      userName,
      userEmail,
      referralCode: validReferralCode,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
