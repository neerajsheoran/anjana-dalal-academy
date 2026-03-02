'use client';

import Link from 'next/link';
import { useState } from 'react';

const CLASSES = [
  { id: 'class-3', label: 'Class 3' },
  { id: 'class-4', label: 'Class 4' },
  { id: 'class-5', label: 'Class 5' },
  { id: 'class-6', label: 'Class 6' },
  { id: 'class-7', label: 'Class 7' },
];

const SUBJECTS = [
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'maths', label: 'Mathematics', icon: '📐' },
];

export default function HomePage() {
  const [quizClass, setQuizClass] = useState('class-6');
  const [quizSubject, setQuizSubject] = useState('science');
  const quizHref = `/class/${quizClass}/${quizSubject}`;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Class 3 to Class 7 · CBSE · NCERT
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

          {/* ── Card 1 — Browse by Class (Blue) ───────────────────────────── */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-lg flex flex-col">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl">
                📘
              </div>
            </div>
            {/* Title + subtitle */}
            <h3 className="text-white text-xl font-bold text-center mb-1">
              Browse by Class
            </h3>
            <p className="text-blue-100 text-sm text-center mb-6">
              Pick your class, then explore subjects and chapters at your own pace
            </p>
            {/* Class buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-auto">
              {CLASSES.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="bg-white/20 hover:bg-white/35 text-white font-semibold text-center py-2.5 rounded-xl transition-colors border border-white/25 text-sm"
                >
                  {cls.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Card 2 — Browse by Subject (Green) ────────────────────────── */}
          <div className="bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-6 shadow-lg flex flex-col">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl">
                🔬
              </div>
            </div>
            {/* Title + subtitle */}
            <h3 className="text-white text-xl font-bold text-center mb-1">
              Browse by Subject
            </h3>
            <p className="text-green-100 text-sm text-center mb-6">
              Choose a subject you love, then pick your class to explore chapters
            </p>
            {/* Subject buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              {SUBJECTS.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/subject/${sub.id}`}
                  className="bg-white/20 hover:bg-white/35 text-white font-semibold py-3 rounded-xl transition-colors border border-white/25 flex items-center justify-center gap-2"
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Card 3 — Quiz & Revision (Purple) ─────────────────────────── */}
          <div className="bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl p-6 shadow-lg flex flex-col">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl">
                🧠
              </div>
            </div>
            {/* Title + subtitle */}
            <h3 className="text-white text-xl font-bold text-center mb-1">
              Quiz &amp; Revision
            </h3>
            <p className="text-purple-100 text-sm text-center mb-5">
              Practice with MCQ quizzes or print question papers for any chapter
            </p>

            {/* Class picker */}
            <div className="mb-3">
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-2">
                Class
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setQuizClass(cls.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      quizClass === cls.id
                        ? 'bg-white text-purple-700 border-white'
                        : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                    }`}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject picker */}
            <div className="mb-5">
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-2">
                Subject
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setQuizSubject(sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      quizSubject === sub.id
                        ? 'bg-white text-purple-700 border-white'
                        : 'bg-white/20 text-white border-white/25 hover:bg-white/30'
                    }`}
                  >
                    {sub.icon} {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              href={quizHref}
              className="mt-auto w-full flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors"
            >
              Select Chapters &amp; Start →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
