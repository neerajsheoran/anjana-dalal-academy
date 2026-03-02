'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  QuizQuestion,
  QuizDifficulty,
  QuizMode,
  filterQuestions,
  sampleQuestions,
  shuffleArray,
} from '@/lib/quiz';

type Phase = 'setup' | 'quiz' | 'result' | 'print';

interface Props {
  classLabel: string;
  subjectLabel: string;
  chapterTitles: string[];
  allQuestions: QuizQuestion[];
  classId: string;
  subject: string;
  chapterIds: string[];
}

const TYPE_LABEL: Record<string, string> = {
  mcq: 'MCQ',
  short: 'Short Answer',
  fill: 'Fill in the Blank',
  long: 'Long Answer',
};

const DIFF_STARS: Record<string, string> = {
  easy: '★',
  medium: '★★',
  hard: '★★★',
};

export default function QuizController({
  classLabel,
  subjectLabel,
  chapterTitles,
  allQuestions,
  classId,
  subject,
  chapterIds,
}: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('mixed');
  const [mode, setMode] = useState<QuizMode>('online');
  const [count, setCount] = useState<number>(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [printWithAnswers, setPrintWithAnswers] = useState(false);

  const availableOnline = useMemo(
    () => filterQuestions(allQuestions, difficulty, true).length,
    [allQuestions, difficulty],
  );
  const availablePrint = useMemo(
    () => filterQuestions(allQuestions, difficulty, false).length,
    [allQuestions, difficulty],
  );
  const available = mode === 'online' ? availableOnline : availablePrint;

  // Reset count when difficulty or mode changes
  useEffect(() => {
    setCount(available);
  }, [available]);

  // Shuffle MCQ options when question changes
  useEffect(() => {
    if (phase === 'quiz' && activeQuestions[currentIndex]?.type === 'mcq') {
      setShuffledOptions(shuffleArray(activeQuestions[currentIndex].options));
    }
  }, [phase, currentIndex, activeQuestions]);

  function handleStart() {
    const pool = filterQuestions(allQuestions, difficulty, mode === 'online');
    const effectiveCount = count > 0 ? Math.min(count, pool.length) : pool.length;
    const sampled = sampleQuestions(pool, effectiveCount);
    setActiveQuestions(sampled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setPhase(mode === 'online' ? 'quiz' : 'print');
  }

  function handleSelectAnswer(option: string) {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);
    if (option === activeQuestions[currentIndex].answer) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setPhase('result');
    }
  }

  function handleRetry() {
    const pool = filterQuestions(allQuestions, difficulty, true);
    const sampled = sampleQuestions(pool, activeQuestions.length);
    setActiveQuestions(sampled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setPhase('quiz');
  }

  function handlePrint(withAnswers: boolean) {
    setPrintWithAnswers(withAnswers);
    setTimeout(() => window.print(), 80);
  }

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">
            {classLabel} · {subjectLabel}
          </p>
          <h1 className="text-2xl font-bold text-gray-800">Quiz / Revision</h1>
          <p className="text-sm text-gray-500 mt-1">
            {chapterTitles.length === 1
              ? chapterTitles[0]
              : `${chapterTitles.length} chapters selected`}
          </p>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Difficulty</p>
          <div className="flex gap-2 flex-wrap">
            {(['easy', 'mixed', 'hard'] as QuizDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  difficulty === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {d === 'easy' ? 'Easy Only' : d === 'hard' ? 'Hard Only' : 'Mixed'}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Mode</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMode('online')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === 'online'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              Online Quiz (Students)
            </button>
            <button
              onClick={() => setMode('print')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === 'print'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
              }`}
            >
              Question Paper (Teachers)
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {mode === 'online'
              ? 'MCQ questions only · Automatic scoring · Score shown at end'
              : 'All question types · Print questions + separate answer key'}
          </p>
        </div>

        {/* Count */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {available} questions available
          </p>
          {available > 0 ? (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">How many questions?</label>
              <input
                type="number"
                min={1}
                max={available}
                value={count > 0 ? count : available}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1;
                  setCount(Math.min(available, Math.max(1, v)));
                }}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <p className="text-amber-600 text-sm">
              No questions available for this difficulty selection.
            </p>
          )}
        </div>

        {/* Action */}
        {available > 0 &&
          (mode === 'online' ? (
            <button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Start Quiz →
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Preview &amp; Print →
            </button>
          ))}
      </div>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = activeQuestions[currentIndex];
    const progress = ((currentIndex + 1) / activeQuestions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
            <span>
              Score: {score}/{currentIndex + (answered ? 1 : 0)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">{q.chapterTitle}</p>
          <p className="text-lg font-medium text-gray-800 leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-4">
          {shuffledOptions.map((option) => {
            const isCorrect = option === q.answer;
            const isSelected = option === selectedAnswer;
            let cls =
              'bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50';
            if (answered) {
              if (isCorrect) cls = 'bg-green-50 border-green-500 text-green-800';
              else if (isSelected) cls = 'bg-red-50 border-red-400 text-red-700';
              else cls = 'bg-white border-gray-100 text-gray-400 opacity-60';
            }
            return (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                disabled={answered}
                className={`text-left px-5 py-3.5 rounded-xl border font-medium transition-colors ${cls}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && q.explanation && (
          <div
            className={`rounded-xl px-4 py-3 mb-4 text-sm ${
              selectedAnswer === q.answer
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <span className="font-semibold">
              {selectedAnswer === q.answer ? 'Correct! ' : 'Incorrect. '}
            </span>
            {q.explanation}
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            {currentIndex < activeQuestions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        )}
      </div>
    );
  }

  // ─── RESULT ──────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const pct = Math.round((score / activeQuestions.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚';
    const barColor =
      pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500';
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
        <p className="text-gray-600 mb-6">
          You got{' '}
          <span className="font-bold text-blue-600">{score}</span> out of{' '}
          <span className="font-bold">{activeQuestions.length}</span> correct —{' '}
          <span className="font-bold">{pct}%</span>
        </p>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto mb-8">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link
            href={`/class/${classId}/${subject}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Chapters
          </Link>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── PRINT ───────────────────────────────────────────────────────────────
  if (phase === 'print') {
    // Group questions by chapter
    const byChapter = new Map<string, QuizQuestion[]>();
    for (const q of activeQuestions) {
      if (!byChapter.has(q.chapterId)) byChapter.set(q.chapterId, []);
      byChapter.get(q.chapterId)!.push(q);
    }

    let globalNum = 0;

    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Screen-only controls */}
        <div className="print:hidden mb-8">
          <button
            onClick={() => setPhase('setup')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            ← Back to Setup
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Question Paper Preview</h1>
          <p className="text-gray-500 text-sm mb-6">
            {activeQuestions.length} questions · {classLabel} {subjectLabel}
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handlePrint(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Print Questions Only
            </button>
            <button
              onClick={() => handlePrint(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Print with Answer Key
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold">
            {classLabel} — {subjectLabel}
          </h1>
          <p className="text-sm text-gray-500 mb-2">
            {chapterTitles.join(' · ')} &nbsp;|&nbsp; {activeQuestions.length} Questions
          </p>
          <div className="border-b border-gray-400 mt-2 mb-4" />
          <div className="flex justify-between text-sm">
            <span>Name: _______________________________</span>
            <span>
              Date: _____________&nbsp;&nbsp; Marks: ________ / {activeQuestions.length}
            </span>
          </div>
          <div className="border-b border-gray-300 mt-3" />
        </div>

        {/* Questions */}
        {Array.from(byChapter.entries()).map(([chapId, qs]) => (
          <div key={chapId} className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-4">
              {qs[0].chapterTitle}
            </h2>
            {qs.map((q) => {
              globalNum += 1;
              const num = globalNum;
              return (
                <div key={q.id} className="mb-6">
                  <div className="flex gap-2 text-xs text-gray-400 mb-0.5">
                    <span>[{TYPE_LABEL[q.type] ?? q.type}]</span>
                    <span>{DIFF_STARS[q.difficulty]}</span>
                  </div>
                  <p className="font-medium text-gray-800">
                    {num}. {q.question}
                  </p>

                  {/* MCQ options */}
                  {q.type === 'mcq' && q.options.length > 0 && (
                    <div className="mt-2 ml-4 grid grid-cols-2 gap-x-4 gap-y-1">
                      {q.options.map((opt, oi) => (
                        <span key={oi} className="text-sm text-gray-600">
                          {String.fromCharCode(65 + oi)}. {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Answer lines */}
                  {q.type === 'fill' && (
                    <div className="mt-2 ml-4 text-sm text-gray-400">
                      Answer: ___________________________
                    </div>
                  )}
                  {q.type === 'short' && (
                    <div className="mt-2 ml-4 space-y-2">
                      <div className="border-b border-gray-200 h-5" />
                      <div className="border-b border-gray-200 h-5" />
                    </div>
                  )}
                  {q.type === 'long' && (
                    <div className="mt-2 ml-4 space-y-2">
                      {[...Array(7)].map((_, li) => (
                        <div key={li} className="border-b border-gray-200 h-6" />
                      ))}
                    </div>
                  )}

                  {/* Answer — controlled by printWithAnswers state */}
                  <div
                    className={
                      printWithAnswers ? 'print:block hidden mt-2 ml-4' : 'print:hidden hidden'
                    }
                  >
                    <div className="bg-green-50 border border-green-200 rounded px-3 py-1.5 text-sm text-green-800">
                      <span className="font-semibold">Answer: </span>
                      {q.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
