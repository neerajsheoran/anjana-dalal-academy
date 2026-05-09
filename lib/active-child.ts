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
  name: string;
  age: number;
  ageGroup: string;
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
      name: (d.name as string) || "",
      age: (d.age as number) || 0,
      ageGroup: (d.ageGroup as string) || "foundation",
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
