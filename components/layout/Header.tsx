import Link from "next/link";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getActiveChild } from "@/lib/active-child";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session);
    let role = "student";
    try {
      const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) role = userDoc.data()?.role || "student";
    } catch {
      // Firestore unavailable — default to student
    }
    return {
      name: decoded.name || decoded.email || "User",
      email: decoded.email || "",
      initial: (decoded.name || decoded.email || "U")[0].toUpperCase(),
      role,
    };
  } catch {
    return null;
  }
}

export default async function Header() {
  const [user, activeChild] = await Promise.all([getUser(), getActiveChild()]);

  return (
    <header className="relative bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="CogniLift" className="h-14 w-14 sm:h-24 sm:w-24" />
          <div>
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              <span className="text-blue-700">Cogni</span>
              <span className="text-orange-500">Lift</span>
            </span>
            <p className="text-[10px] sm:text-sm text-gray-400 tracking-wide">Train how your child thinks</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {activeChild && (
            <Link
              href="/kids"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-full pl-1 pr-3 py-1 transition-colors"
              title="Switch profile"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {activeChild.name[0]?.toUpperCase() || "?"}
              </span>
              <span className="text-xs font-semibold text-purple-700 hidden sm:inline">
                {activeChild.name}
              </span>
              <span className="text-[10px] text-purple-500 hidden sm:inline">Switch</span>
            </Link>
          )}
          <SearchModal />
          {user && <NotificationBell />}
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
