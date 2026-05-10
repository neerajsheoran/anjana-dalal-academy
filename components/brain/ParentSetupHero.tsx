// Replaces the marketing hero on `/` when the parent is logged in but has
// no child profiles yet. Treats the empty state as the primary job-to-be-done:
// add a child to start training.
//
// The marketing sections (How it works, sample insights, etc.) still render
// below this — for parents who want to scroll and learn more before adding.

import Link from 'next/link';

export default function ParentSetupHero({ firstName }: { firstName: string }) {
  return (
    <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">

          {/* Greeting */}
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">
            Welcome to CogniLift
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
            {firstName ? `Hi ${firstName}, ready to start?` : 'Ready to start?'}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mb-6 leading-relaxed">
            Add your child&rsquo;s profile to track their daily progress, get
            personalized insights, and unlock games matched to their age.
          </p>

          {/* 3 benefit chips */}
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 sm:flex-col sm:text-center sm:items-start sm:p-4">
              <span className="text-2xl shrink-0">📊</span>
              <div className="min-w-0 sm:min-w-full">
                <p className="text-sm font-bold text-white">Daily progress</p>
                <p className="text-[11px] text-blue-200 leading-snug">
                  See what they trained, when, and how well
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 sm:flex-col sm:text-center sm:items-start sm:p-4">
              <span className="text-2xl shrink-0">🧠</span>
              <div className="min-w-0 sm:min-w-full">
                <p className="text-sm font-bold text-white">Personal insights</p>
                <p className="text-[11px] text-blue-200 leading-snug">
                  Spot patterns: rushing, guessing, growing confidence
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 sm:flex-col sm:text-center sm:items-start sm:p-4">
              <span className="text-2xl shrink-0">🎯</span>
              <div className="min-w-0 sm:min-w-full">
                <p className="text-sm font-bold text-white">Age-fit games</p>
                <p className="text-[11px] text-blue-200 leading-snug">
                  Auto-tunes difficulty to match each child
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Link
            href="/profile#children"
            className="inline-block bg-white text-blue-800 font-bold px-7 py-3.5 rounded-full text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            Add your child →
          </Link>

          {/* Secondary "just exploring" link */}
          <p className="text-blue-200 text-xs mt-4">
            Just exploring?{' '}
            <a
              href="#how-it-works"
              className="underline hover:text-white transition-colors"
            >
              See how it works ↓
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
