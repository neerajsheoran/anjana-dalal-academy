import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import SupportPageClient from "@/components/support/SupportPageClient";

export const metadata = {
  title: "Help & Support — CogniLift",
  description: "Get help, report issues, or share feedback.",
};

async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login");
  try {
    await adminAuth.verifySessionCookie(session);
  } catch {
    redirect("/login");
  }
}

export default async function SupportPage() {
  await requireAuth();

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Help & Support</h1>
        <p className="text-sm text-gray-500 mb-8">
          Report an issue, ask a question, or share feedback. We&apos;ll get back to you as soon as possible.
        </p>
        <SupportPageClient />
      </div>
    </main>
  );
}
