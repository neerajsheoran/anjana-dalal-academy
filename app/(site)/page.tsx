import Link from 'next/link';
import ContinueLearning from '@/components/progress/ContinueLearning';
import { getActiveChild, getParent, hasChildren } from '@/lib/active-child';
import PatternRecallDemo from '@/components/brain/PatternRecallDemo';
import KidHomepage from '@/components/brain/KidHomepage';
import ParentSetupHero from '@/components/brain/ParentSetupHero';

export default async function HomePage() {
  const [parent, activeChild, parentHasChildren] = await Promise.all([
    getParent(),
    getActiveChild(),
    hasChildren(),
  ]);

  // Kid mode → personalized dashboard, no marketing copy
  if (activeChild) {
    return <KidHomepage child={activeChild} />;
  }

  const showPickerBanner = parentHasChildren;
  // Logged-in parent with no kids → setup hero replaces the marketing hero
  const showSetupHero = parent && !parentHasChildren;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Picker prompt: parent has children but isn't in kid mode ──── */}
      {showPickerBanner && (
        <Link
          href="/kids"
          className="block bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-b border-purple-200 transition-colors"
        >
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-center gap-3 text-center">
            <span className="text-xl">👋</span>
            <span className="text-sm font-medium text-purple-800">
              {parent?.firstName ? `Welcome back, ${parent.firstName} — pick` : 'Pick'} a profile to start training
            </span>
            <span className="text-xs text-purple-600 hidden sm:inline">→</span>
          </div>
        </Link>
      )}

      {/* ── Parent setup hero: replaces marketing hero when logged in + no kids ── */}
      {showSetupHero && <ParentSetupHero firstName={parent.firstName} />}

      {/* ── HERO — Brain Training (only for logged-out / picker-banner users) ── */}
      {!showSetupHero && (
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

          {/* Left: copy + CTA */}
          <div className="text-center lg:text-left">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
              Brain Training for Kids 5–15
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-5 leading-tight">
              Train how your child thinks, not just what they learn.
            </h1>

            {/* Outcome promise — promoted to subtitle position */}
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-2 mb-7 text-sm sm:text-base text-blue-50 font-medium">
              <span className="text-base">✨</span>
              <span>10 minutes a day. Sharper focus and recall in 4 weeks.</span>
            </div>

            {/* Primary CTA */}
            <div>
              <Link
                href="/try"
                className="inline-block bg-white text-blue-800 font-bold px-8 py-4 rounded-full text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Try a brain game now →
              </Link>
              <p className="text-blue-200 text-xs mt-3">
                No signup required. Takes 2 minutes.
              </p>
            </div>
          </div>

          {/* Right: live demo with identity label */}
          <div className="flex flex-col items-center lg:items-end gap-3">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-100">
              <span>👀</span>
              <span>Live preview</span>
            </span>
            <PatternRecallDemo />
          </div>
        </div>
      </section>
      )}

      {/* ── BRIDGE — How it helps in school (smaller, secondary) ────────── */}
      <section className="bg-white py-10 px-6 border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/learn"
            className="group block bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all border border-blue-200 hover:border-blue-300"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">
                  Bridge to school
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  How it helps in school
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
                  Better thinking → better grades, naturally. Class 1–10
                  Science and Maths — browse by class, by subject, or take a quiz.
                </p>
              </div>
              <span className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-full text-sm group-hover:bg-blue-700 transition-colors shrink-0">
                Explore →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS — 5-step Loop ──────────────────────────────────── */}
      <section id="how-it-works" className="bg-gray-50 py-14 px-6 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              How it works
            </h2>
            <p className="text-gray-500 text-sm">
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
                className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-base sm:text-lg flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARENT VALUE — what insights look like ──────────────────────── */}
      <section className="bg-white py-14 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
              For parents
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              You won&rsquo;t just see scores — you&rsquo;ll see why.
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              After every session, we look at how your child played — not just whether
              they got it right — and turn it into something useful.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Sample insight card 1 */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Sample insight
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                &ldquo;Aarav&rsquo;s accuracy is steady, but he&rsquo;s rushing about
                <strong> 40% of his answers</strong>. Try a &lsquo;breathe before
                tap&rsquo; cue — he gets faster <em>and</em> more accurate when
                he slows down.&rdquo;
              </p>
            </div>

            {/* Sample insight card 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌱</span>
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                  Sample insight
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                &ldquo;Ananya guessed on 3 of 5 thinking puzzles this week — but
                <strong> her confidence is growing</strong>. Try the next
                difficulty level; she&rsquo;s ready.&rdquo;
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Examples shown. Your child&rsquo;s actual insights will be based on their own play.
          </p>
        </div>
      </section>

      {/* ── Returning users: Continue Learning ──────────────────────────── */}
      <ContinueLearning />
    </main>
  );
}
