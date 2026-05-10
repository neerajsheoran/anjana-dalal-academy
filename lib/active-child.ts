// Server-side helper for reading the currently active child profile.
// Active child is stored in an httpOnly session cookie set by /api/children/active.
//
// Usage in server components:
//   const active = await getActiveChild();
//   if (active) { /* in kid mode */ }

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "./firebase-admin";

export const ACTIVE_CHILD_COOKIE = "activeChild";

export interface ActiveChild {
  id: string;
  parentUid: string;
  name: string;
  age: number;
  ageGroup: string;
  classId: string | null;
}

export async function getActiveChild(): Promise<ActiveChild | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const activeId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value;
  if (!session || !activeId) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const childDoc = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("children")
      .doc(activeId)
      .get();
    if (!childDoc.exists) return null;
    const d = childDoc.data()!;
    return {
      id: childDoc.id,
      parentUid: decoded.uid,
      name: (d.name as string) || "",
      age: (d.age as number) || 0,
      ageGroup: (d.ageGroup as string) || "foundation",
      classId: (d.classId as string) || null,
    };
  } catch {
    return null;
  }
}

export async function hasChildren(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const snap = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("children")
      .limit(1)
      .get();
    return !snap.empty;
  } catch {
    return false;
  }
}

export interface ParentInfo {
  uid: string;
  firstName: string;
}

// Returns the logged-in parent's first name (from Firebase Auth displayName).
// Returns null when not signed in or session is invalid.
export async function getParent(): Promise<ParentInfo | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    const user = await adminAuth.getUser(decoded.uid);
    const display = (user.displayName || "").trim();
    const firstName = display ? display.split(/\s+/)[0] : "";
    return { uid: decoded.uid, firstName };
  } catch {
    return null;
  }
}
