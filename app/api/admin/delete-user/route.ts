import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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

async function deleteDocs(
  collectionPath: string,
  field: string,
  value: string
) {
  const snap = await adminDb.collection(collectionPath).where(field, '==', value).get();
  await batchDelete(snap.docs.map((doc) => doc.ref));
}

async function deleteSubcollection(docPath: string, subcollection: string) {
  const snap = await adminDb.collection(`${docPath}/${subcollection}`).get();
  await batchDelete(snap.docs.map((doc) => doc.ref));
}

async function batchDelete(refs: FirebaseFirestore.DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 500) {
    const chunk = refs.slice(i, i + 500);
    const batch = adminDb.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function POST(req: Request) {
  const adminUid = await requireAdmin();
  if (!adminUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { uid, permanent } = await req.json();
  if (!uid || typeof uid !== 'string') {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  if (uid === adminUid) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  // Get user info for logging
  const userDoc = await adminDb.collection('users').doc(uid).get();
  const userName = (userDoc.data()?.name as string) || uid;

  try {
    if (permanent) {
      // Permanent delete — remove everything
      await deleteSubcollection(`users/${uid}`, 'progress');
      await deleteSubcollection(`users/${uid}`, 'quizAttempts');
      await deleteDocs('subscriptions', 'uid', uid);
      await deleteDocs('referralCodes', 'partnerUid', uid);
      await deleteDocs('payouts', 'partnerUid', uid);
      await deleteDocs('partnerApplications', 'uid', uid);
      await adminDb.collection('users').doc(uid).delete();

      try {
        await adminAuth.deleteUser(uid);
      } catch {
        // User might not exist in Auth
      }

      await logAdminAction({
        action: 'permanent_delete_user',
        adminUid,
        targetUid: uid,
        targetName: userName,
      });

      return NextResponse.json({ success: true, mode: 'permanent' });
    }

    // Soft delete — just mark the user
    await adminDb.collection('users').doc(uid).update({
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: adminUid,
    });

    await logAdminAction({
      action: 'delete_user',
      adminUid,
      targetUid: uid,
      targetName: userName,
    });

    return NextResponse.json({ success: true, mode: 'soft' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
