import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function requireAdmin(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const role = userDoc.data()?.role;
    if (role !== "admin") return null;
    return { uid: decoded.uid, name: (userDoc.data()?.name as string) || "Admin" };
  } catch {
    return null;
  }
}

// GET — admin lists all support requests
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "open", "closed", or null for all

  // Fetch all and filter client-side to avoid needing a composite index
  const snap = await adminDb.collection("supportRequests").orderBy("createdAt", "desc").limit(100).get();
  let requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (status) {
    requests = requests.filter((r) => (r as Record<string, unknown>).status === status);
  }

  return NextResponse.json(requests);
}

// POST — admin replies to a support request or sends a message to a user
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { requestId, message, closeTicket, sendToUid, notificationTitle } = body;

  // Case 1: Reply to an existing support request
  if (requestId && message) {
    const docRef = adminDb.collection("supportRequests").doc(requestId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = doc.data()!;
    const replies = (data.replies as Array<Record<string, string>>) || [];
    replies.push({
      from: "admin",
      adminName: admin.name,
      message,
      createdAt: new Date().toISOString(),
    });

    const updates: Record<string, unknown> = { replies };
    if (closeTicket) updates.status = "closed";

    await docRef.update(updates);

    // Notify the user
    const ticketNum = (data.ticketNumber as string) || "";
    await adminDb.collection("users").doc(data.uid as string).collection("notifications").add({
      type: "support_reply",
      title: ticketNum ? `Reply to ${ticketNum}` : "Reply to your support request",
      message: message.length > 100 ? message.slice(0, 100) + "…" : message,
      read: false,
      createdAt: new Date().toISOString(),
      linkTo: "/support",
    });

    return NextResponse.json({ ok: true });
  }

  // Case 2: Direct message to a specific user
  if (sendToUid && message) {
    await adminDb.collection("users").doc(sendToUid).collection("notifications").add({
      type: "admin_message",
      title: notificationTitle || "Message from CogniLift",
      message,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// PATCH — admin updates request status
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { requestId, status } = body;
  if (!requestId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await adminDb.collection("supportRequests").doc(requestId).update({ status });
  return NextResponse.json({ ok: true });
}
