import Link from 'next/link';
import { BookOpen, Brain, ChevronRight, Eye, Hammer, Sparkles } from 'lucide-react';
import ContinueLearning from '@/components/progress/ContinueLearning';
import { getActiveChild, getParent } from '@/lib/active-child';
import { adminDb } from '@/lib/firebase-admin';
import { getBrainStats } from '@/lib/brain-stats';
import { getDailyMissionProgress } from '@/lib/daily-mission';
import PatternRecallDemo from '@/components/brain/PatternRecallDemo';
import KidHomepage, { type RecentChapter } from '@/components/brain/KidHomepage';
import ParentChooser from '@/components/brain/ParentChooser';

export default async function HomePage() {
  const [parent, activeChild] = await Promise.all([
    getParent(),
    getActiveChild(),
  ]);

  // Kid mode → personalized dashboard. Fetch brain stats + most-recent
  // chapter to power the crest header, Today's Activity hero, and
  // Continue card.
  if (activeChild) {
    const [stats, recent] = await Promise.all([
      getBrainStats(activeChild.parentUid, activeChild.id),
      getMostRecentChapter(activeChild.parentUid, activeChild.id),
    ]);
    // Daily mission progress — N of 9 games done today. Computed
    // deterministically per (childId, IST date) by getDailyMission so
    // both this hero and /brain/daily see the same pick list and the
    // same done-count.
    const mission = getDailyMissionProgress({
      childId: activeChild.id,
      age: activeChild.age,
      playedTodayKeys: stats.playedTodayKeys,
    });
    return (
      <KidHomepage
        child={activeChild}
        bestTier={stats.totalSets > 0 ? stats.bestTier : null}
        streakDays={stats.streakDays}
        recent={recent}
        dailyDoneCount={mission.doneCount}
        dailyTotal={mission.total}
        dailyComplete={mission.isComplete}
      />
    );
  }

  // Any logged-in parent (not in kid mode) → ParentChooser handles both
  // empty and populated kid states with a single component. Cold prospects
  // (no session) still get the marketing hero.
  const showChooser = !!parent;
  const showMarketingHero = !showChooser;

  // For the parent chooser we always need the kids list (possibly empty)
  // so each kid card shows their tier + streak before the parent taps in.
  const parentKidsForChooser = showChooser && parent
    ? await getKidsWithStats(parent.uid)
    : [];

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Picker pill + ParentSetupHero removed 2026-06-13 — ParentChooser
          now handles both empty and populated parent states. */}

      {/* ── Parent chooser: state-aware utility view for activated parents.
            "How would you like to start?" + Brain / School / Dashboard cards. */}
      {showChooser && (
        <ParentChooser
          firstName={parent?.firstName || ''}
          kids={parentKidsForChooser}
        />
      )}

      {/* ── HERO — Three-pillar anonymous landing (cold prospects only).
            Decided 2026-06-12 with user: surface Learn / Train / Apply
            up front, each playable/browsable without signup.

            Layout:
              • Headline + tagline
              • 3 pillar cards in a row — each linkable now, no auth wall
              • Live Train demo below (the existing PatternRecallDemo,
                strong AHA moment)
              • Primary CTA underneath: start free trial (or just sign in) */}
      {showMarketingHero && (
      <section className="bg-white py-14 px-6 border-b border-cool-line">
        <div className="max-w-6xl mx-auto">

          {/* Top: title + tagline + sign-in hint */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-brand text-xs font-bold uppercase tracking-widest mb-3">
              For Indian kids · ages 5–15
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight text-ink">
              Train how your child thinks, not just what they learn.
            </h1>
            <div className="inline-flex items-center gap-2 bg-cream border border-warm-line rounded-full px-4 py-2 text-sm text-ink-soft font-medium">
              <Sparkles className="w-4 h-4 text-brand" strokeWidth={2.25} />
              <span>Brain training · Academics · Hands-on projects</span>
            </div>
            <p className="text-ink-light text-xs mt-4">
              Try any pillar below — no signup required.{" "}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Already a member? Sign in
              </Link>
            </p>
          </div>

          {/* 3 pillar cards — each opens a no-signup glimpse */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10">
            {/* Learn */}
            <Link
              href="/classes"
              className="group bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-3xl p-6 shadow-[0_12px_28px_rgba(59,130,246,0.30)] hover:shadow-[0_16px_32px_rgba(59,130,246,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                  <BookOpen className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">
                  Browse free
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">Learn</h2>
              <p className="text-sm text-white/85 flex-1">
                200+ chapters across Maths, Science, Social Science — Class 1 to 10.
                First two chapters of every subject are free.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold">
                Browse classes
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </Link>

            {/* Train */}
            <Link
              href="/brain/explore"
              className="group bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl p-6 shadow-[0_12px_28px_rgba(168,85,247,0.30)] hover:shadow-[0_16px_32px_rgba(168,85,247,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                  <Brain className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">
                  Playable
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">Train</h2>
              <p className="text-sm text-white/85 flex-1">
                14 brain games for Memory, Focus, Thinking. Three free to
                play — sign up to unlock the rest and save progress.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold">
                See all games
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </Link>

            {/* Apply */}
            <Link
              href="/apply"
              className="group bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-[0_12px_28px_rgba(251,146,60,0.30)] hover:shadow-[0_16px_32px_rgba(251,146,60,0.40)] hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                  <Hammer className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">
                  Browse free
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">Apply</h2>
              <p className="text-sm text-white/85 flex-1">
                Hands-on science projects with stuff from the kitchen.
                Worksheets and project kits coming soon.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold">
                See projects
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </Link>
          </div>

          {/* Live Train demo — kept as the AHA moment, narrower and
              centered so the 3 pillar cards above stay hero. */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-cream border border-warm-line rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-soft">
                <Eye className="w-3.5 h-3.5 text-brand" strokeWidth={2.25} />
                <span>Live preview · Pattern Recall</span>
              </span>
            </div>
            <div className="bg-gradient-to-br from-blue-700 to-purple-700 rounded-3xl p-6 shadow-lg flex items-center justify-center">
              <PatternRecallDemo />
            </div>
            <p className="text-center text-ink-light text-xs mt-4">
              When you&apos;re ready to save your child&apos;s progress and
              unlock all 14 games + 200+ chapters,{" "}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                start a 3-day free trial
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Bridge-to-school section retired 2026-06-12 — the Learn pillar
          card in the new hero covers this destination directly. */}

      {/* ── HOW IT WORKS — 5-step Loop ──────────────────────────────────── */}
      <section id="how-it-works" className="bg-cream py-14 px-6 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
              How it works
            </h2>
            <p className="text-ink-soft text-sm">
              Five steps every brain training session follows
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {[
              { step: '1', label: 'Explain', desc: 'Why this skill matters' },
              { step: '2', label: 'Train', desc: 'A short, focused game' },
              { step: '3', label: 'Reflect', desc: 'How did you answer?' },
              { step: '4', label: 'Improve', desc: 'Get a useful insight' },
              { step: '5', label: 'Track', desc: 'See progress over time' },
            ].map(({ step, label, desc }) => (
              <div
                key={step}
                className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-warm-line text-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cream text-brand font-bold text-base sm:text-lg flex items-center justify-center mx-auto mb-3 border border-warm-line">
                  {step}
                </div>
                <h3 className="font-bold text-ink text-sm mb-1">{label}</h3>
                <p className="text-ink-soft text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARENT VALUE — what insights look like ──────────────────────── */}
      <section className="bg-white py-14 px-6 border-t border-cool-line">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">
              For parents
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
              You won&rsquo;t just see scores — you&rsquo;ll see why.
            </h2>
            <p className="text-ink-soft text-sm max-w-xl mx-auto">
              After every session, we look at how your child played — not just whether
              they got it right — and turn it into something useful.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Sample insight card 1 */}
            <div className="bg-cream border border-warm-line rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
                  Sample insight
                </span>
              </div>
              <p className="text-sm text-ink leading-relaxed">
                &ldquo;Aarav&rsquo;s accuracy is steady, but he&rsquo;s rushing about
                <strong> 40% of his answers</strong>. Try a &lsquo;breathe before
                tap&rsquo; cue — he gets faster <em>and</em> more accurate when
                he slows down.&rdquo;
              </p>
            </div>

            {/* Sample insight card 2 */}
            <div className="bg-cream border border-warm-line rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌱</span>
                <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
                  Sample insight
                </span>
              </div>
              <p className="text-sm text-ink leading-relaxed">
                &ldquo;Ananya guessed on 3 of 5 thinking puzzles this week — but
                <strong> her confidence is growing</strong>. Try the next
                difficulty level; she&rsquo;s ready.&rdquo;
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-ink-light mt-6">
            Examples shown. Your child&rsquo;s actual insights will be based on their own play.
          </p>
        </div>
      </section>

      {/* ── Returning users: Continue Learning ──────────────────────────── */}
      <ContinueLearning />
    </main>
  );
}

// Fetch the most recently visited chapter for ONE child profile. Powers
// the Continue card on the kid home. Filtered by the childId field that
// /api/progress/track stamps on every write — so kid A doesn't see kid B's
// progress, and neither sees the parent's own browsing.
async function getMostRecentChapter(
  parentUid: string,
  childId: string,
): Promise<RecentChapter | null> {
  try {
    const snap = await adminDb
      .collection('users')
      .doc(parentUid)
      .collection('progress')
      .where('childId', '==', childId)
      .orderBy('lastVisitedAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const d = doc.data();
    return {
      classId: (d.classId as string) || '',
      subject: (d.subject as string) || '',
      chapterId: (d.chapterId as string) || doc.id,
      chapterTitle: (d.chapterTitle as string) || doc.id,
      lastVisitedAt: d.lastVisitedAt?.toDate?.()?.toISOString?.() ?? null,
    };
  } catch {
    return null;
  }
}

// Fetch all kids for a parent with their crest (best brain tier) and
// current streak. Used by the parent chooser to surface decision-relevant
// progress on each kid card.
async function getKidsWithStats(parentUid: string): Promise<
  Array<{
    id: string;
    name: string;
    classId: string | null;
    bestTier: { name: string; emoji: string } | null;
    streakDays: number;
  }>
> {
  try {
    const snap = await adminDb
      .collection('users')
      .doc(parentUid)
      .collection('children')
      .get();
    if (snap.empty) return [];

    const kids = await Promise.all(
      snap.docs.map(async (doc) => {
        const d = doc.data();
        const stats = await getBrainStats(parentUid, doc.id);
        return {
          id: doc.id,
          name: (d.name as string) || '',
          classId: (d.classId as string) || null,
          bestTier:
            stats.totalSets > 0
              ? { name: stats.bestTier.name, emoji: stats.bestTier.emoji }
              : null,
          streakDays: stats.streakDays,
        };
      }),
    );
    return kids;
  } catch {
    return [];
  }
}
