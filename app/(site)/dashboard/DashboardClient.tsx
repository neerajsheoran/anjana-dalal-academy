'use client';

// Renders the parent dashboard. Tabs switch the active kid via the ?kid= query
// param so the URL is shareable / refreshable. Pre-computed data comes from the
// server component — this component is purely presentational + tab routing.

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Activity,
  Clock,
  Flame,
  Lock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
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
            {/* Top stats strip */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Stat
                icon={Flame}
                value={`${data.trainingDays7d}`}
                label={`day${data.trainingDays7d === 1 ? '' : 's'} this week`}
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
              <p className="text-xs text-ink-light mb-4">
                All-time average across {data.totalAttempts} round{data.totalAttempts === 1 ? '' : 's'}
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
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
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
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
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
