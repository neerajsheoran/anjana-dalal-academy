// POST /api/answer-flags
//
// A kid (or parent) taps "I think my answer was right" next to a
// fill-in-blank that was marked wrong. The flag lands in the answerFlags
// root collection for review. The matcher already accepts most variants —
// flags are the fall-through for cases it misses, AND a signal that a
// canonical answer in worksheet.json needs to be rewritten.
//
// Schema (Firestore root collection `answerFlags`):
//   uid               — parent account that logged the flag
//   activeChildId     — child profile if flagged in kid mode, else null
//   childName         — denormalised for review-queue convenience
//   questionId        — from worksheet.json
//   chapterId         — chapter the question lives in (best effort)
//   classId, subject  — navigation context
//   questionText      — actual question wording (captures it even if the
//                       worksheet is later edited and the question text
//                       changes)
//   userAnswer        — what the kid typed
//   expectedAnswer    — canonical answer at time of flag
//   status            — "pending" | "reviewed" | "fix-applied"
//   createdAt         — ISO timestamp
//
// TODO(parent UI): build a review surface at /admin (new "Answer Flags"
// tab) listing pending flags with one-click resolutions:
//   - "Accept this variant"  → adds to question.acceptedAlternatives in
//                              the source worksheet.json
//   - "Rewrite the answer"    → opens Keystatic editor for that question
//   - "Mark reviewed"         → status = reviewed, no content change
// Until that ships, admins can read the queue directly from Firestore
// (`answerFlags` where status == "pending").

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ACTIVE_CHILD_COOKIE } from "@/lib/active-child";

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const questionId = str(body.questionId, 200);
  const userAnswer = str(body.userAnswer);
  const expectedAnswer = str(body.expectedAnswer);
  if (!questionId || !userAnswer || !expectedAnswer) {
    return NextResponse.json(
      { error: "Missing questionId, userAnswer, or expectedAnswer" },
      { status: 400 },
    );
  }

  const activeChildId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value || null;

  // Best-effort: enrich with child name if in kid mode. Keeps the parent
  // dashboard from having to do a join later.
  let childName: string | null = null;
  if (activeChildId) {
    try {
      const childDoc = await adminDb
        .collection("users")
        .doc(uid)
        .collection("children")
        .doc(activeChildId)
        .get();
      childName = (childDoc.data()?.name as string | undefined) || null;
    } catch {
      // Non-fatal — leave childName null
    }
  }

  try {
    // Soft de-dupe: if this user already flagged the same question with the
    // same answer in the last 24h, don't create a duplicate. Cheap query
    // with no composite index needed (only one where clause + post-filter).
    const recentSnap = await adminDb
      .collection("answerFlags")
      .where("uid", "==", uid)
      .where("questionId", "==", questionId)
      .limit(10)
      .get();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const isDuplicate = recentSnap.docs.some((d) => {
      const data = d.data();
      const ts = Date.parse(String(data.createdAt || ""));
      return (
        Number.isFinite(ts) &&
        ts > cutoff &&
        String(data.userAnswer || "").trim().toLowerCase() ===
          userAnswer.trim().toLowerCase()
      );
    });
    if (isDuplicate) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const docRef = await adminDb.collection("answerFlags").add({
      uid,
      activeChildId,
      childName,
      questionId,
      chapterId: str(body.chapterId, 200) || null,
      classId: str(body.classId, 20) || null,
      subject: str(body.subject, 50) || null,
      questionText: str(body.questionText),
      userAnswer,
      expectedAnswer,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error("Failed to record answer flag:", err);
    return NextResponse.json(
      { error: "Failed to record flag" },
      { status: 500 },
    );
  }
}
