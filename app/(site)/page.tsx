import Link from 'next/link';
import ContinueLearning from '@/components/progress/ContinueLearning';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Class 1 to Class 12 · CBSE · NCERT
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Learn CBSE the Easy Way
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Simple explanations, real-life Indian examples, and 3-level
            worksheets — designed for every student.
          </p>
        </div>
      </section>

      {/* ── 3 Learning Cards ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          How do you want to learn today?
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          Choose one of the options below to get started
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Browse by Class ───────────────────────────────────────────── */}
          <Link
            href="/classes"
            className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <div className="w-24 h-24 bg-white/25 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
              <span className="text-5xl animate-bounce">🎒</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Browse by Class</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Pick your class, then explore subjects and chapters at your own pace
            </p>
            <span className="mt-6 text-white/60 text-sm font-medium">Tap to get started →</span>
          </Link>

          {/* ── Browse by Subject ─────────────────────────────────────────── */}
          <Link
            href="/subjects"
            className="group bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <div className="mb-5 group-hover:scale-110 transition-transform duration-200">
              <img src="/icons/subjects-icon.svg" alt="" className="w-24 h-24 animate-wiggle" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Browse by Subject</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              Choose a subject you love, then pick your class to explore chapters
            </p>
            <span className="mt-6 text-white/60 text-sm font-medium">Tap to get started →</span>
          </Link>

          {/* ── Quiz & Revision ───────────────────────────────────────────── */}
          <Link
            href="/quiz-start"
            className="group bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <div className="mb-5 group-hover:scale-110 transition-transform duration-200">
              <img src="/icons/quiz-icon.svg" alt="" className="w-24 h-24 animate-heartbeat" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Quiz &amp; Revision</h3>
            <p className="text-purple-100 text-sm leading-relaxed">
              Practice with MCQ quizzes or print question papers for any chapter
            </p>
            <span className="mt-6 text-white/60 text-sm font-medium">Tap to get started →</span>
          </Link>

        </div>
      </div>

      <ContinueLearning />
    </main>
  );
}
