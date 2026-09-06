// One-off: look up a user by email and print their subscription state.
// Uses the same FIREBASE_ADMIN_* env vars as the app.
//
//   node scripts/check-subscription.mjs nidhimann@gmail.com

// Run with:  node --env-file=.env.local scripts/check-subscription.mjs <email>
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check-subscription.mjs <email>');
  process.exit(2);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

function pad(d) {
  return d ? d.toISOString().replace('T', ' ').slice(0, 19) : '-';
}

function deriveAccessLevel(data, now) {
  if (!data) return 'anonymous';
  if (data.role === 'admin') return 'admin';
  if (data.adminExtendedUntil) {
    const t = data.adminExtendedUntil.toDate();
    if (t > now) return 'subscribed (admin-extended)';
  }
  if (data.subscriptionEndsAt) {
    const t = data.subscriptionEndsAt.toDate();
    if (t > now) return 'subscribed';
  }
  if (data.trialEndsAt) {
    const t = data.trialEndsAt.toDate();
    if (t > now) return 'trial';
  }
  return 'expired';
}

try {
  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;
  console.log(`\n=== ${email} ===`);
  console.log(`UID:               ${uid}`);
  console.log(`Email verified:    ${userRecord.emailVerified}`);
  console.log(`Created:           ${pad(new Date(userRecord.metadata.creationTime))}`);
  console.log(`Last sign-in:      ${pad(new Date(userRecord.metadata.lastSignInTime))}`);

  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) {
    console.log('\nFirestore users/{uid} doc: DOES NOT EXIST');
    console.log('Access level:      anonymous (no profile)');
    process.exit(0);
  }
  const d = doc.data();
  const now = new Date();
  console.log(`\nRole:              ${d.role ?? '(none)'}`);
  console.log(`Name:              ${d.name ?? '(none)'}`);
  console.log(`Provider:          ${d.provider ?? '(none)'}`);
  console.log(`Trial ends at:     ${pad(d.trialEndsAt?.toDate?.())}`);
  console.log(`Subscription ends: ${pad(d.subscriptionEndsAt?.toDate?.())}`);
  console.log(`Admin-extended:    ${pad(d.adminExtendedUntil?.toDate?.())}`);
  console.log(`Referral code:     ${d.referralCode ?? '(none)'}`);
  console.log(`Referred by:       ${d.referredBy ?? '(none)'}`);
  console.log(`Deleted:           ${d.deleted ? 'YES (soft-deleted)' : 'no'}`);

  const level = deriveAccessLevel(d, now);
  console.log(`\n>>> Access level: ${level}`);
  console.log(`>>> hasFullAccess: ${level === 'trial' || level === 'subscribed' || level === 'subscribed (admin-extended)' || level === 'admin'}`);
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`No Firebase Auth user found for ${email}`);
    process.exit(1);
  }
  console.error('Error:', err.message ?? err);
  process.exit(1);
}
