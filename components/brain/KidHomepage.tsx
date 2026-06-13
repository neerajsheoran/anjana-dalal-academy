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
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Flame,
  Hammer,
  PlayCircle,
  Target,
} from "lucide-react";
import type { ActiveChild } from "@/lib/active-child";
import type { BrainTier } from "@/lib/brain-tiers";
import { classNumber, isTrainEligible } from "@/lib/train-eligibility";

// Class band → whether to surface Exam Readiness on the kid home, and
// how prominently. Decided 2026-06-13 with user:
//   1-4   : no Exam card. Too young; exam pressure is wrong here.
//   5-8   : small secondary card under Continue. Soft prep nudge.
//   9-10  : HERO card replacing Today's Activity (Train is hidden in
//           board-prep mode anyway, so Exam Readiness takes its slot).
type ExamPromoLevel = "none" | "secondary" | "hero";

function examPromoFor(classId: string | null | undefined): ExamPromoLevel {
  const n = classNumber(classId);
  if (n === null) return "none";
  if (n >= 9) return "hero";
  if (n >= 5) return "secondary";
  return "none";
}

// Class 5+ get the "Explore other classes & subjects" escape hatch
// under the Learn card. Younger kids don't — fewer reasons to wander.
function showExploreLink(classId: string | null | undefined): boolean {
  const n = classNumber(classId);
  return n !== null && n >= 5;
}

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
  // Daily Activity progress (Memory / Focus / Thinking done today).
  // Drives the "Today's Activity" hero card so the kid sees their
  // daily job front and center — one tap to start.
  dailyDoneCount: number;        // 0..3
  dailyComplete: boolean;        // all 3 pillars done today
}

export default function KidHomepage({
  child,
  bestTier,
  streakDays,
  recent,
  dailyDoneCount,
  dailyComplete,
}: KidHomepageProps) {
  const showTrain = isTrainEligible(child.classId);
  const classLabel = child.classId ? CLASS_LABEL[child.classId] : null;
  const examPromo = examPromoFor(child.classId);
  const showTodayBlock = showTrain || recent || examPromo !== "none";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Header
          name={child.name}
          bestTier={bestTier}
          streakDays={streakDays}
          showTrain={showTrain}
        />

        {/* TODAY — hero block. Order depends on class band:
              · Class 1-4: Daily Activity (hero) → Continue
              · Class 5-8: Daily Activity (hero) → Continue → small Exam card
              · Class 9-10: Exam Readiness (hero) → Continue (Train is hidden) */}
        {showTodayBlock && (
          <div className="mt-6 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
              Today
            </p>
            <div className="space-y-3">
              {examPromo === "hero" && <ExamReadinessHero classId={child.classId} />}
              {showTrain && (
                <TodayActivityCard
                  dailyDoneCount={dailyDoneCount}
                  dailyComplete={dailyComplete}
                />
              )}
              {recent && <ContinueCard recent={recent} />}
              {examPromo === "secondary" && (
                <ExamReadinessSecondary classId={child.classId} />
              )}
            </div>
          </div>
        )}

        {/* BROWSE — nav cards for the rest of the platform */}
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
            Browse
          </p>
          <div className="space-y-3">
            <LearnCard classId={child.classId} classLabel={classLabel} />
            {/* Small escape hatch for curious Class 5+ kids who want to
                peek at other classes / browse by subject. Younger kids
                don't see it (less likely to want to wander, less visual
                noise on their home). Decided 2026-06-13. */}
            {showExploreLink(child.classId) && (
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 font-semibold text-sm rounded-full px-4 py-2 ml-1 transition-colors"
              >
                Explore other classes & subjects
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            )}
            {showTrain && (
              <TrainCard bestTier={bestTier} streakDays={streakDays} />
            )}
            <ApplyCard classLabel={classLabel} />
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          Tap the avatar at the top right to switch profiles
        </p>
      </div>
    </main>
  );
}

