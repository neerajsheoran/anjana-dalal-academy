// DELETE /api/children/[childId]/attempts
//   — wipe a single child's full history without removing the profile.
//   Brain attempts + chapter progress + quiz attempts all go. Profile stays
//   so the parent can hand the kid back a fresh-start account with the same
//   name, age, class, and PIN setup intact.

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { deleteChildData } from "@/lib/child-data";
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

    const deleted = await deleteChildData(uid, childId);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("Failed to reset child progress:", err);
    return NextResponse.json(
      { error: "Failed to reset progress" },
      { status: 500 },
    );
  }
}
