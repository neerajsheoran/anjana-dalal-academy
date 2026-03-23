import Link from "next/link";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import MobileMenu from "./MobileMenu";

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
  const user = await getUser();

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
            <p className="text-[10px] sm:text-sm text-gray-400 tracking-wide">Clear Concepts · Strong Foundations</p>
          </div>
        </Link>

        <MobileMenu user={user} />
      </div>
    </header>
  );
}
