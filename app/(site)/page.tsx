import Link from 'next/link';
import { ArrowRight, Eye, Sparkles, Users } from 'lucide-react';
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
          className="block bg-cream hover:bg-cream-section border-b border-warm-line transition-colors"
        >
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-center gap-3 text-center">
            <Users className="w-4 h-4 text-brand shrink-0" strokeWidth={2.25} />
            <span className="text-sm font-medium text-ink">
              {parent?.firstName ? `Welcome back, ${parent.firstName} — pick` : 'Pick'} a profile to start training
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-light hidden sm:inline-block" strokeWidth={2.5} />
          </div>
        </Link>
      )}

      {/* ── Parent setup hero: replaces marketing hero when logged in + no kids ── */}
      {showSetupHero && <ParentSetupHero firstName={parent.firstName} />}

      {/* ── HERO — Brain Training (only for logged-out / picker-banner users) ── */}
      {!showSetupHero && (
      <section className="bg-white py-14 px-6 border-b border-cool-line">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

          {/* Left: copy + CTA */}
          <div className="text-center lg:text-left">
            <p className="text-brand text-xs font-bold uppercase tracking-widest mb-3">
              Brain Training for Kids 5–15
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-5 leading-tight text-ink">
              Train how your child thinks, not just what they learn.
            </h1>

            {/* Outcome promise — cream-accent pill adds warmth */}
            <div className="inline-flex items-center gap-2 bg-cream border border-warm-line rounded-full px-4 py-2 mb-7 text-sm sm:text-base text-ink-soft font-medium">
              <Sparkles className="w-4 h-4 text-brand" strokeWidth={2.25} />
              <span>10 minutes a day. Sharper focus and recall in 4 weeks.</span>
            </div>

            {/* Primary CTA */}
            <div>
              <Link
                href="/try"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-full text-base sm:text-lg shadow-md hover:shadow-lg transition-all"
              >
                Try a brain game now
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </Link>
              <p className="text-ink-light text-xs mt-3">
                No signup required. Takes 2 minutes.
              </p>
            </div>
          </div>

          {/* Right: live demo with identity label */}
          <div className="flex flex-col items-center lg:items-end gap-3">
            <span className="inline-flex items-center gap-1.5 bg-cream border border-warm-line rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-soft">
              <Eye className="w-3.5 h-3.5 text-brand" strokeWidth={2.25} />
              <span>Live preview</span>
            </span>
            <div className="bg-gradient-to-br from-blue-700 to-purple-700 rounded-3xl p-6 shadow-lg">
              <PatternRecallDemo />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── BRIDGE — How it helps in school (smaller, secondary) ────────── */}
      <section className="bg-white py-10 px-6 border-b border-cool-line">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/learn"
            className="group block bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all border border-cool-line hover:border-brand"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">
                  Bridge to school
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-ink mb-2">
                  How it helps in school
                </h2>
                <p className="text-ink-soft text-sm leading-relaxed max-w-xl">
                  Better thinking → better grades, naturally. Class 1–10
                  Science and Maths — browse by class, by subject, or take a quiz.
                </p>
              </div>
              <span className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-brand text-white font-semibold px-5 py-3 sm:py-2 rounded-full text-sm group-hover:bg-brand-hover transition-colors sm:shrink-0">
                Explore
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </div>
          </Link>
        </div>
      </section>

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
