// Kid-mode landing — shown on `/` when an active child profile is set.
// Designed 2026-06-13 to match the new light-mode 3-pillar pattern used
// in the rest of the app (anonymous hero, /brain home, etc.).
//
// Layout:
//   • Header — kid name + crest (best brain tier + streak)
//   • Continue card — last chapter the kid visited (highest-value real estate)
//   • 3 pillar cards: Learn / Train / Apply
//   • Helper line on switching profiles
//
// Train pillar is hidden for Class 9-10 (board-prep mode).

import Link from "next/link";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Flame,
  Hammer,
  PlayCircle,
} from "lucide-react";
import type { ActiveChild } from "@/lib/active-child";
import type { BrainTier } from "@/lib/brain-tiers";
import { isTrainEligible } from "@/lib/train-eligibility";

const CLASS_LABEL: Record<string, string> = {
  "class-1": "Class 1", "class-2": "Class 2", "class-3": "Class 3",
  "class-4": "Class 4", "class-5": "Class 5", "class-6": "Class 6",
  "class-7": "Class 7", "class-8": "Class 8", "class-9": "Class 9",
  "class-10": "Class 10",
};

const SUBJECT_LABEL: Record<string, string> = {
  maths: "Maths",
  science: "Science",
  "social-science": "Social Science",
};

export interface RecentChapter {
  classId: string;
  subject: string;
  chapterId: string;
  chapterTitle: string;
  lastVisitedAt: string | null;
}

interface KidHomepageProps {
  child: ActiveChild;
  bestTier: BrainTier | null;     // null if no brain attempts yet
  streakDays: number;
  recent: RecentChapter | null;   // null if no progress yet
}

export default function KidHomepage({
  child,
  bestTier,
  streakDays,
  recent,
}: KidHomepageProps) {
  const showTrain = isTrainEligible(child.classId);
  const classLabel = child.classId ? CLASS_LABEL[child.classId] : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Header
          name={child.name}
          bestTier={bestTier}
          streakDays={streakDays}
          showTrain={showTrain}
        />

        {recent && <ContinueCard recent={recent} />}

        <div className="space-y-4 mt-5">
          <LearnCard classId={child.classId} classLabel={classLabel} />
          {showTrain && (
            <TrainCard bestTier={bestTier} streakDays={streakDays} />
          )}
          <ApplyCard classLabel={classLabel} />
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          Tap the avatar at the top right to switch profiles
        </p>
      </div>
    </main>
  );
}

function Header({
  name,
  bestTier,
  streakDays,
  showTrain,
}: {
  name: string;
  bestTier: BrainTier | null;
  streakDays: number;
  showTrain: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-purple-600 text-xs font-bold uppercase tracking-widest mb-1">
        Welcome back
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Hi {name}! <span className="inline-block animate-wiggle">👋</span>
      </h1>
      {showTrain && (bestTier || streakDays > 0) && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm">
          {bestTier && (
            <>
              <span className="text-lg">{bestTier.emoji}</span>
              <span className="font-bold text-gray-800">{bestTier.name}</span>
            </>
          )}
          {streakDays > 0 && (
            <>
              {bestTier && <span className="text-gray-300">·</span>}
              <span className="inline-flex items-center gap-1 text-orange-600">
                <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="font-bold">{streakDays}</span>
                <span className="text-orange-500/80">
                  day{streakDays === 1 ? "" : "s"}
                </span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ContinueCard({ recent }: { recent: RecentChapter }) {
  const subject = SUBJECT_LABEL[recent.subject] || recent.subject;
  const classLabel = CLASS_LABEL[recent.classId] || recent.classId;
  const href = `/class/${recent.classId}/${recent.subject}/${recent.chapterId}`;
  return (
    <div className="mt-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
        Continue where you left off
      </p>
      <Link
        href={href}
        className="group block rounded-2xl p-4 bg-white border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <PlayCircle className="w-7 h-7 text-blue-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500 font-semibold">
              {classLabel} · {subject}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-snug truncate">
              {recent.chapterTitle}
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-blue-600 shrink-0" strokeWidth={3} />
        </div>
      </Link>
    </div>
  );
}

function LearnCard({
  classId,
  classLabel,
}: {
  classId: string | null;
  classLabel: string | null;
}) {
  const href = classId ? `/class/${classId}` : "/classes";
  const body = classLabel
    ? `${classLabel} · Maths, Science, Social Science`
    : "Browse classes and subjects, Class 1 to 10";
  return (
    <Link
      href={href}
      className="group block rounded-3xl p-5 bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-[0_12px_28px_rgba(59,130,246,0.30)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
          <BookOpen className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Learn</h3>
          <p className="text-sm text-white/85 mt-0.5">{body}</p>
        </div>
        <ChevronRight className="w-8 h-8 text-white shrink-0 self-center" strokeWidth={3} />
      </div>
    </Link>
  );
}

function TrainCard({
  bestTier,
  streakDays,
}: {
  bestTier: BrainTier | null;
  streakDays: number;
}) {
  const body =
    streakDays > 0
      ? `14 brain games · 🔥 ${streakDays}-day streak`
      : bestTier
        ? `14 brain games · ${bestTier.emoji} ${bestTier.name}`
        : "Memory · Focus · Thinking — pick a game";
  return (
    <Link
      href="/brain"
      className="group block rounded-3xl p-5 bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-[0_12px_28px_rgba(168,85,247,0.30)] hover:shadow-[0_16px_32px_rgba(168,85,247,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
          <Brain className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Train</h3>
          <p className="text-sm text-white/85 mt-0.5">{body}</p>
        </div>
        <ChevronRight className="w-8 h-8 text-white shrink-0 self-center" strokeWidth={3} />
      </div>
    </Link>
  );
}

function ApplyCard({ classLabel }: { classLabel: string | null }) {
  const body = classLabel
    ? `Hands-on projects + DIYs for ${classLabel}`
    : "Hands-on science projects from the kitchen";
  return (
    <Link
      href="/apply"
      className="group block rounded-3xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_12px_28px_rgba(251,146,60,0.30)] hover:shadow-[0_16px_32px_rgba(251,146,60,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
          <Hammer className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Apply</h3>
          <p className="text-sm text-white/85 mt-0.5">{body}</p>
        </div>
        <ChevronRight className="w-8 h-8 text-white shrink-0 self-center" strokeWidth={3} />
      </div>
    </Link>
  );
}
