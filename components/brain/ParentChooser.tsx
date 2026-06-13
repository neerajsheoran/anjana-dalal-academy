"use client";

// Parent landing — shown on `/` when the parent is logged in AND has
// at least one child profile, but is NOT in kid mode.
// Redesigned 2026-06-13 to match the new light-mode 3-pillar pattern:
//   • Kid profile picker is the hero (each kid card shows tier + streak)
//   • Tap a kid → enter that kid's mode (no PIN; PIN gates the way back)
//   • Parent Tools below: Dashboard, Subscription, Add another child
//
// Visual symmetry with KidHomepage so switching between them feels like
// two sides of the same coin.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  CreditCard,
  UserPlus,
  Flame,
} from "lucide-react";

interface Kid {
  id: string;
  name: string;
  classId: string | null;
  bestTier?: { name: string; emoji: string } | null;
  streakDays?: number;
}

const CLASS_LABEL: Record<string, string> = {
  "class-1": "Class 1", "class-2": "Class 2", "class-3": "Class 3",
  "class-4": "Class 4", "class-5": "Class 5", "class-6": "Class 6",
  "class-7": "Class 7", "class-8": "Class 8", "class-9": "Class 9",
  "class-10": "Class 10",
};

export default function ParentChooser({
  firstName,
  kids,
}: {
  firstName: string;
  kids: Kid[];
}) {
  const router = useRouter();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  async function enterKidMode(kidId: string) {
    setSwitchingId(kidId);
    setError("");
    try {
      const res = await fetch("/api/children/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: kidId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not switch profile");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSwitchingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hi {firstName || "there"}!{" "}
            <span className="inline-block animate-wiggle">👋</span>
          </h1>
          <p className="text-sm text-gray-500">Pick a child to train</p>
        </div>

        {/* Kid picker */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {kids.map((kid) => (
            <button
              key={kid.id}
              type="button"
              onClick={() => enterKidMode(kid.id)}
              disabled={switchingId !== null}
              className="group relative bg-white border border-gray-200 hover:border-purple-400 hover:shadow-md disabled:opacity-60 disabled:cursor-wait rounded-2xl p-4 text-center transition-all"
            >
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl shadow-inner">
                🧒
              </div>
              <p className="text-base font-bold text-gray-800 truncate">{kid.name}</p>
              <p className="text-[11px] text-gray-500">
                {kid.classId ? CLASS_LABEL[kid.classId] || kid.classId : "Class not set"}
              </p>
              {(kid.bestTier || (kid.streakDays && kid.streakDays > 0)) && (
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
                  {kid.bestTier && (
                    <span className="inline-flex items-center gap-0.5 text-gray-700">
                      <span>{kid.bestTier.emoji}</span>
                      <span>{kid.bestTier.name}</span>
                    </span>
                  )}
                  {kid.streakDays && kid.streakDays > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-orange-600 ml-1">
                      <Flame className="w-3 h-3" strokeWidth={2.5} />
                      <span>{kid.streakDays}</span>
                    </span>
                  ) : null}
                </div>
              )}
              {switchingId === kid.id && (
                <span className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center text-xs font-semibold text-purple-700">
                  Switching…
                </span>
              )}
            </button>
          ))}

          {/* Add another child */}
          <Link
            href="/family"
            className="group bg-white border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-50 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" strokeWidth={2.25} />
            </div>
            <p className="text-sm font-semibold text-gray-700">Add child</p>
            <p className="text-[11px] text-gray-500">Another profile</p>
          </Link>
        </div>

        {error && (
          <p className="text-red-600 text-xs text-center mb-4">{error}</p>
        )}

        {/* Parent tools */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
          Parent tools
        </p>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 bg-white border border-gray-200 hover:border-amber-300 hover:shadow-sm rounded-2xl p-4 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5 text-amber-700" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                Dashboard
              </p>
              <p className="text-[11px] text-gray-500">
                Progress across all kids
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
          </Link>

          <Link
            href="/pricing"
            className="group flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm rounded-2xl p-4 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-700" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                Subscription
              </p>
              <p className="text-[11px] text-gray-500">
                Plan, billing, and trial status
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </main>
  );
}
