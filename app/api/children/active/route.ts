// POST   /api/children/active  — enter kid mode (set activeChild cookie). Requires PIN if set.
// DELETE /api/children/active  — exit kid mode (clear activeChild cookie).

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyPin } from "@/lib/pin";
import { ACTIVE_CHILD_COOKIE } from "@/lib/active-child";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  let body: { childId?: unknown; pin?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const childId = typeof body.childId === "string" ? body.childId : "";
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!childId) {
    return NextResponse.json({ error: "Missing childId" }, { status: 400 });
  }

  try {
    // 1. Verify the child belongs to this parent
    const childDoc = await adminDb
      .collection("users")
      .doc(uid)
      .collection("children")
      .doc(childId)
      .get();
    if (!childDoc.exists) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // 2. Verify the parent's PIN if one is set
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const expectedHash = userDoc.data()?.childPinHash as string | undefined;
    if (expectedHash) {
      if (!pin || !verifyPin(pin, uid, expectedHash)) {
        return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
      }
    }

    // 3. Set the activeChild cookie (session-scoped, httpOnly, secure in prod)
    cookieStore.set(ACTIVE_CHILD_COOKIE, childId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to set active child:", err);
    return NextResponse.json({ error: "Failed to set active profile" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CHILD_COOKIE);
  return NextResponse.json({ ok: true });
}
