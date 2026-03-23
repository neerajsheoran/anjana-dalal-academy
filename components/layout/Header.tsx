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
          <img src="/images/logo.png" alt="CogniLift" className="h-10 w-10" />
          <div>
            <span className="text-2xl font-bold text-blue-700">CogniLift</span>
            <p className="text-xs text-gray-500">Smart Learning · Strong Foundations</p>
          </div>
        </Link>

        <MobileMenu user={user} />
      </div>
    </header>
  );
}
