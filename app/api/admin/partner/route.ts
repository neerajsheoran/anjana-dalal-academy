import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin-log';

function generateReferralCode(name: string): string {
  const prefix = (name || 'PTR')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

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

    // If approved, find the user by uid or email and upgrade to partner
    if (action === 'approve') {
      let targetUid: string | null = data.uid || null;

      // If no uid linked, look up by email
      if (!targetUid && data.email) {
        const userSnap = await adminDb
          .collection('users')
          .where('email', '==', data.email)
          .limit(1)
          .get();
        if (!userSnap.empty) {
          targetUid = userSnap.docs[0].id;
        }
      }

      if (targetUid) {
        await adminDb.collection('users').doc(targetUid).update({ role: 'partner' });
      }

      // Generate referral code for the new partner
      let code = generateReferralCode(data.name || '');
      // Ensure uniqueness
      const existingCode = await adminDb.collection('referralCodes').doc(code).get();
      if (existingCode.exists) {
        code = generateReferralCode(data.name || '') + Math.floor(Math.random() * 10);
      }

      await adminDb.collection('referralCodes').doc(code).set({
        partnerUid: targetUid || '',
        partnerName: data.name || '',
        partnerEmail: data.email || '',
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        totalUses: 0,
      });

      // Store code on user doc if they have an account
      if (targetUid) {
        await adminDb.collection('users').doc(targetUid).update({ partnerCode: code });
      }
      // If no account yet, they'll get partner role on signup (handled in session route)
    }

    await logAdminAction({
      action: action === 'approve' ? 'approve_application' : 'reject_application',
      adminUid: admin,
      targetUid: data.uid || undefined,
      targetName: data.name || undefined,
      details: `Application ${applicationId} ${action === 'approve' ? 'approved' : 'rejected'}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to process partner application:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
