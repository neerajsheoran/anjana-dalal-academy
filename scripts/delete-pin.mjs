// One-off: clear the parent PIN on a single user, so the next /profile
// visit shows the empty PIN flow (helpful for testing the redesigned
// add-child + PIN form).
//
// Uses the same FIREBASE_ADMIN_* env vars as the app.
//
//   node --env-file=.env.local scripts/delete-pin.mjs <email>

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/delete-pin.mjs <email>');
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

try {
  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;
  console.log(`\nFound user ${email}  →  uid: ${uid}`);

  const ref = db.collection('users').doc(uid);
  const before = await ref.get();
  if (!before.exists) {
    console.log('users/{uid} doc does not exist. Nothing to delete.');
    process.exit(0);
  }

  const had = typeof before.data().childPinHash === 'string'
    && before.data().childPinHash.length > 0;
  if (!had) {
    console.log('No childPinHash set on this user — nothing to do.');
    process.exit(0);
  }

  await ref.update({
    childPinHash: FieldValue.delete(),
  });

  console.log('childPinHash deleted ✓');
  console.log('Refresh /profile to see the empty PIN flow.');
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`No Firebase Auth user found for ${email}`);
    process.exit(1);
  }
  console.error('Error:', err.message ?? err);
  process.exit(1);
}
