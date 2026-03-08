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
        <div>
          <Link href="/" className="text-2xl font-bold text-blue-700">
            Anjana Dalal Academy
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            CBSE Learning Made Simple — Class 1 to 12
          </p>
        </div>

        <MobileMenu user={user} />
      </div>
    </header>
  );
}
