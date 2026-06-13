// Replaces the marketing hero on `/` when the parent is logged in but
// has no child profiles yet. Treats the empty state as Step 1 of a
// quick onboarding — "add a child" is the one job-to-be-done and we
// make that crystal clear.
//
// Redesigned 2026-06-13 per user feedback:
//   - Step 1 of 3 badge so it reads as the START of a flow
//   - Big friendly kid emoji as the visual anchor
//   - 3 benefit cards reframed as "what unlocks AFTER" (a reward,
//     not a list of random benefits)
//   - Bigger primary CTA with the same kid icon repeated inside

import Link from 'next/link';
import {
  ChevronRight,
  BarChart3,
  Brain,
  ChevronDown,
  Sparkles,
  Target,
} from 'lucide-react';

export default function ParentSetupHero({ firstName }: { firstName: string }) {
  return (
    <section className="bg-white py-12 px-6 border-b border-cool-line">
      <div className="max-w-3xl mx-auto">
        <div className="bg-cream border border-warm-line rounded-3xl p-6 sm:p-10 shadow-sm">

          {/* Badge — frames the screen as the start of setup without
              implying a multi-step counter we don't actually have. */}
          <div className="flex items-center justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 bg-brand/10 text-brand text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              Quick setup
            </span>
          </div>

          {/* Friendly kid icon — the visual anchor that says
              "this page is about adding a child". Large emoji on a
              soft pastel halo: fast, mobile-safe, instantly readable. */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl sm:text-7xl shadow-inner">
                🧒
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold shadow-md">
                +
              </div>
            </div>
          </div>

          {/* Greeting + ask */}
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2 leading-tight">
              {firstName
                ? `Hi ${firstName}, let’s add your child’s profile`
                : 'Let’s add your child’s profile'}
            </h1>
            <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Just their name, age, and a 4-digit parent PIN. Takes 30 seconds.
            </p>
          </div>

          {/* Primary CTA — big, centered, with the same icon repeated
              inside so the eye connects icon → action */}
          <div className="flex items-center justify-center mb-7">
            <Link
              href="/family"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-full text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <span className="text-xl leading-none">🧒</span>
              <span>Add your child profile</span>
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* "Just exploring" escape hatch */}
          <p className="text-ink-light text-xs text-center mb-7">
            Just exploring?{' '}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 underline hover:text-brand transition-colors"
            >
              See how it works
              <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
            </a>
          </p>

          {/* Divider + "what unlocks next" — reframes the 3 cards as
              a reward for completing Step 1 */}
          <div className="border-t border-warm-line pt-6">
            <p className="text-ink-soft text-[11px] font-bold uppercase tracking-widest text-center mb-4">
              What unlocks after you add a child
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white border border-cool-line rounded-xl p-4 flex items-start gap-3 sm:flex-col sm:items-start">
                <BarChart3 className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
                <div className="min-w-0 sm:min-w-full">
                  <p className="text-sm font-bold text-ink">Daily progress</p>
                  <p className="text-[11px] text-ink-soft leading-snug">
                    See what they trained, when, and how well
                  </p>
                </div>
              </div>
              <div className="bg-white border border-cool-line rounded-xl p-4 flex items-start gap-3 sm:flex-col sm:items-start">
                <Brain className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
                <div className="min-w-0 sm:min-w-full">
                  <p className="text-sm font-bold text-ink">Personal insights</p>
                  <p className="text-[11px] text-ink-soft leading-snug">
                    Spot patterns: rushing, guessing, growing confidence
                  </p>
                </div>
              </div>
              <div className="bg-white border border-cool-line rounded-xl p-4 flex items-start gap-3 sm:flex-col sm:items-start">
                <Target className="w-5 h-5 text-brand shrink-0" strokeWidth={2} />
                <div className="min-w-0 sm:min-w-full">
                  <p className="text-sm font-bold text-ink">Age-fit games</p>
                  <p className="text-[11px] text-ink-soft leading-snug">
                    Auto-tunes difficulty to match each child
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
