"use client";

// Locked-game tile + modal — what a free (unsubscribed) user sees when
// they tap a non-demo activity. Renders the activity tile in greyed
// state with a 🔒 corner badge. Click opens an inline modal with the
// "Subscribe to unlock" copy + the trial CTA.
//
// Used by /brain/[module]/page.tsx in place of the normal activity Link
// for any activity that isn't the pillar's demo game.

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, X } from "lucide-react";

export default function LockedGameTile({
  activityName,
  activitySkill,
  ageRange,
  iconBgClass = "bg-gray-100",
  iconEmoji = "🔒",
}: {
  activityName: string;
  activitySkill: string;
  ageRange: string;
  iconBgClass?: string;
  iconEmoji?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-fuchsia-300 hover:bg-fuchsia-50/40 transition-colors opacity-80"
      >
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${iconBgClass} flex items-center justify-center text-xl relative`}>
            <span className="grayscale">{iconEmoji}</span>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" strokeWidth={2.5} />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-700">{activityName}</p>
            <p className="text-[11px] text-gray-500">{activitySkill} · {ageRange}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full">
            Sign up to play
          </span>
        </div>
      </button>

      {open && <UnlockModal activityName={activityName} onClose={() => setOpen(false)} />}
    </>
  );
}

function UnlockModal({
  activityName,
  onClose,
}: {
  activityName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 sm:relative sm:right-0 sm:top-0 float-right text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-fuchsia-100 flex items-center justify-center text-3xl mx-auto mb-3">
            🔒
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            {activityName}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Subscribe to unlock all 14 games and save your progress.
          </p>
        </div>

        <ul className="text-sm text-gray-700 space-y-2 mb-5">
          <li className="flex items-start gap-2">
            <Check /> All 14 brain games
          </li>
          <li className="flex items-start gap-2">
            <Check /> Daily Activity progress + streak
          </li>
          <li className="flex items-start gap-2">
            <Check /> Badges + physical certificate (quarterly)
          </li>
          <li className="flex items-start gap-2">
            <Check /> Parent dashboard
          </li>
        </ul>

        <div className="text-center bg-fuchsia-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-fuchsia-700 font-semibold uppercase tracking-wider">
            ₹999 / year
          </p>
          <p className="text-xs text-gray-500 mt-1">
            3-day free trial · cancel anytime
          </p>
        </div>

        <Link
          href="/login?intent=signup"
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl text-sm transition-colors inline-flex items-center justify-center gap-1"
        >
          Sign up free
          <ChevronRight className="w-4 h-4" strokeWidth={3} />
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 py-1"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function Check() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
