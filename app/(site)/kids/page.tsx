// "Who's training today?" — profile picker after login.
// Server component fetches children + checks PIN status.
// Picker UI is a client component for PIN entry interaction.

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { ACTIVE_CHILD_COOKIE } from "@/lib/active-child";
import KidsPickerClient from "./KidsPickerClient";

interface ChildLite {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
}

async function loadKidsData(): Promise<{
  children: ChildLite[];
  hasPin: boolean;
  activeChildId: string | null;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login?from=/kids");

  const decoded = await adminAuth.verifySessionCookie(session);
  const uid = decoded.uid;
  const activeChildId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value || null;

  const [userDoc, childrenSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb
      .collection("users")
      .doc(uid)
      .collection("children")
      .orderBy("createdAt", "asc")
      .get(),
  ]);

  const children: ChildLite[] = childrenSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: (d.name as string) || "",
      age: (d.age as number) || 0,
      ageGroup: (d.ageGroup as string) || "foundation",
    };
  });

  const hasPin =
    typeof userDoc.data()?.childPinHash === "string" &&
    (userDoc.data()?.childPinHash as string).length > 0;

  return { children, hasPin, activeChildId };
}

export default async function KidsPage() {
  const { children, hasPin, activeChildId } = await loadKidsData();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Who&apos;s training today?
          </h1>
          <p className="text-gray-500 text-sm">
            Pick a profile to start, or stay in parent mode
          </p>
        </div>

        <KidsPickerClient
          children={children}
          hasPin={hasPin}
          activeChildId={activeChildId}
        />
      </div>
    </main>
  );
}
