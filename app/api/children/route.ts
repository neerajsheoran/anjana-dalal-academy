// GET  /api/children  — list children for the authenticated parent
// POST /api/children  — create a new child profile under the parent
//
// Per cognilift-privacy-consent.md: kids never have their own Firebase Auth
// account; profiles live as `users/{parentUid}/children/{childId}` and require
// explicit parental consent at creation time (DPDP).

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { deriveAgeGroup, isValidAge } from "@/lib/age-group";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

async function requireParent(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    return decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}

export async function GET() {
  const auth = await requireParent();
  if (typeof auth !== "string") return auth;
  const uid = auth;

  try {
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("children")
      .orderBy("createdAt", "asc")
      .get();

    const children = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: (d.name as string) || "",
        age: (d.age as number) || 0,
        ageGroup: (d.ageGroup as string) || "foundation",
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return NextResponse.json({ children });
  } catch (err) {
    console.error("Failed to list children:", err);
    return NextResponse.json({ error: "Failed to load children" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireParent();
  if (typeof auth !== "string") return auth;
  const uid = auth;

  let body: { name?: unknown; age?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = typeof body.age === "number" ? body.age : NaN;
  const consent = body.consent === true;

  if (!name || name.length > 50) {
    return NextResponse.json({ error: "Name is required (max 50 chars)" }, { status: 400 });
  }
  if (!isValidAge(age)) {
    return NextResponse.json({ error: "Age must be a whole number 5–15" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json(
      { error: "Parental consent is required (DPDP)" },
      { status: 400 }
    );
  }

  try {
    const docRef = await adminDb
      .collection("users")
      .doc(uid)
      .collection("children")
      .add({
        name,
        age,
        ageGroup: deriveAgeGroup(age),
        consentGiven: true,
        consentAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error("Failed to create child profile:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
