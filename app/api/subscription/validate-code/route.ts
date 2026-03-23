import { adminDb } from '@/lib/firebase-admin';
import { getPlatformConfig } from '@/lib/subscription';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { referralCode } = body;

  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const code = referralCode.trim().toUpperCase();
  const codeDoc = await adminDb.collection('referralCodes').doc(code).get();

  if (!codeDoc.exists || codeDoc.data()?.isActive !== true) {
    return NextResponse.json({ valid: false });
  }

  const config = await getPlatformConfig();
  const discountPercent = config.referralDiscountPercent;
  const discountAmount = Math.round((config.yearlyPriceINR * discountPercent) / 100);
  const finalAmount = config.yearlyPriceINR - discountAmount;

  return NextResponse.json({
    valid: true,
    originalAmount: config.yearlyPriceINR,
    discountPercent,
    discountAmount,
    finalAmount,
  });
}
