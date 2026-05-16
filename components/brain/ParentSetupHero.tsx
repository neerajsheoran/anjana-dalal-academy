// Replaces the marketing hero on `/` when the parent is logged in but has
// no child profiles yet. Treats the empty state as the primary job-to-be-done:
// add a child to start training.
//
// The marketing sections (How it works, sample insights, etc.) still render
// below this — for parents who want to scroll and learn more before adding.

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  Target,
} from 'lucide-react';

export default function ParentSetupHero({ firstName }: { firstName: string }) {
  return (
    <section className="bg-white py-12 px-6 border-b border-cool-line">
      <div className="max-w-3xl mx-auto">
        <div className="bg-cream border border-warm-line rounded-3xl p-6 sm:p-8 shadow-sm">

          {/* Greeting */}
          <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">
            Welcome to CogniLift
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 leading-tight">
            {firstName ? `Hi ${firstName}, ready to start?` : 'Ready to start?'}
          </h1>
          <p className="text-ink-soft text-sm sm:text-base max-w-2xl mb-6 leading-relaxed">
            Add your child&rsquo;s profile to track their daily progress, get
            personalized insights, and unlock games matched to their age.
          </p>

          {/* 3 benefit chips */}
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
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

          {/* Primary CTA */}
          <Link
            href="/profile#children"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-7 py-3.5 rounded-full text-base shadow-md hover:shadow-lg transition-all"
          >
            Add your child
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>

          {/* Secondary "just exploring" link */}
          <p className="text-ink-light text-xs mt-4">
            Just exploring?{' '}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 underline hover:text-brand transition-colors"
            >
              See how it works
              <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
