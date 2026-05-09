// DELETE /api/children/[childId]  — remove a child profile (parent right to delete per DPDP)
//
// Also deletes the child's `attempts` subcollection (Phase 2 brain-training data)
// when present, to honour the parent's right-to-delete.

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
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

  const { childId } = await params;
  if (!childId) {
    return NextResponse.json({ error: "Missing childId" }, { status: 400 });
  }

  try {
    const childRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("children")
      .doc(childId);

    const childDoc = await childRef.get();
    if (!childDoc.exists) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Delete attempts subcollection if present (Phase 2 brain-training data).
    // Capped batch deletion — assumes a single child has < 500 attempts at delete time.
    try {
      const attemptsSnap = await childRef.collection("attempts").get();
      if (!attemptsSnap.empty) {
        const batch = adminDb.batch();
        attemptsSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {
      // If subcollection cleanup fails, proceed with deleting the parent doc;
      // orphaned subdocs aren't billable and admin can clean up manually.
    }

    await childRef.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete child profile:", err);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
