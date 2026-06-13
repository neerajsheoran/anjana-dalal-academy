// One-off: find and (optionally) clean up orphaned child data left behind
// by deletions that happened BEFORE the shared deleteChildData helper landed
// (commit 1c87c0c+ on 2026-06-13).
//
// "Orphan" = a doc in users/{uid}/progress or users/{uid}/quizAttempts whose
// childId no longer exists in users/{uid}/children. Brain attempts are
// already cleaned up reliably because they live as a subcollection under
// the child profile doc — when the doc went away, so did the subcollection.
//
// Usage:
//   # Dry run (prints what would be deleted, deletes nothing):
//   node --env-file=.env.local scripts/audit-child-orphans.mjs
//
//   # Actually delete the orphans:
//   node --env-file=.env.local scripts/audit-child-orphans.mjs --apply
//
//   # Just one user:
//   node --env-file=.env.local scripts/audit-child-orphans.mjs --uid=<UID>
//   node --env-file=.env.local scripts/audit-child-orphans.mjs --uid=<UID> --apply

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const uidArg = args.find((a) => a.startsWith('--uid='));
const ONLY_UID = uidArg ? uidArg.slice('--uid='.length) : null;

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const BATCH_LIMIT = 500;

async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const chunk = refs.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

// Pull every doc-id from `progress` for a user and group by childId prefix.
// Pre-childId docs (no `__` in id) are categorised as `legacy:parent`.
async function scanProgress(uid) {
  const snap = await db.collection('users').doc(uid).collection('progress').get();
  const byChild = new Map(); // childId -> DocRef[]
  for (const doc of snap.docs) {
    const idx = doc.id.indexOf('__');
    const owner = idx > 0 ? doc.id.slice(0, idx) : 'legacy:parent';
    if (!byChild.has(owner)) byChild.set(owner, []);
    byChild.get(owner).push(doc.ref);
  }
  return byChild;
}

async function scanQuizAttempts(uid) {
  const snap = await db.collection('users').doc(uid).collection('quizAttempts').get();
  const byChild = new Map();
  for (const doc of snap.docs) {
    const owner = doc.data().childId || 'legacy:parent';
    if (!byChild.has(owner)) byChild.set(owner, []);
    byChild.get(owner).push(doc.ref);
  }
  return byChild;
}

async function getLiveChildIds(uid) {
  const snap = await db.collection('users').doc(uid).collection('children').get();
  return new Set(snap.docs.map((d) => d.id));
}

async function auditUser(uid) {
  const [live, progressByChild, quizByChild] = await Promise.all([
    getLiveChildIds(uid),
    scanProgress(uid),
    scanQuizAttempts(uid),
  ]);

  const orphanProgress = [];
  const orphanQuiz = [];
  const orphanChildIds = new Set();

  for (const [owner, refs] of progressByChild) {
    if (owner === 'legacy:parent') continue; // legacy parent-stamped docs, leave alone
    if (!live.has(owner)) {
      orphanChildIds.add(owner);
      orphanProgress.push(...refs);
    }
  }
  for (const [owner, refs] of quizByChild) {
    if (owner === 'legacy:parent' || owner === 'parent') continue;
    if (!live.has(owner)) {
      orphanChildIds.add(owner);
      orphanQuiz.push(...refs);
    }
  }

  return { uid, orphanChildIds, orphanProgress, orphanQuiz };
}

async function main() {
  const mode = APPLY ? 'APPLY (deleting)' : 'DRY RUN (no deletes)';
  console.log(`Audit mode: ${mode}`);

  let userIds;
  if (ONLY_UID) {
    userIds = [ONLY_UID];
  } else {
    const snap = await db.collection('users').get();
    userIds = snap.docs.map((d) => d.id);
    console.log(`Scanning ${userIds.length} users...`);
  }

  let totalProgress = 0;
  let totalQuiz = 0;
  let usersAffected = 0;

  for (const uid of userIds) {
    const r = await auditUser(uid);
    if (r.orphanProgress.length === 0 && r.orphanQuiz.length === 0) continue;
    usersAffected++;
    totalProgress += r.orphanProgress.length;
    totalQuiz += r.orphanQuiz.length;
    console.log(
      `  ${uid}: childIds=${[...r.orphanChildIds].join(',')} ` +
      `progress=${r.orphanProgress.length} quiz=${r.orphanQuiz.length}`,
    );
    if (APPLY) {
      await deleteRefs(r.orphanProgress);
      await deleteRefs(r.orphanQuiz);
    }
  }

  console.log('---');
  console.log(`Users affected:     ${usersAffected}`);
  console.log(`Orphan progress:    ${totalProgress}`);
  console.log(`Orphan quizAttempts:${totalQuiz}`);
  if (!APPLY && (totalProgress > 0 || totalQuiz > 0)) {
    console.log('\nRe-run with --apply to delete the above.');
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
