import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { getPlatformConfig, getContentAccessLevel } from "@/lib/subscription";
import type { ContentAccessLevel } from "@/lib/types";
import CheckoutButton from "@/components/subscription/CheckoutButton";

async function getUserInfo() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const decoded = await adminAuth.verifySessionCookie(session);
    const accessLevel = await getContentAccessLevel(decoded.uid);

    return {
      uid: decoded.uid,
      name: decoded.name as string | undefined,
      email: decoded.email,
      accessLevel,
    };
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const [user, config] = await Promise.all([getUserInfo(), getPlatformConfig()]);

  const accessLevel: ContentAccessLevel = user?.accessLevel ?? "anonymous";
  const isLoggedIn = !!user;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Unlock Full Access
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Get unlimited access to all chapters, worksheets, quizzes, and discussions for Class 1–10.
          </p>
        </div>

        {/* Status Banner */}
        {accessLevel === "trial" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-amber-800 font-medium">
              You are on a free trial. Subscribe now to keep access after your trial ends.
            </p>
          </div>
        )}
        {accessLevel === "subscribed" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-green-800 font-medium">
              You have an active subscription. Thank you for being a member!
            </p>
          </div>
        )}
        {accessLevel === "expired" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red-800 font-medium">
              Your free trial has ended. Subscribe to regain full access.
            </p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Plan Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200 mb-1">
              Yearly Plan
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">Rs {config.yearlyPriceINR}</span>
              <span className="text-blue-200 text-lg">/year</span>
            </div>
            <p className="text-blue-200 text-sm mt-1">
              All classes included
            </p>
          </div>

          {/* Features */}
          <div className="p-6">
            <ul className="space-y-3 mb-6">
              {[
                "All chapters — Class 1 to 10",
                "Maths + Science — all subjects",
                "Interactive worksheets with answers",
                "AI-powered quizzes & revision",
                "Discussion explanations with audio",
                "Progress tracking & analytics",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Checkout */}
            {accessLevel !== "subscribed" && (
              <CheckoutButton
                userName={user?.name}
                userEmail={user?.email}
                amount={config.yearlyPriceINR}
                isLoggedIn={isLoggedIn}
              />
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            <FaqItem
              q="What payment methods are accepted?"
              a="We accept UPI, credit/debit cards, net banking, and wallets via Razorpay."
            />
            <FaqItem
              q="Can I cancel anytime?"
              a="Your subscription is valid for the full year. There are no auto-renewals — you choose to renew when it expires."
            />
            <FaqItem
              q="Do I get access to all classes?"
              a="Yes! One subscription gives you access to all classes (1-10) and all subjects."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
      <p className="text-sm text-gray-500">{a}</p>
    </div>
  );
}
