// Shared cleanup of a child's data across every place we persist it.
// Used by:
//   - DELETE /api/children/[childId]              (when removing a profile)
//   - DELETE /api/children/[childId]/attempts     (when resetting progress)
//   - scripts/audit-child-orphans.mjs             (one-time backfill for old data)
//
// As of 2026-06-13 a child's data is split across three stores:
//   1. users/{uid}/children/{childId}/attempts/* — brain-training attempts
//      (subcollection under the profile doc)
//   2. users/{uid}/progress/{childId}__{chapterId} — chapter reading + completion
//      (top-level user collection, composite doc-id)
//   3. users/{uid}/quizAttempts/* with childId field — quiz history
//
// This helper wipes (1)+(2)+(3). The caller decides whether to also delete
// the child profile doc itself (delete flow) or keep it (reset flow).

import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

const BATCH_LIMIT = 500;
// Firestore's documented high-code-point sentinel for doc-id prefix range
// queries: any id < `${prefix}<HIGH>` necessarily starts with prefix.
const HIGH_CODEPOINT = String.fromCharCode(0xf8ff);

async function deleteRefs(refs: FirebaseFirestore.DocumentReference[]) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const chunk = refs.slice(i, i + BATCH_LIMIT);
    const batch = adminDb.batch();
    chunk.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export interface ChildDataDeletionResult {
  attempts: number;
  progress: number;
  quizAttempts: number;
}

export async function deleteChildData(
  uid: string,
  childId: string,
): Promise<ChildDataDeletionResult> {
  const userRef = adminDb.collection("users").doc(uid);

  const attemptsSnap = await userRef
    .collection("children")
    .doc(childId)
    .collection("attempts")
    .get();
  await deleteRefs(attemptsSnap.docs.map((d) => d.ref));

  const prefix = `${childId}__`;
  const progressSnap = await userRef
    .collection("progress")
    .where(FieldPath.documentId(), ">=", prefix)
    .where(FieldPath.documentId(), "<", prefix + HIGH_CODEPOINT)
    .get();
  await deleteRefs(progressSnap.docs.map((d) => d.ref));

  const quizSnap = await userRef
    .collection("quizAttempts")
    .where("childId", "==", childId)
    .get();
  await deleteRefs(quizSnap.docs.map((d) => d.ref));

  return {
    attempts: attemptsSnap.size,
    progress: progressSnap.size,
    quizAttempts: quizSnap.size,
  };
}
