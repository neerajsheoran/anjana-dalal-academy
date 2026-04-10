import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendSupportRequestEmail } from "@/lib/email";

async function getUser(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    return {
      uid: decoded.uid,
      name: (userDoc.data()?.name as string) || decoded.email || "User",
      email: decoded.email || "",
    };
  } catch {
    return null;
  }
}

// Generate next ticket number atomically: CL-0001, CL-0002, ...
async function getNextTicketNumber(): Promise<string> {
  const counterRef = adminDb.collection("counters").doc("supportRequests");
  const result = await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const current = doc.exists ? (doc.data()?.next as number) || 1 : 1;
    tx.set(counterRef, { next: current + 1 }, { merge: true });
    return current;
  });
  return `CL-${String(result).padStart(4, "0")}`;
}

// POST — user submits a new support request OR replies to an existing one
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { category, subject, message, replyToRequestId } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Case 1: User replies to an existing support request
  if (replyToRequestId) {
    const docRef = adminDb.collection("supportRequests").doc(replyToRequestId);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.uid !== user.uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = doc.data()!;
    const replies = (data.replies as Array<Record<string, string>>) || [];
    replies.push({
      from: "user",
      message,
      createdAt: new Date().toISOString(),
    });

    await docRef.update({ replies, status: "open" });
    return NextResponse.json({ ok: true });
  }

  // Case 2: New support request
  if (!category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const ticketNumber = await getNextTicketNumber();

  const docRef = await adminDb.collection("supportRequests").add({
    uid: user.uid,
    userName: user.name,
    userEmail: user.email,
    category,
    subject: subject || "",
    message,
    status: "open",
    ticketNumber,
    createdAt: new Date().toISOString(),
    replies: [],
  });

  // Email admin about the new request (non-blocking)
  sendSupportRequestEmail(ticketNumber, user.name, user.email, category, message);

  // Also create a notification for the user confirming receipt
  await adminDb.collection("users").doc(user.uid).collection("notifications").add({
    type: "support",
    title: `Support request ${ticketNumber} received`,
    message: `We received your ${category} request. We'll get back to you soon.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/support`,
  });

  return NextResponse.json({ ok: true, id: docRef.id, ticketNumber });
}

// GET — user gets their own support requests
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json([], { status: 401 });

  // Use where-only query to avoid composite index requirement, sort client-side
  const snap = await adminDb
    .collection("supportRequests")
    .where("uid", "==", user.uid)
    .limit(20)
    .get();

  const requests = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => ((b as Record<string, string>).createdAt || "").localeCompare((a as Record<string, string>).createdAt || ""));
  return NextResponse.json(requests);
}
