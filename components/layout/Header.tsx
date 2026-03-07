import Link from "next/link";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import LogoutButton from "./LogoutButton";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session);
    return {
      name: decoded.name || decoded.email || "User",
      email: decoded.email || "",
      initial: (decoded.name || decoded.email || "U")[0].toUpperCase(),
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

        {user && (
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
            <div className="w-px h-8 bg-gray-200" />
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
