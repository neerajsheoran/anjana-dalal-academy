import Link from 'next/link';
import ContinueLearning from '@/components/progress/ContinueLearning';
import { getActiveChild, hasChildren } from '@/lib/active-child';

export default async function HomePage() {
  const [activeChild, parentHasChildren] = await Promise.all([
    getActiveChild(),
    hasChildren(),
  ]);
  const showPickerBanner = parentHasChildren && !activeChild;

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
              Pick a profile to start training
            </span>
            <span className="text-xs text-purple-600 hidden sm:inline">→</span>
          </div>
        </Link>
      )}

      {/* ── In kid mode: prompt to continue training ───────────────────── */}
      {activeChild && (
        <Link
          href="/brain"
          className="block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-center gap-3 text-center text-white">
            <span className="text-xl">🧠</span>
            <span className="text-sm font-medium">
              Train your brain, {activeChild.name}
            </span>
            <span className="text-xs">→</span>
          </div>
        </Link>
      )}

      {/* ── HERO — Brain Training (dominant) ────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Brain Training for Kids 5–15
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Train how your child thinks,
            <br />
            <span className="text-purple-200">not just what they learn.</span>
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Memory · Focus · Thinking — three brain skills your child uses every
            day in school and life. Train them with short, fun games.
          </p>

          {/* 3 Pillar pills */}
          <div className="flex justify-center gap-4 sm:gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-500/30 border-2 border-purple-300 flex items-center justify-center mb-2 mx-auto shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                <span className="text-3xl">🧠</span>
              </div>
              <p className="text-purple-200 text-sm font-semibold">Memory</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/30 border-2 border-green-300 flex items-center justify-center mb-2 mx-auto shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-green-200 text-sm font-semibold">Focus</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500/30 border-2 border-orange-300 flex items-center justify-center mb-2 mx-auto shadow-[0_0_30px_rgba(251,146,60,0.5)]">
                <span className="text-3xl">💡</span>
              </div>
              <p className="text-orange-200 text-sm font-semibold">Thinking</p>
            </div>
          </div>

          {/* Primary CTA */}
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
      </section>

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
      <section className="bg-gray-50 py-14 px-6">
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

      {/* ── Returning users: Continue Learning ──────────────────────────── */}
      <ContinueLearning />
    </main>
  );
}
