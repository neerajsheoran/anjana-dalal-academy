"use client";

// Parent landing — shown on `/` whenever the parent is logged in but
// NOT in kid mode. Handles both states with one component:
//   • 0 kids   → dotted "Add child" tile + Parent Tools (no ParentSetupHero)
//   • 1+ kids  → kid tiles + dotted Add tile + Parent Tools
//
// Decided 2026-06-13 with user: collapse the old ParentSetupHero into
// this component for a single, consistent landing pattern.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  CreditCard,
  UserPlus,
  Flame,
  ChevronDown,
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
  const hasKids = kids.length > 0;

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
          <p className="text-sm text-gray-500">
            {hasKids ? "Pick a child to train" : "Add your first child to start"}
          </p>
        </div>

        {/* Kid picker — empty state shows just the dotted Add tile, larger.
            Populated state lays out kids in 2 cols with the dotted Add tile
            next to them. */}
        {hasKids ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {kids.map((kid) => (
              <KidCard
                key={kid.id}
                kid={kid}
                disabled={switchingId !== null}
                switching={switchingId === kid.id}
                onClick={() => enterKidMode(kid.id)}
              />
            ))}
            <AddChildTile />
          </div>
        ) : (
          <div className="mb-8">
            <AddChildTile size="large" />
          </div>
        )}

        {error && (
          <p className="text-red-600 text-xs text-center mb-4">{error}</p>
        )}

        {/* Parent tools — always visible so the parent never feels
            stranded when they have no kids set up yet. */}
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

        {/* Just-exploring escape hatch — only shown on the empty state,
            since once kids exist the parent has clearly committed. */}
        {!hasKids && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Just exploring?{" "}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 underline hover:text-purple-600 transition-colors"
            >
              See how it works
              <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
            </a>
          </p>
        )}
      </div>
    </main>
  );
}

function KidCard({
  kid,
  disabled,
  switching,
  onClick,
}: {
  kid: Kid;
  disabled: boolean;
  switching: boolean;
  onClick: () => void;
}) {
  // Boolean coercion is deliberate — without it `0 && <jsx>` evaluates
  // to the number 0 which React renders as the literal "0" on screen.
  // Fixed a real bug reported 2026-06-13.
  const hasCrest = Boolean(kid.bestTier);
  const hasStreak = (kid.streakDays ?? 0) > 0;
  const showFooter = hasCrest || hasStreak;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative bg-white border border-gray-200 hover:border-purple-400 hover:shadow-md disabled:opacity-60 disabled:cursor-wait rounded-2xl p-4 text-center transition-all"
    >
      <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl shadow-inner">
        🧒
      </div>
      <p className="text-base font-bold text-gray-800 truncate">{kid.name}</p>
      <p className="text-[11px] text-gray-500">
        {kid.classId
          ? CLASS_LABEL[kid.classId] || kid.classId
          : "Class not set"}
      </p>
      {showFooter && (
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
          {hasCrest && (
            <span className="inline-flex items-center gap-0.5 text-gray-700">
              <span>{kid.bestTier!.emoji}</span>
              <span>{kid.bestTier!.name}</span>
            </span>
          )}
          {hasStreak && (
            <span className="inline-flex items-center gap-0.5 text-orange-600 ml-1">
              <Flame className="w-3 h-3" strokeWidth={2.5} />
              <span>{kid.streakDays}</span>
            </span>
          )}
        </div>
      )}
      {switching && (
        <span className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center text-xs font-semibold text-purple-700">
          Switching…
        </span>
      )}
    </button>
  );
}

// Dotted "Add child" tile — single visual element used in both empty
// and populated states. The `size` prop just bumps the inner padding
// and circle size when it's the only tile on the row.
function AddChildTile({ size = "default" }: { size?: "default" | "large" }) {
  const large = size === "large";
  return (
    <Link
      href="/family"
      className={`group bg-white border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-2xl text-center transition-all flex flex-col items-center justify-center ${
        large ? "p-8 sm:p-10" : "p-4"
      }`}
    >
      <div
        className={`mx-auto mb-2 rounded-full bg-purple-50 flex items-center justify-center ${
          large ? "w-20 h-20" : "w-12 h-12"
        }`}
      >
        <UserPlus
          className={large ? "w-9 h-9 text-purple-600" : "w-6 h-6 text-purple-600"}
          strokeWidth={2.25}
        />
      </div>
      <p
        className={`font-semibold text-gray-700 ${large ? "text-lg" : "text-sm"}`}
      >
        Add child
      </p>
      <p className={`text-gray-500 ${large ? "text-xs mt-1" : "text-[11px]"}`}>
        {large ? "Start with your first profile" : "Another profile"}
      </p>
    </Link>
  );
}
