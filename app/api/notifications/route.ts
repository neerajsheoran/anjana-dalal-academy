import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function getUid(req: NextRequest): Promise<string | null> {
  const session = req.cookies.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET — list notifications for the current user
export async function GET(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json([], { status: 401 });

  const snap = await adminDb
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(notifications);
}

// PATCH — mark notification(s) as read
export async function PATCH(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } else if (notificationId) {
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc(notificationId)
      .update({ read: true });
  }

  return NextResponse.json({ ok: true });
}
