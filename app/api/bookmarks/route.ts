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

// GET — list all bookmarks for the current user
export async function GET(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json([], { status: 401 });

  const snap = await adminDb
    .collection("users")
    .doc(uid)
    .collection("bookmarks")
    .orderBy("createdAt", "desc")
    .get();

  const bookmarks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(bookmarks);
}

// POST — add a bookmark
export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { classId, subject, chapterId, chapterKey, chapterTitle } = body;
  if (!classId || !subject || !chapterId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Doc ID stays as chapterId (slug) for now to keep existing bookmark
  // lookups working. chapterKey is stored as a field so we can re-key
  // by chapterKey in a future migration when ready.
  await adminDb
    .collection("users")
    .doc(uid)
    .collection("bookmarks")
    .doc(chapterId)
    .set({
      classId,
      subject,
      chapterId,
      ...(chapterKey ? { chapterKey } : {}),
      chapterTitle: chapterTitle || chapterId,
      createdAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}

// DELETE — remove a bookmark
export async function DELETE(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });
  }

  await adminDb
    .collection("users")
    .doc(uid)
    .collection("bookmarks")
    .doc(chapterId)
    .delete();

  return NextResponse.json({ ok: true });
}
