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
  ClipboardCheck,
  Compass,
  Flame,
  Hammer,
  PlayCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

  // Desktop layout (md+): asymmetric 3-2 grid the user designed —
  //   Row 1: Today | Quick Mock      (2 tiles)
  //   Row 2: Games                   (full-width hero)
  //   Row 3: Learn | Train Yourself  (2 tiles)
  //   Row 4: Achievements            (full-width tile)
  // Mobile: everything stacks single-col automatically via responsive grid.
  // ContinueCard + ApplyCard are intentionally not rendered for now — the
  // components stay defined so we can add them back when ready.
  const todayCount = (showTrain ? 1 : 0) + (examPromo !== "none" ? 1 : 0);
  const learnCount = 1 + (showTrain ? 1 : 0);
  const pairedGrid = "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch";
  const singleGrid = "grid grid-cols-1 gap-3";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Header
          name={child.name}
          bestTier={bestTier}
          streakDays={streakDays}
          showTrain={showTrain}
        />

        {showTodayBlock && (
          <section>
            <SectionHeader
              icon={Sparkles}
              label="Today"
              accent="text-purple-700"
            />
            <div className={todayCount === 2 ? pairedGrid : singleGrid}>
              {showTrain && (
                <TodayActivityCard
                  dailyDoneCount={dailyDoneCount}
                  dailyComplete={dailyComplete}
                />
              )}
              {examPromo !== "none" && (
                <ExamReadinessHero classId={child.classId} />
              )}
            </div>
          </section>
        )}

        {showTrain && (
          <section>
            <SectionHeader
              icon={Brain}
              label="Games"
              accent="text-pink-700"
            />
            <GamesCard bestTier={bestTier} streakDays={streakDays} />
          </section>
        )}

        <section>
          <SectionHeader
            icon={BookOpen}
            label="Learn"
            accent="text-blue-700"
          />
          <div className={learnCount === 2 ? pairedGrid : singleGrid}>
            <LearnCard classId={child.classId} classLabel={classLabel} />
            {showTrain && (
              <TrainCard bestTier={bestTier} streakDays={streakDays} />
            )}
          </div>
        </section>

        {showTrain && (
          <section>
            <SectionHeader
              icon={Trophy}
              label="Achievements"
              accent="text-amber-700"
            />
            <AchievementsCard bestTier={bestTier} streakDays={streakDays} />
          </section>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-10">
          Tap the avatar at the top right to switch profiles
        </p>
      </div>
    </main>
  );
}

// The kid's daily mission. Square-ish vertical tile matching the
// /learn page hero pattern so the whole site reads as one design
// language. Three dots track Memory / Focus / Thinking touched today;
// when all three are done the card flips to a green celebration with
// a Replay CTA instead of nagging.
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
        className="group h-full bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
      >
        <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
          <span className="text-5xl animate-bounce">🎉</span>
        </div>
        <h3 className="text-white text-xl font-bold mb-2">All Done Today!</h3>
        <p className="text-emerald-100 text-sm leading-relaxed flex-1">
          Come back tomorrow to keep your streak going.
        </p>
        <span className="mt-auto inline-block bg-white text-emerald-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
          Replay
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/brain/daily"
      className="group h-full bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
        <span className="text-5xl animate-bounce">🎯</span>
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Today&rsquo;s Activity</h3>
      <p className="text-blue-100 text-sm leading-relaxed">
        Memory · Focus · Thinking
      </p>
      <p className="text-white/90 text-sm mt-2 flex-1">
        <span className="tracking-widest text-base">{dots.join(" ")}</span>
        <span className="ml-2 font-semibold">
          {dailyDoneCount === 0 ? "~10 mins" : `${remaining} left`}
        </span>
      </p>
      <span className="mt-auto inline-block bg-white text-indigo-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        {dailyDoneCount === 0 ? "Get Started" : "Continue"}
      </span>
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

