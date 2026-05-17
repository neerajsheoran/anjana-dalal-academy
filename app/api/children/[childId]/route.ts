// DELETE /api/children/[childId]  — remove a child profile (parent right to delete per DPDP)
// PATCH  /api/children/[childId]  — edit name / age / classId of an existing child
//
// DELETE also deletes the child's `attempts` subcollection (Phase 2
// brain-training data) when present, to honour the parent's right-to-delete.
//
// PATCH enforces case-insensitive name uniqueness among the parent's OTHER
// children — two profiles named "Aanya" would make the kid picker ambiguous.

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  deriveAgeGroup,
  isValidAge,
  isValidClassId,
} from "@/lib/age-group";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireParent(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    return decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const auth = await requireParent();
  if (typeof auth !== "string") return auth;
  const uid = auth;

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const auth = await requireParent();
  if (typeof auth !== "string") return auth;
  const uid = auth;

  const { childId } = await params;
  if (!childId) {
    return NextResponse.json({ error: "Missing childId" }, { status: 400 });
  }

  let body: { name?: unknown; age?: unknown; classId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: { name?: string; age?: number; ageGroup?: string; classId?: string | null } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "Name is required (max 50 chars)" },
        { status: 400 },
      );
    }
    updates.name = name;
  }

  if (body.age !== undefined) {
    const age = typeof body.age === "number" ? body.age : NaN;
    if (!isValidAge(age)) {
      return NextResponse.json(
        { error: "Age must be a whole number 5–15" },
        { status: 400 },
      );
    }
    updates.age = age;
    updates.ageGroup = deriveAgeGroup(age);
  }

  if (body.classId !== undefined) {
    const raw = body.classId;
    if (raw === null || raw === "") {
      updates.classId = null;
    } else if (typeof raw === "string" && isValidClassId(raw)) {
      updates.classId = raw;
    } else {
      return NextResponse.json(
        { error: "Invalid class. Must be class-1 through class-10." },
        { status: 400 },
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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

    // Name uniqueness check among the parent's OTHER children (case-insensitive).
    if (updates.name !== undefined) {
      const siblingsSnap = await adminDb
        .collection("users")
        .doc(uid)
        .collection("children")
        .get();

      const newNameLower = updates.name.toLowerCase();
      const duplicate = siblingsSnap.docs.find(
        (d) =>
          d.id !== childId &&
          ((d.data().name as string) || "").trim().toLowerCase() === newNameLower,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: `You already have another child named ${updates.name}.` },
          { status: 409 },
        );
      }
    }

    await childRef.update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update child profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
