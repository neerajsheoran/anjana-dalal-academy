// /family — dedicated page for "who can use this account and how":
//   1. Parent PIN (always visible — even with zero kids)
//   2. Children profiles (gated: PIN must exist before adding a kid)
//
// Decided 2026-06-13 with user: PIN + Children belong together because
// they're two halves of the same decision. Keeping them on /profile
// mixed with account/password/subscription made the PIN invisible
// once a parent deleted all kids (leaving a hidden PIN they couldn't
// see or change). Promoting both to their own page fixes that.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirectIfInKidMode } from "@/lib/active-child";
import PinSection from "@/components/profile/PinSection";
import ChildrenSection from "@/components/profile/ChildrenSection";

async function getUserPinStatus(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login");
  const decoded = await adminAuth.verifySessionCookie(session);
  try {
    const doc = await adminDb.collection("users").doc(decoded.uid).get();
    const hash = doc.exists ? (doc.data()?.childPinHash as string | undefined) : undefined;
    return typeof hash === "string" && hash.length > 0;
  } catch {
    return false;
  }
}

export default async function FamilyPage() {
  // Parent-only surface — bounce kids back to /brain.
  await redirectIfInKidMode();
  const hasPin = await getUserPinStatus();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm mb-5"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          Home
        </Link>

        <div className="mb-6 flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-700" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Family
            </h1>
            <p className="text-sm text-gray-500">
              Your parent PIN and your children&rsquo;s profiles.
            </p>
          </div>
        </div>

        {!hasPin && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">⚠</span>
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Set your PIN first</p>
              <p>
                The PIN locks parent-only screens when your kid is playing.
                You&rsquo;ll be able to add child profiles once it&rsquo;s set.
              </p>
            </div>
          </div>
        )}

        {/* Parent PIN — always rendered so it's always editable, even
            when no children exist yet. */}
        <PinSection hasPinInitial={hasPin} />

        {/* Children — gated by PIN existence inside ChildrenSection
            (it reads hasPinInitial and locks the Add button). */}
        <ChildrenSection hasPinInitial={hasPin} />
      </div>
    </main>
  );
}