// Quick Mock Test tile — paired with Today Activity in Row 1.
// Vertical layout matches /learn so the look stays consistent.
function ExamReadinessHero({ classId }: { classId: string | null }) {
  const href = classId ? `/quiz-start?class=${classId}` : "/quiz-start";
  return (
    <Link
      href={href}
      className="group h-full bg-gradient-to-br from-rose-600 to-fuchsia-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="mb-5 group-hover:scale-110 transition-transform duration-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/quiz-icon.svg"
          alt=""
          className="w-24 h-24 animate-heartbeat"
        />
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Quick Mock Test</h3>
      <p className="text-rose-100 text-sm leading-relaxed flex-1">
        ~10 questions from your latest chapters · ~15 mins
      </p>
      <span className="mt-auto inline-block bg-white text-rose-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        Start Test
      </span>
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
        <ChevronRight className="w-8 h-8 text-fuchsia-600 shrink-0 self-center" strokeWidth={3.5} />
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
        <ChevronRight className="w-8 h-8 text-blue-600 shrink-0 self-center" strokeWidth={3.5} />
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
  // Class 5+ kids go to /learn (browse page); Class 1-4 keep fast-path
  // to their own class so they don't bounce through a picker daily.
  const useExplore = showExploreLink(classId);
  const href = useExplore ? "/learn" : classId ? `/class/${classId}` : "/classes";
  const body = useExplore
    ? classLabel
      ? `${classLabel} + all other classes & subjects`
      : "Browse classes and subjects, Class 1 to 10"
    : classLabel
      ? `${classLabel} · Maths, Science, Social Science`
      : "Browse classes and subjects, Class 1 to 10";
  return (
    <Link
      href={href}
      className="group h-full bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="mb-5 group-hover:scale-110 transition-transform duration-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/subjects-icon.svg"
          alt=""
          className="w-24 h-24 animate-wiggle"
        />
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Learn</h3>
      <p className="text-blue-100 text-sm leading-relaxed flex-1">{body}</p>
      <span className="mt-auto inline-block bg-white text-blue-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        Browse
      </span>
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
      href="/brain/explore"
      className="group h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
    >
      <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
        <span className="text-5xl animate-bounce">🎮</span>
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Train</h3>
      <p className="text-purple-100 text-sm leading-relaxed flex-1">{body}</p>
      <span className="mt-auto inline-block bg-white text-purple-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow">
        Play
      </span>
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

// Full-width brain games hero used as Row 2 of the kid home grid.
// Bigger and more prominent than TrainCard (which sits in Row 3 as a
// regular tile). Both link to the same /brain/explore picker — Row 2
// shouts "here are the 14 games", Row 3 is the quieter discovery path.
function GamesCard({
  bestTier,
  streakDays,
}: {
  bestTier: BrainTier | null;
  streakDays: number;
}) {
  return (
    <Link
      href="/brain"
      className="group block bg-gradient-to-br from-fuchsia-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
    >
      <div className="flex items-center gap-5 md:gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
          <span className="text-4xl md:text-5xl animate-heartbeat">🧠</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold leading-tight text-white">
            14 Brain Games
          </h3>
          <p className="text-sm md:text-base text-purple-100 mt-1">
            Memory · Focus · Thinking — pick any, anytime
          </p>
          {(bestTier || streakDays > 0) && (
            <p className="text-xs md:text-sm text-white/85 mt-2 flex items-center gap-2 flex-wrap">
              {bestTier && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-base">{bestTier.emoji}</span>
                  <span className="font-semibold">{bestTier.name}</span>
                </span>
              )}
              {bestTier && streakDays > 0 && (
                <span className="text-white/60">·</span>
              )}
              {streakDays > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="font-semibold">{streakDays}-day streak</span>
                </span>
              )}
            </p>
          )}
        </div>
        <span className="inline-block bg-white text-purple-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow shrink-0">
          Play
        </span>
      </div>
    </Link>
  );
}

// Section header rendered as a divider with the label sitting on it:
//   ─────── ✨ TODAY ───────
// Replaces the older pill-chip + separate gray hairline. The line is
// the divider, the label is what the line is labelling. One element,
// not two. Line is gray-300 + 2px to read clearly against the white
// background; text color carries each section's brand accent.
function SectionHeader({
  icon: Icon,
  label,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 my-7">
      <div className="flex-1 h-[2px] bg-gray-300 rounded-full" />
      <span
        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${accent}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2.75} />
        {label}
      </span>
      <div className="flex-1 h-[2px] bg-gray-300 rounded-full" />
    </div>
  );
}

// Achievements shelf — surfaces the kid's current crest + streak as its
// own card so the badge progression has a home outside the brain header.
// Links to /brain/badges where the full ladder lives.
function AchievementsCard({
  bestTier,
  streakDays,
}: {
  bestTier: BrainTier | null;
  streakDays: number;
}) {
  const hasAnything = bestTier !== null || streakDays > 0;
  return (
    <Link
      href="/brain/badges"
      className="group block bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
    >
      <div className="flex items-center gap-5 md:gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
          <span className="text-5xl md:text-6xl animate-wiggle">
            {bestTier?.emoji ?? "🏅"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold leading-tight text-white">
            My Achievements
          </h3>
          {hasAnything ? (
            <p className="text-sm md:text-base text-amber-50 mt-1">
              {bestTier && <>Best: <span className="font-bold">{bestTier.name}</span></>}
              {bestTier && streakDays > 0 && " · "}
              {streakDays > 0 && (
                <>
                  <Flame className="inline w-3.5 h-3.5 -mt-0.5" strokeWidth={2.5} />{" "}
                  {streakDays}-day streak
                </>
              )}
            </p>
          ) : (
            <p className="text-sm md:text-base text-amber-50 mt-1">
              Play to start earning badges
            </p>
          )}
        </div>
        <span className="inline-block bg-white text-amber-700 font-semibold px-6 py-2 rounded-full text-sm shadow-md group-hover:shadow-lg transition-shadow shrink-0">
          View
        </span>
      </div>
    </Link>
  );
}