// The kid's daily mission — surfaced as the hero so habit-forming
// stays one tap from the home. Three dots track Memory / Focus /
// Thinking touched today. When all three are done the card shrinks
// to a celebration so it doesn't nag.
function TodayActivityCard({
  dailyDoneCount,
  dailyComplete,
}: {
  dailyDoneCount: number;
  dailyComplete: boolean;
}) {
  const dots = ["○", "○", "○"];
  for (let i = 0; i < dailyDoneCount && i < 3; i++) dots[i] = "●";
  const remaining = 3 - dailyDoneCount;

  if (dailyComplete) {
    return (
      <Link
        href="/brain/daily"
        className="group block rounded-3xl p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              All done today! 🎉
            </p>
            <p className="text-[11px] text-emerald-700/90">
              Come back tomorrow to keep your streak going.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 group-hover:underline">
            Replay
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/brain/daily"
      className="group block rounded-3xl p-5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
          <Target className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">
            Today&rsquo;s Activity
          </h3>
          <p className="text-sm text-white/85 mt-0.5">
            Memory · Focus · Thinking
          </p>
          <p className="text-xs text-white/80 mt-2">
            <span className="tracking-widest text-base">{dots.join(" ")}</span>
            <span className="ml-2 font-semibold">
              {dailyDoneCount === 0
                ? "~10 mins"
                : `${remaining} left`}
            </span>
          </p>
        </div>
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
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

// Hero variant — shown to Class 9-10 (board year). Replaces Today's
// Activity since Train is hidden for those classes. Frames the chapter
// quizzes as exam prep, the language parents care about.
function ExamReadinessHero({ classId }: { classId: string | null }) {
  const href = classId ? `/quiz-start?class=${classId}` : "/quiz-start";
  return (
    <Link
      href={href}
      className="group block rounded-3xl p-5 bg-gradient-to-br from-rose-600 to-fuchsia-700 text-white shadow-[0_12px_28px_rgba(244,63,94,0.35)] hover:shadow-[0_16px_32px_rgba(244,63,94,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight">Exam Readiness</h3>
          <p className="text-sm text-white/90 mt-0.5">
            Mock test from your latest chapters
          </p>
          <p className="text-xs text-white/80 mt-1.5 font-semibold">
            ~10 questions · 15 mins
          </p>
        </div>
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
  );
}

// Secondary variant — shown to Class 5-8. Soft prep nudge sitting
// under Daily Activity + Continue, so the kid sees it but it isn't
// the loudest thing on the page.
function ExamReadinessSecondary({ classId }: { classId: string | null }) {
  const href = classId ? `/quiz-start?class=${classId}` : "/quiz-start";
  return (
    <Link
      href={href}
      className="group block rounded-2xl p-4 bg-white border border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-fuchsia-50 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-7 h-7 text-fuchsia-600" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
            Exam Readiness
          </p>
          <p className="text-sm font-bold text-gray-800 leading-snug">
            Quick mock test · ~10 questions
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-fuchsia-600 shrink-0" strokeWidth={3} />
      </div>
    </Link>
  );
}

function ContinueCard({ recent }: { recent: RecentChapter }) {
  const subject = SUBJECT_LABEL[recent.subject] || recent.subject;
  const classLabel = CLASS_LABEL[recent.classId] || recent.classId;
  const href = `/class/${recent.classId}/${recent.subject}/${recent.chapterId}`;
  return (
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
            Continue reading · {classLabel} · {subject}
          </p>
          <p className="text-sm font-bold text-gray-800 leading-snug truncate">
            {recent.chapterTitle}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-blue-600 shrink-0" strokeWidth={3} />
      </div>
    </Link>
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
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
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
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
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
        <ChevronRight className="w-10 h-10 text-white shrink-0 self-center" strokeWidth={3.5} />
      </div>
    </Link>
  );
}
