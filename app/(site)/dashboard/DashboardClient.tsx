'use client';

// Renders the parent dashboard. Tabs switch the active kid via the ?kid= query
// param so the URL is shareable / refreshable. Pre-computed data comes from the
// server component — this component is purely presentational + tab routing.

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Flame,
  Lock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react';
import {
  PILLAR_META,
  type ChildDashboard,
} from '@/lib/dashboard-types';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
} from '@/lib/difficulty';

const AGE_GROUP_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  'early-builder': 'Early Builder',
  'skill-builder': 'Skill Builder',
  'advanced-thinker': 'Advanced Thinker',
};

interface ChildLite {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
}

const TREND_LABEL: Record<'up' | 'down' | 'flat' | 'n/a', string> = {
  up: 'trending up',
  down: 'slipping',
  flat: 'steady',
  'n/a': '',
};

const TREND_COLOR: Record<'up' | 'down' | 'flat' | 'n/a', string> = {
  up: 'text-emerald-600',
  down: 'text-amber-600',
  flat: 'text-ink-light',
  'n/a': 'text-ink-light',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TREND_ICON: Record<'up' | 'down' | 'flat' | 'n/a', any> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
  'n/a': Minus,
};

function formatRelativeTime(d: Date | null): string {
  if (!d) return 'never';
  const ms = Date.now() - d.getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function DashboardClient({
  children,
  selectedId,
  data,
}: {
  children: ChildLite[];
  selectedId: string;
  data: ChildDashboard;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectKid(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('kid', id);
    router.push(`/dashboard?${params.toString()}`);
  }

  const totalSessions = Math.ceil(data.totalAttempts / 3); // 3 attempts per session
  const noData = data.totalAttempts === 0;

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">
            Parent Dashboard
          </p>
          <h1 className="text-2xl font-bold text-ink">
            How {data.child.name} is doing
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Age {data.child.age} · {AGE_GROUP_LABEL[data.child.ageGroup] || data.child.ageGroup}
            {data.child.classId && ` · ${data.child.classId.replace('class-', 'Class ')}`}
          </p>
        </div>

        {/* Kid selector tabs (only if 2+ kids) */}
        {children.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {children.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => selectKid(c.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-white text-ink-soft border border-cool-line hover:border-brand'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        {/* No data → focused first-session prompts */}
        {noData ? (
          <FirstSessionEmptyState childName={data.child.name} />
        ) : (
          <>
            {/* 7-day training heatmap — the visual answer to "is my kid
                actually using this?" Shown as a row of dots, one per day.
                The user can navigate back up to 4 weeks using the < > arrows. */}
            <WeekHeatmap
              trainingDayKeys={data.trainingDayKeys}
              streakDays={data.streakDays}
              childName={data.child.name}
            />

            {/* Top stats strip. Swapped "days this week" for "current streak"
                since the heatmap above already shows the days info. */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Stat
                icon={Flame}
                value={`${data.streakDays}`}
                label={data.streakDays === 1 ? 'day in a row' : 'days in a row'}
              />
              <Stat
                icon={Activity}
                value={`${totalSessions}`}
                label={`session${totalSessions === 1 ? '' : 's'}`}
              />
              <Stat
                icon={Clock}
                value={formatRelativeTime(data.lastSessionAt)}
                label="last played"
                small
              />
            </div>

            {/* Insights */}
            {data.insights.length > 0 && (
              <section className="bg-white border border-cool-line rounded-2xl shadow-sm p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-brand" strokeWidth={2} />
                  <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest">
                    Latest Insights
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.insights.map((ins, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-cream border border-warm-line rounded-xl p-3"
                    >
                      <span className="text-2xl shrink-0">{ins.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {ins.title}
                        </p>
                        <p className="text-xs text-ink-soft leading-relaxed mt-0.5">
                          {ins.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pillar scores */}
            <section className="bg-white border border-cool-line rounded-2xl shadow-sm p-5 mb-5">
              <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-1">
                Pillar Scores
              </h2>
              <p className="text-xs text-ink-light mb-4 leading-relaxed">
                How {data.child.name} is doing in each brain skill area.
                Average score (0-100) across {data.totalAttempts} round{data.totalAttempts === 1 ? '' : 's'}.
                Each card shows a mini trend line of the last 10 scores.
              </p>
              <div className="space-y-3">
                {data.pillars.map((p) => {
                  const meta = PILLAR_META[p.pillar];
                  if (p.attempts === 0) {
                    return (
                      <div key={p.pillar} className="bg-white border border-cool-line rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{meta.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink">
                              {meta.label}
                            </p>
                            <p className="text-xs text-ink-light">
                              No sessions yet — try a {meta.label} game to unlock this score
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const avg = p.avgScore ?? 0;
                  const TrendIcon = TREND_ICON[p.trend];
                  return (
                    <div key={p.pillar} className="rounded-xl p-4 bg-white border border-cool-line">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink">
                            {meta.label}
                          </p>
                          <p className="text-[11px] text-ink-soft flex items-center gap-1.5">
                            <span>
                              {p.attempts} round{p.attempts === 1 ? '' : 's'}
                            </span>
                            {p.trend !== 'n/a' && (
                              <span className={`inline-flex items-center gap-0.5 ${TREND_COLOR[p.trend]}`}>
                                <TrendIcon className="w-3 h-3" strokeWidth={2.5} />
                                {TREND_LABEL[p.trend]}
                              </span>
                            )}
                          </p>
                        </div>
                        {p.recentScores.length >= 2 && (
                          <Sparkline scores={p.recentScores} colorClass={meta.line} />
                        )}
                        <p className="text-xl font-bold text-ink shrink-0">
                          {avg}<span className="text-xs text-ink-light">/100</span>
                        </p>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${meta.bar} rounded-full transition-all`}
                          style={{ width: `${Math.min(100, Math.max(2, avg))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Activity progression */}
            <section className="bg-white border border-cool-line rounded-2xl shadow-sm p-5 mb-5">
              <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-4">
                Activity Progression
              </h2>
              <div className="space-y-3">
                {data.activities.map((a) => {
                  const meta = PILLAR_META[a.pillar];
                  return (
                    <div
                      key={a.activityKey}
                      className="flex items-center gap-3 py-2 border-b border-cool-line last:border-0"
                    >
                      <span className="text-xl shrink-0">{meta.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink flex items-center flex-wrap gap-2">
                          {a.activityName}
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.chip}`}
                          >
                            {meta.label}
                          </span>
                        </p>
                        <p className="text-[11px] text-ink-soft mt-0.5 inline-flex items-center gap-1">
                          {a.ageGated && (
                            <Lock className="w-3 h-3 text-ink-light" strokeWidth={2.5} />
                          )}
                          {a.ageGated
                            ? `Locked — for ages ${BRAIN_AGE_RANGE(a)} (${data.child.name} is ${data.child.age})`
                            : a.attemptCount === 0
                              ? 'Not played yet'
                              : `${a.attemptCount} round${a.attemptCount === 1 ? '' : 's'} · best ${a.bestScore}/100`}
                        </p>
                      </div>
                      {!a.ageGated && a.currentDifficulty && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${DIFFICULTY_BADGE_BG[a.currentDifficulty]}`}
                        >
                          {DIFFICULTY_LABEL[a.currentDifficulty]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link
            href="/kids"
            className="inline-flex items-center gap-2 text-sm bg-brand hover:bg-brand-hover text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Switch to {data.child.name}&rsquo;s training
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
          <Link
            href="/profile"
            className="text-sm bg-white border border-cool-line hover:border-brand text-ink font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Manage profiles
          </Link>
        </div>
      </div>
    </main>
  );
}

// Helper to read minAge/maxAge from the activity registry without importing it
// here. The dashboard data already filtered availability — we just need the
// numbers for the friendly label. Stored statically to avoid the lookup.
const ACTIVITY_AGE: Record<string, [number, number]> = {
  'pattern-recall': [5, 15],
  'find-the-object': [5, 15],
  'pattern-logic': [5, 15],
  'number-recall': [9, 15],
  'number-sequence': [11, 15],
  'spot-the-difference': [5, 15],
  'stroop-task': [8, 15],
  'color-sequence': [5, 15],
  'tap-back': [7, 15],
  'odd-one-out': [5, 15],
  'analogies': [9, 15],
  'whack-a-target': [8, 15],
  'mini-sudoku': [8, 15],
  'memory-match': [5, 15],
};
function BRAIN_AGE_RANGE(a: { activityKey: string }): string {
  const r = ACTIVITY_AGE[a.activityKey];
  return r ? `${r[0]}–${r[1]}` : '?–?';
}

// ── WeekHeatmap ──────────────────────────────────────────────────────────
// 7-day visual: filled blue dot if the child trained at least one round
// that day, empty grey dot otherwise. Left → right reads oldest → most
// recent in the displayed window. Navigation: <  > arrows scroll back up
// to 4 weeks. The CURRENT week's "today" column gets a ring highlight so
// orientation is obvious; older weeks have no highlight.

const MAX_WEEKS_BACK = 4;

function WeekHeatmap({
  trainingDayKeys,
  streakDays,
  childName,
}: {
  trainingDayKeys: string[];   // all ISO dates the kid trained in the last 35 days
  streakDays: number;
  childName: string;
}) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last, ...
  const trainedSet = new Set(trainingDayKeys);

  // Compute the 7 days to show for the given offset. The rightmost cell is
  // "today minus (offset × 7)". So offset 0 → window ends today; offset 1 →
  // window ends 7 days ago; etc.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  interface Cell {
    date: Date;
    iso: string;
    trained: boolean;
    isToday: boolean;
    label: string;       // single-letter weekday
    dayNum: number;      // day-of-month for tooltip
  }
  const cells: Cell[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i - weekOffset * 7);
    const iso = d.toISOString().slice(0, 10);
    cells.push({
      date: d,
      iso,
      trained: trainedSet.has(iso),
      isToday: weekOffset === 0 && i === 0,
      label: d.toLocaleDateString('en', { weekday: 'narrow' }),
      dayNum: d.getDate(),
    });
  }

  const daysTrained = cells.filter((c) => c.trained).length;
  const trainedToday = weekOffset === 0 && cells[6].trained;

  // Header label: "This Week" / "Last Week" / date range for older windows.
  let weekLabel: string;
  if (weekOffset === 0) {
    weekLabel = 'This Week';
  } else if (weekOffset === 1) {
    weekLabel = 'Last Week';
  } else {
    const first = cells[0].date;
    const last = cells[6].date;
    const fmt = (d: Date) =>
      d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    weekLabel = `${fmt(first)} – ${fmt(last)}`;
  }

  const canPrev = weekOffset < MAX_WEEKS_BACK;
  const canNext = weekOffset > 0;

  return (
    <section className="bg-white border border-cool-line rounded-2xl shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" strokeWidth={2} />
          <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest">
            {weekLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => canPrev && setWeekOffset(weekOffset + 1)}
            disabled={!canPrev}
            aria-label="Previous week"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-ink-soft hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => canNext && setWeekOffset(weekOffset - 1)}
            disabled={!canNext}
            aria-label="Next week"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-ink-soft hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1 mb-3">
        {cells.map((c, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              title={`${c.iso}${c.trained ? ' — trained' : ' — no session'}`}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors ${
                c.trained
                  ? 'bg-brand ring-2 ring-brand/30'
                  : 'bg-cool-line'
              } ${c.isToday ? 'ring-2 ring-offset-1 ring-brand' : ''}`}
              aria-label={
                c.trained
                  ? `Trained on ${c.iso}`
                  : `No session on ${c.iso}`
              }
            />
            <span
              className={`text-[10px] ${
                c.isToday ? 'font-bold text-ink' : 'text-ink-light'
              }`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-soft text-center leading-relaxed">
        {childName} did at least one session on{' '}
        <strong className="text-ink">{daysTrained} of 7 days</strong>
        {weekOffset === 0 && streakDays > 0 && (
          <>
            {' · '}
            <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} fill="currentColor" />
              {streakDays} day{streakDays === 1 ? '' : 's'} in a row
            </span>
          </>
        )}
        {weekOffset === 0 && !trainedToday && streakDays > 0 && (
          <span className="block text-[11px] text-ink-light mt-1">
            No session today yet — train to keep the run going
          </span>
        )}
      </p>
      {weekOffset === 0 && (
        <p className="text-[10px] text-ink-light text-center mt-2 leading-relaxed">
          Blue dot = at least one brain-game session that day · grey = none
        </p>
      )}
    </section>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────
// Tiny inline SVG line chart. Takes 2+ scores (0-100 scale) and renders a
// ~64×20 polyline. No axes / labels — purely the trend shape, embedded in
// the pillar card next to the average score.
function Sparkline({
  scores,
  colorClass,
}: {
  scores: number[];   // chronological, length >= 2
  colorClass: string; // tailwind text-color, e.g. "text-purple-500"
}) {
  const w = 64;
  const h = 20;
  const pad = 1;
  const max = 100;
  const min = 0;
  const range = max - min;
  const step = (w - pad * 2) / (scores.length - 1);
  const points = scores
    .map((s, i) => {
      const x = pad + i * step;
      const y = h - pad - ((s - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`shrink-0 ${colorClass}`}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  small = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  value: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-cool-line p-3 text-center">
      <div className="flex items-center justify-center mb-1 h-6">
        <Icon className="w-5 h-5 text-brand" strokeWidth={2} />
      </div>
      <p className={`font-bold text-ink ${small ? 'text-xs' : 'text-lg'}`}>
        {value}
      </p>
      <p className="text-[10px] text-ink-light uppercase tracking-wide leading-tight">
        {label}
      </p>
    </div>
  );
}

function FirstSessionEmptyState({ childName }: { childName: string }) {
  return (
    <div className="bg-cream border border-warm-line rounded-2xl shadow-sm p-6 mb-6">
      <div className="text-center mb-5">
        <div className="w-16 h-16 rounded-xl bg-white border border-warm-line flex items-center justify-center text-3xl mx-auto mb-3">
          🌱
        </div>
        <h2 className="text-lg font-bold text-ink mb-1">
          {childName} hasn&rsquo;t trained yet
        </h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Once they play a session, this dashboard will fill with scores, trends,
          and personalised insights.
        </p>
      </div>
      <div className="space-y-2">
        <Link
          href="/kids"
          className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
        >
          Start training as {childName}
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
        <Link
          href="/try"
          className="block bg-white border border-cool-line hover:border-brand text-ink-soft text-center font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          Or try a game yourself first (no signup)
        </Link>
      </div>
    </div>
  );
}
