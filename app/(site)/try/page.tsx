'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Game config ──────────────────────────────────────────────────────────
const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const CELLS_TO_REMEMBER = 3;
const SHOW_DURATION_MS = 3000;
const TOTAL_ROUNDS = 3;

type Phase = 'instruction' | 'showing' | 'recalling' | 'result' | 'summary';

function generatePattern(): number[] {
  const all = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, CELLS_TO_REMEMBER).sort((a, b) => a - b);
}

function arrayEquals(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export default function TryPage() {
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [pattern, setPattern] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<boolean[]>([]);

  // Auto-transition: showing → recalling after duration
  useEffect(() => {
    if (phase === 'showing') {
      const t = setTimeout(() => setPhase('recalling'), SHOW_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function startRound() {
    setPattern(generatePattern());
    setSelected(new Set());
    setPhase('showing');
  }

  function toggleCell(i: number) {
    if (phase !== 'recalling') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleSubmit() {
    const userArr = Array.from(selected).sort((a, b) => a - b);
    const correct = arrayEquals(userArr, pattern);
    setResults((prev) => [...prev, correct]);
    setPhase('result');
  }

  function handleContinue() {
    if (round < TOTAL_ROUNDS) {
      setRound(round + 1);
      startRound();
    } else {
      setPhase('summary');
    }
  }

  function handleRestart() {
    setRound(1);
    setResults([]);
    setSelected(new Set());
    setPhase('instruction');
  }

  const lastResult = results[results.length - 1];
  const correctCount = results.filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10 px-4">
      <div className="max-w-sm mx-auto">

        {/* Round counter (visible during gameplay only) */}
        {phase !== 'instruction' && phase !== 'summary' && (
          <div className="text-center mb-4">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
              Round {round} of {TOTAL_ROUNDS}
            </p>
          </div>
        )}

        {/* ── Phase: Instruction ─────────────────────────────────────── */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🧠</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Pattern Recall
            </h1>
            <p className="text-purple-600 text-sm font-semibold mb-6">
              A Memory game
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-8">
              <li>
                <strong className="text-gray-800">1.</strong> Watch the
                highlighted boxes carefully
              </li>
              <li>
                <strong className="text-gray-800">2.</strong> They will disappear
                after 3 seconds
              </li>
              <li>
                <strong className="text-gray-800">3.</strong> Tap the same boxes
                you remember
              </li>
            </ol>
            <button
              onClick={startRound}
              className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl text-base hover:bg-purple-700 transition-colors shadow-md"
            >
              Start
            </button>
          </div>
        )}

        {/* ── Phase: Showing or Recalling (both render the grid) ──────── */}
        {(phase === 'showing' || phase === 'recalling') && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-center text-sm font-semibold text-gray-600 mb-6">
              {phase === 'showing'
                ? 'Watch the pattern…'
                : 'Tap the boxes you remember'}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
                const isHighlighted =
                  phase === 'showing' && pattern.includes(i);
                const isSelected = phase === 'recalling' && selected.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleCell(i)}
                    disabled={phase === 'showing'}
                    className={`aspect-square rounded-xl transition-all ${
                      isHighlighted
                        ? 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                        : isSelected
                        ? 'bg-purple-400 ring-4 ring-purple-200'
                        : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                    aria-label={`Cell ${i + 1}`}
                  />
                );
              })}
            </div>
            {phase === 'recalling' && (
              <button
                onClick={handleSubmit}
                disabled={selected.size === 0}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl text-base hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            )}
          </div>
        )}

        {/* ── Phase: Result ───────────────────────────────────────────── */}
        {phase === 'result' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
                lastResult ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {lastResult ? '✓' : '○'}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {lastResult ? 'Great memory!' : 'Good try!'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {lastResult
                ? 'You remembered the pattern correctly.'
                : 'Look carefully next time.'}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
                const isCorrect = pattern.includes(i);
                const wasSelected = selected.has(i);
                let bg = 'bg-gray-100';
                if (isCorrect && wasSelected) bg = 'bg-green-400';
                else if (isCorrect && !wasSelected) bg = 'bg-amber-300';
                else if (!isCorrect && wasSelected) bg = 'bg-red-300';
                return <div key={i} className={`aspect-square rounded-xl ${bg}`} />;
              })}
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-green-400 rounded" />
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-amber-300 rounded" />
                Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-300 rounded" />
                Wrong
              </span>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl text-base hover:bg-purple-700 transition-colors"
            >
              {round < TOTAL_ROUNDS ? 'Next round →' : 'See results'}
            </button>
          </div>
        )}

        {/* ── Phase: Summary ──────────────────────────────────────────── */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Done!</h2>
            <p className="text-purple-600 font-semibold text-base mb-1">
              You got {correctCount} out of {TOTAL_ROUNDS} correct
            </p>
            <p className="text-gray-500 text-sm mb-8">
              That&apos;s just one of many brain training games.
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Want to track your child&apos;s progress?
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Create an account to unlock more games, see brain scores, and
                watch growth over time.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-purple-600 text-white font-bold py-3 rounded-xl text-base hover:bg-purple-700 transition-colors"
              >
                Create an account
              </Link>
              <button
                onClick={handleRestart}
                className="w-full text-purple-600 font-semibold py-3 text-sm hover:bg-purple-50 rounded-xl transition-colors"
              >
                Play again
              </button>
              <Link
                href="/"
                className="block text-gray-500 text-xs hover:text-gray-700 transition-colors pt-1"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
