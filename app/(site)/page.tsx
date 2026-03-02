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
  {
    id: 'maths',
    label: 'Mathematics',
    icon: '📐',
    desc: 'Numbers, algebra, geometry and more',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100 hover:border-blue-400',
    text: 'text-blue-800',
    sub: 'text-blue-500',
  },
  {
    id: 'science',
    label: 'Science',
    icon: '🔬',
    desc: 'Plants, animals, matter, and the world around us',
    bg: 'bg-green-50',
    border: 'border-green-200',
    hover: 'hover:bg-green-100 hover:border-green-400',
    text: 'text-green-800',
    sub: 'text-green-500',
  },
];

export default function HomePage() {
  const [quizClass, setQuizClass] = useState('class-6');
  const [quizSubject, setQuizSubject] = useState('science');

  const quizHref = `/class/${quizClass}/${quizSubject}`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Class 3 to Class 7 · CBSE · NCERT
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Learn CBSE the Easy Way
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
            Simple explanations, real-life Indian examples, and 3-level
            worksheets — designed for every average student.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/class/class-6"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
            >
              Start with Class 6
            </Link>
            <Link
              href="/subject/science"
              className="border border-blue-300 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              Browse by Subject
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Quiz / Revision Section ─────────────────────────────────────── */}
        <section className="mb-14">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🧠</span>
              <h3 className="text-xl font-bold text-purple-900">Quiz / Revision</h3>
            </div>
            <p className="text-purple-600 text-sm mb-6">
              Practice with MCQ quizzes or generate printable question papers for any chapter or full subject.
            </p>

            {/* Selectors */}
            <div className="flex flex-wrap gap-4 mb-6">
              {/* Class picker */}
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Class</p>
                <div className="flex gap-2 flex-wrap">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setQuizClass(cls.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        quizClass === cls.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject picker */}
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Subject</p>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECTS.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setQuizSubject(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        quizSubject === sub.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {sub.icon} {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-purple-500 mb-4">
              Select class and subject, then choose chapters or take a full subject quiz on the next page.
            </p>

            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Select Chapters &amp; Start →
            </Link>
          </div>
        </section>

        {/* ── Browse by Class ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Browse by Class</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {CLASSES.map((cls) => (
              <Link
                key={cls.id}
                href={`/class/${cls.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 text-center font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-700 hover:shadow-sm transition-all"
              >
                {cls.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Browse by Subject ────────────────────────────────────────────── */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Browse by Subject</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUBJECTS.map((subject) => (
              <Link
                key={subject.id}
                href={`/subject/${subject.id}`}
                className={`${subject.bg} border ${subject.border} ${subject.hover} rounded-xl p-6 flex items-center gap-4 transition-all`}
              >
                <span className="text-4xl">{subject.icon}</span>
                <div>
                  <p className={`text-lg font-semibold ${subject.text}`}>{subject.label}</p>
                  <p className={`text-sm mt-0.5 ${subject.sub}`}>{subject.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
