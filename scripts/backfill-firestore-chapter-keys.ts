// One-time Firestore backfill: add the new chapterKey field to existing
// documents in users/{uid}/quizAttempts, users/{uid}/progress, and
// users/{uid}/bookmarks.
//
// DO NOT RUN WITHOUT EXPLICIT CONFIRMATION. This script touches
// production data. Read the entire file before running.
//
// What it does:
//   1. Walks every user's subcollections
//   2. For each doc that has a chapterId but no chapterKey, looks up
//      the current chapterMeta by chapterId
//   3. If a matching chapter is found in our content registry, writes
//      that chapter's chapterKey onto the Firestore doc
//   4. For quiz attempts which have chapterIds[] (array), it writes a
//      parallel chapterKeys[] array
//
// What it does NOT do:
//   - Change document IDs (those stay keyed by slug for now)
//   - Touch any doc that already has a chapterKey
//   - Delete or modify any other fields
//   - Reverse the operation (no rollback script — Firestore exports
//     before running are your safety net)
//
// Requirements:
//   - Firebase Admin credentials available via the same env vars the
//     Next.js app uses (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
//     FIREBASE_PRIVATE_KEY)
//   - Run from project root: npx tsx scripts/backfill-firestore-chapter-keys.ts
//   - Pass --dry-run to see what would change without writing
//
// Recommended workflow:
//   1. Export Firestore data via gcloud (`gcloud firestore export ...`)
//      so you have a snapshot to restore from if anything goes wrong
//   2. Run with --dry-run first, check the summary
//   3. If the numbers look right, run without --dry-run
//   4. Spot-check a few docs in Firebase console
//
// This script is idempotent — re-running after a partial failure picks
// up where it left off (skips docs that already have chapterKey).

import { adminDb } from "../lib/firebase-admin";
import { getAllChapters } from "../lib/content";

const DRY_RUN = process.argv.includes("--dry-run");

interface Stats {
  usersScanned: number;
  quizAttemptsScanned: number;
  quizAttemptsUpdated: number;
  progressScanned: number;
  progressUpdated: number;
  bookmarksScanned: number;
  bookmarksUpdated: number;
  unresolved: number; // chapterIds with no matching chapter in content
}

const stats: Stats = {
  usersScanned: 0,
  quizAttemptsScanned: 0,
  quizAttemptsUpdated: 0,
  progressScanned: 0,
  progressUpdated: 0,
  bookmarksScanned: 0,
  bookmarksUpdated: 0,
  unresolved: 0,
};

// Pre-build a chapterId → chapterKey lookup
const chapters = getAllChapters();
const slugToKey = new Map<string, string>();
for (const c of chapters) {
  slugToKey.set(c.chapterId, c.chapterKey);
}
console.log(`Loaded ${slugToKey.size} chapters from content registry.`);
console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE (writes will happen)"}\n`);

async function processQuizAttempt(
  attemptRef: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
): Promise<void> {
  stats.quizAttemptsScanned++;
  if (Array.isArray(data.chapterKeys) && data.chapterKeys.length > 0) {
    return; // Already migrated
  }
  if (!Array.isArray(data.chapterIds) || data.chapterIds.length === 0) {
    return; // No chapter references to resolve
  }

  const newKeys: string[] = [];
  let anyResolved = false;
  for (const cid of data.chapterIds) {
    const key = slugToKey.get(cid);
    if (key) {
      newKeys.push(key);
      anyResolved = true;
    } else {
      // Slug no longer exists in content (likely renamed). Push the
      // slug itself as a placeholder so array length parity is kept.
      newKeys.push(cid);
      stats.unresolved++;
    }
  }
  if (!anyResolved) return;

  stats.quizAttemptsUpdated++;
  if (!DRY_RUN) {
    await attemptRef.update({ chapterKeys: newKeys });
  }
}

async function processProgressDoc(
  ref: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
): Promise<void> {
  stats.progressScanned++;
  if (data.chapterKey) return; // Already migrated
  const cid = data.chapterId || ref.id;
  const key = slugToKey.get(cid);
  if (!key) {
    stats.unresolved++;
    return;
  }
  stats.progressUpdated++;
  if (!DRY_RUN) {
    await ref.update({ chapterKey: key });
  }
}

async function processBookmarkDoc(
  ref: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
): Promise<void> {
  stats.bookmarksScanned++;
  if (data.chapterKey) return;
  const cid = data.chapterId || ref.id;
  const key = slugToKey.get(cid);
  if (!key) {
    stats.unresolved++;
    return;
  }
  stats.bookmarksUpdated++;
  if (!DRY_RUN) {
    await ref.update({ chapterKey: key });
  }
}

async function main(): Promise<void> {
  const usersSnap = await adminDb.collection("users").get();
  console.log(`Found ${usersSnap.size} users.\n`);

  for (const userDoc of usersSnap.docs) {
    stats.usersScanned++;
    const uid = userDoc.id;

    // Process quiz attempts
    const attemptsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("quizAttempts")
      .get();
    for (const d of attemptsSnap.docs) {
      await processQuizAttempt(d.ref, d.data());
    }

    // Process progress docs
    const progressSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("progress")
      .get();
    for (const d of progressSnap.docs) {
      await processProgressDoc(d.ref, d.data());
    }

    // Process bookmarks
    const bookmarksSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("bookmarks")
      .get();
    for (const d of bookmarksSnap.docs) {
      await processBookmarkDoc(d.ref, d.data());
    }

    if (stats.usersScanned % 25 === 0) {
      console.log(`  Processed ${stats.usersScanned} users...`);
    }
  }

  console.log("\n========== Backfill summary ==========");
  console.log(`Mode               : ${DRY_RUN ? "DRY RUN (nothing written)" : "LIVE"}`);
  console.log(`Users scanned      : ${stats.usersScanned}`);
  console.log("--- quizAttempts ---");
  console.log(`  Scanned          : ${stats.quizAttemptsScanned}`);
  console.log(`  Updated          : ${stats.quizAttemptsUpdated}`);
  console.log("--- progress ---");
  console.log(`  Scanned          : ${stats.progressScanned}`);
  console.log(`  Updated          : ${stats.progressUpdated}`);
  console.log("--- bookmarks ---");
  console.log(`  Scanned          : ${stats.bookmarksScanned}`);
  console.log(`  Updated          : ${stats.bookmarksUpdated}`);
  console.log("--- unresolved (chapterId not in current content) ---");
  console.log(`  Count            : ${stats.unresolved}`);
  console.log("======================================\n");

  if (DRY_RUN) {
    console.log(
      "This was a dry run. Re-run without --dry-run to apply the changes.",
    );
  } else {
    console.log("Backfill complete.");
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
