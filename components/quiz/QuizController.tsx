'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Stable identifiers (UUIDs) for the chapters being quizzed. Same
  // index order as chapterIds. Optional for backward compatibility with
  // any caller that hasn't been updated yet; the save API tolerates
  // missing chapterKeys.
  chapterKeys?: string[];
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QuizController({
  classLabel,
  subjectLabel,
  chapterTitles,
  allQuestions,
  classId,
  subject,
  chapterIds,
  chapterKeys,
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
  const [saved, setSaved] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer — ticks every second while quiz is active
  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Save quiz result to Firestore when quiz is completed
  useEffect(() => {
    if (phase !== 'result' || saved) return;

    const pct = Math.round((score / activeQuestions.length) * 100);

    fetch('/api/quiz/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score,
        total: activeQuestions.length,
        percentage: pct,
        classId,
        subject,
        chapterIds,
        ...(Array.isArray(chapterKeys) ? { chapterKeys } : {}),
        chapterTitles,
        difficulty,
        timeTaken: elapsed,
      }),
    })
      .then((res) => {
        if (res.ok) setSaved(true);
        setSaveAttempted(true);
      })
      .catch(() => {
        setSaveAttempted(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, saved, score, activeQuestions.length, classId, subject, chapterIds, chapterTitles, difficulty]);

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
    setElapsed(0);
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
    setSaved(false);
    setSaveAttempted(false);
    setElapsed(0);
    setPhase('quiz');
  }

  function handlePrint(withAnswers: boolean) {
    setPrintWithAnswers(withAnswers);
    setTimeout(() => window.print(), 80);
  }

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const quickCounts = [10, 20, available].filter((n, i, a) => n > 0 && (i < 2 ? n <= available : true) && a.indexOf(n) === i);

    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Top action bar */}
        <div className="flex justify-between gap-3 mb-8">
          <Link
            href="/quiz-start"
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
<ChevronLeft className="w-4 h-4 inline-block mr-1" strokeWidth={2} />Back to Chapters
          </Link>
          {available > 0 ? (
            mode === 'online' ? (
              <button
                onClick={handleStart}
                className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-green-200"
              >
                <span className="inline-flex items-center gap-1.5">Start Quiz<ChevronRight className="w-4 h-4" strokeWidth={2.5} /></span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-purple-200"
              >
                <span className="inline-flex items-center gap-1.5">Preview &amp; Print<ChevronRight className="w-4 h-4" strokeWidth={2.5} /></span>
              </button>
            )
          ) : (
            <span className="flex-1 text-center bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl text-sm cursor-not-allowed">
              Select difficulty first
            </span>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-4xl mb-3 block">🧠</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Ready for Exam Readiness?</h1>
          <p className="text-sm text-gray-500">
            {classLabel} · {subjectLabel} · {chapterTitles.length === 1
              ? chapterTitles[0]
              : `${chapterTitles.length} chapters`}
          </p>
        </div>

        <div className="space-y-6">
          {/* Difficulty Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Choose your challenge</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'easy' as QuizDifficulty, icon: '⭐', label: 'Easy', desc: 'Build confidence', color: 'green' },
                { key: 'mixed' as QuizDifficulty, icon: '⭐⭐', label: 'Mixed', desc: 'Best of both', color: 'blue' },
                { key: 'hard' as QuizDifficulty, icon: '⭐⭐⭐', label: 'Hard', desc: 'Push your limits', color: 'red' },
              ]).map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    difficulty === d.key
                      ? d.color === 'green' ? 'border-green-500 bg-green-50'
                        : d.color === 'blue' ? 'border-blue-500 bg-blue-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-lg block mb-1">{d.icon}</span>
                  <span className={`text-sm font-bold block ${
                    difficulty === d.key
                      ? d.color === 'green' ? 'text-green-700'
                        : d.color === 'blue' ? 'text-blue-700'
                        : 'text-red-700'
                      : 'text-gray-700'
                  }`}>{d.label}</span>
                  <span className="text-[11px] text-gray-400 block">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">How do you want to practice?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('online')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'online'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl block mb-2">📱</span>
                <span className={`text-sm font-bold block ${mode === 'online' ? 'text-green-700' : 'text-gray-700'}`}>
                  Take a Quiz
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Answer on screen, get instant results
                </span>
              </button>
              <button
                onClick={() => setMode('print')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'print'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl block mb-2">🖨️</span>
                <span className={`text-sm font-bold block ${mode === 'print' ? 'text-purple-700' : 'text-gray-700'}`}>
                  Print Paper
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Download and print for classroom use
                </span>
              </button>
            </div>
          </div>

          {/* Question Count */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              How many questions?
            </p>
            {available > 0 ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  {mode === 'online'
                    ? `${available} MCQ questions ready`
                    : `${available} questions ready (all types)`}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {quickCounts.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        count === n
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {n === available ? `All ${n}` : n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-amber-600 text-sm mt-2">
                No questions available for this difficulty. Try a different level.
              </p>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex justify-between gap-3 pt-4">
            <Link
              href="/quiz-start"
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
  <ChevronLeft className="w-4 h-4 inline-block mr-1" strokeWidth={2} />Back to Chapters
            </Link>
            {available > 0 ? (
              mode === 'online' ? (
                <button
                  onClick={handleStart}
                  className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-green-200"
                >
                  <span className="inline-flex items-center gap-1.5">Start Quiz<ChevronRight className="w-4 h-4" strokeWidth={2.5} /></span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-purple-200"
                >
                  <span className="inline-flex items-center gap-1.5">Preview &amp; Print<ChevronRight className="w-4 h-4" strokeWidth={2.5} /></span>
                </button>
              )
            ) : (
              <span className="flex-1 text-center bg-gray-100 text-gray-400 font-semibold py-3.5 rounded-xl text-sm cursor-not-allowed">
                Select difficulty first
              </span>
            )}
          </div>
          {mode === 'online' && count > 0 && available > 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              ~{Math.ceil(count * 0.5)} min for {count} questions
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = activeQuestions[currentIndex];
    const progress = ((currentIndex + 1) / activeQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
            <div className="flex gap-3">
              <span className="tabular-nums">{formatTime(elapsed)}</span>
              <span>
                Score: {score}/{currentIndex + (answered ? 1 : 0)}
              </span>
            </div>
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
            <span className="inline-flex items-center gap-1.5">{currentIndex < activeQuestions.length - 1 ? 'Next Question' : 'See Results'}<ChevronRight className="w-4 h-4" strokeWidth={2.5} /></span>
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
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
        <p className="text-gray-600 mb-2">
          You got{' '}
          <span className="font-bold text-blue-600">{score}</span> out of{' '}
          <span className="font-bold">{activeQuestions.length}</span> correct —{' '}
          <span className="font-bold">{pct}%</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Time taken: {formatTime(elapsed)}
        </p>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto mb-4">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        {pct >= 80 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 max-w-sm mx-auto">
            <p className="text-sm text-green-800 font-semibold">
              Quiz Passed! Great job!
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 max-w-sm mx-auto">
            <p className="text-sm text-amber-800">
              Score 80%+ to mark this chapter as quiz passed.
            </p>
          </div>
        )}
        {saved && (
          <p className="text-xs text-green-600 mb-4">Score saved to your profile.</p>
        )}
        {saveAttempted && !saved && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 max-w-sm mx-auto">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Want to save your score and track progress?
            </p>
            <Link
              href={`/login?from=${encodeURIComponent(`/quiz?class=${classId}&subject=${subject}&chapters=${chapterIds.join(',')}`)}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        )}
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Screen-only controls */}
        <div className="print:hidden mb-8">
          <button
            onClick={() => setPhase('setup')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
          >
<ChevronLeft className="w-4 h-4 inline-block mr-1" strokeWidth={2} />Back to Setup
          </button>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🖨️</span>
              <h1 className="text-2xl font-bold text-gray-800">Question Paper Preview</h1>
            </div>
            <p className="text-gray-500 text-sm mb-5 ml-12">
              {classLabel} · {subjectLabel} · {activeQuestions.length} questions
            </p>
            <div className="flex gap-3 flex-wrap ml-12">
              <button
                onClick={() => handlePrint(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                <span>📄</span> Questions Only
              </button>
              <button
                onClick={() => handlePrint(true)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                <span>📄</span> With Answers
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 ml-12">
              💡 Choose &quot;Save as PDF&quot; in the print dialog to download the paper
            </p>
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
                <div key={q.id} className="mb-6 pb-5 border-b border-gray-100 last:border-b-0">
                  <div className="flex gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {TYPE_LABEL[q.type] ?? q.type}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                      {q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'hard' ? 'Hard' : 'Medium'}
                    </span>
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
