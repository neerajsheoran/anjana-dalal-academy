import Link from "next/link";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import LogoutButton from "./LogoutButton";

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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-2xl font-bold text-blue-700">
            Anjana Dalal Academy
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            CBSE Learning Made Simple — Class 1 to 12
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.initial}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
              </div>
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                Admin
              </Link>
            )}
            <div className="w-px h-8 bg-gray-200" />
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
