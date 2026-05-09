'use client';

// Find the Object — Focus module MVP activity.
// Mechanic: show a 3×3 grid of animal emojis, kid taps the target one.
// First tap ends the round (no submit button) — accuracy + time scored.
// Reuses the same scoring/insight/persistence pipeline as PatternRecallActivity.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModuleKey } from '@/lib/brain-modules';

// ── Game config ──────────────────────────────────────────────────────────
const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const TOTAL_ROUNDS = 3;
const EXPECTED_TIME_SECONDS = 5; // Finding should be quick

// 20 visually distinct animal emojis to draw from
const ANIMAL_POOL = [
  '🐶', '🐱', '🐰', '🦁', '🐸', '🐻', '🐼', '🦊', '🐨', '🐵',
  '🐯', '🐮', '🐷', '🐔', '🦄', '🐢', '🐘', '🐧', '🐳', '🐝',
];

type Phase =
  | 'instruction'
  | 'playing'
  | 'reflection'
  | 'result'
  | 'summary';

interface ReflectionOption {
  key: 'felt-easy' | 'felt-tricky' | 'rushed' | 'guessed';
  label: string;
  emoji: string;
  confidence: 'low' | 'medium' | 'high';
  reflection: 'understood' | 'looked-carefully' | 'guessed' | 'distracted';
}

const REFLECTION_OPTIONS: ReflectionOption[] = [
  { key: 'felt-easy',   label: 'Felt easy',   emoji: '😊', confidence: 'high',   reflection: 'understood' },
  { key: 'felt-tricky', label: 'Felt tricky', emoji: '🤔', confidence: 'medium', reflection: 'looked-carefully' },
  { key: 'rushed',      label: 'I rushed',    emoji: '⚡', confidence: 'medium', reflection: 'distracted' },
  { key: 'guessed',     label: 'I guessed',   emoji: '🎲', confidence: 'low',    reflection: 'guessed' },
];

interface RoundResult {
  isCorrect: boolean;
  finalScore: number;
  insightTitle: string;
  insightMessage: string;
}

// Pick `count` distinct animals from the pool
function pickAnimals(count: number): string[] {
  const shuffled = [...ANIMAL_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

interface RoundSetup {
  cells: string[];      // 9 distinct animal emojis
  target: string;       // one of cells[]
  targetIndex: number;  // index in cells[] for verification
}

function generateRound(): RoundSetup {
  const cells = pickAnimals(TOTAL_CELLS);
  const targetIndex = Math.floor(Math.random() * TOTAL_CELLS);
  return { cells, target: cells[targetIndex], targetIndex };
}

export default function FindTheObjectActivity({
  moduleKey,
  childName,
}: {
  moduleKey: ModuleKey;
  childName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound());
    setTappedIndex(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handleCellTap(index: number) {
    if (phase !== 'playing' || !setup) return;
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    setTappedIndex(index);
    setPhase('reflection');
  }

  async function handleReflectionPick(opt: ReflectionOption) {
    if (!setup || tappedIndex === null) return;
    setSubmitting(true);
    setError('');

    const isCorrect = tappedIndex === setup.targetIndex;

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'find-the-object',
          moduleKey,
          difficultyLevel: 'easy',
          contentVariant: 'abstract',
          isCorrect,
          accuracyPercent: isCorrect ? 100 : 0,
          timeTakenSeconds: timeTakenRef.current,
          expectedTimeSeconds: EXPECTED_TIME_SECONDS,
          confidence: opt.confidence,
          reflection: opt.reflection,
          answerJson: { tappedIndex, tappedEmoji: setup.cells[tappedIndex] },
          correctAnswerJson: { targetIndex: setup.targetIndex, targetEmoji: setup.target },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save attempt');
      }

      const data = (await res.json()) as {
        scores: { finalActivityScore: number };
        insight: { title: string; message: string };
      };

      setResults((prev) => [
        ...prev,
        {
          isCorrect,
          finalScore: data.scores.finalActivityScore,
          insightTitle: data.insight.title,
          insightMessage: data.insight.message,
        },
      ]);
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save round');
    } finally {
      setSubmitting(false);
    }
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
    setTappedIndex(null);
    setSetup(null);
    setError('');
    setPhase('instruction');
  }

  const lastResult = results[results.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.finalScore, 0) / results.length,
        )
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-sm mx-auto">

        {/* Top bar: round counter + exit */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/brain/${moduleKey}`}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && (
            <p className="text-xs font-semibold text-green-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* ── Phase: Instruction ─────────────────────────────────────── */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎯
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Find the Object</h1>
            <p className="text-green-600 text-xs font-semibold mb-4">
              A Focus game · {TOTAL_ROUNDS} rounds
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>
                <strong className="text-gray-800">1.</strong> You&apos;ll see a target animal at the top
              </li>
              <li>
                <strong className="text-gray-800">2.</strong> Find the same animal in the grid below
              </li>
              <li>
                <strong className="text-gray-800">3.</strong> Tap it as fast as you can
              </li>
            </ol>
            <button
              onClick={startRound}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1 →
            </button>
            <p className="text-[11px] text-gray-400 mt-3">
              Hi {childName} — focus and tap quick!
            </p>
          </div>
        )}

        {/* ── Phase: Playing ─────────────────────────────────────────── */}
        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500 mb-1">Find this:</p>
              <div className="text-5xl">{setup.target}</div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {setup.cells.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCellTap(i)}
                  className="aspect-square rounded-xl bg-gray-50 hover:bg-green-50 active:bg-green-100 active:scale-95 border-2 border-gray-100 hover:border-green-200 flex items-center justify-center text-4xl transition-all"
                  aria-label={`Cell ${i + 1}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Phase: Reflection ──────────────────────────────────────── */}
        {phase === 'reflection' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-base font-bold text-gray-800 text-center mb-1">
              How did that go?
            </h2>
            <p className="text-xs text-gray-500 text-center mb-5">
              Tap the one that fits best
            </p>
            <div className="grid grid-cols-2 gap-3">
              {REFLECTION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleReflectionPick(opt)}
                  disabled={submitting}
                  className="bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl p-4 text-center transition-all disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
            {submitting && (
              <p className="text-xs text-green-600 text-center mt-3 animate-pulse">
                Saving…
              </p>
            )}
          </div>
        )}

        {/* ── Phase: Result + Insight ────────────────────────────────── */}
        {phase === 'result' && lastResult && setup && tappedIndex !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
                lastResult.isCorrect
                  ? 'bg-green-100 text-green-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {lastResult.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {lastResult.insightTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-4 px-2 leading-relaxed">
              {lastResult.insightMessage}
            </p>

            {/* Reveal target vs your tap */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  Target
                </p>
                <div className="w-16 h-16 rounded-xl bg-green-100 border-2 border-green-300 flex items-center justify-center text-3xl">
                  {setup.target}
                </div>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  You tapped
                </p>
                <div
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl ${
                    lastResult.isCorrect
                      ? 'bg-green-100 border-green-300'
                      : 'bg-red-100 border-red-300'
                  }`}
                >
                  {setup.cells[tappedIndex]}
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-2 mb-4">
              <p className="text-xs text-green-700">
                Round score: <strong>{lastResult.finalScore}/100</strong>
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS}) →` : 'See summary'}
            </button>
          </div>
        )}

        {/* ── Phase: Summary ─────────────────────────────────────────── */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">
              {childName} got {correctCount} out of {TOTAL_ROUNDS} correct
            </p>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-green-700">{avgScore}</p>
              <p className="text-[10px] text-gray-400">out of 100</p>
            </div>

            <div className="space-y-2 mb-5 text-left">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-gray-500">Round {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        r.isCorrect ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {r.isCorrect ? 'Correct' : 'Missed'}
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      {r.finalScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleRestart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Play again
              </button>
              <button
                onClick={() => router.push(`/brain/${moduleKey}`)}
                className="w-full text-green-600 hover:bg-green-50 font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Back to Focus module
              </button>
              <button
                onClick={() => router.push('/brain')}
                className="w-full text-gray-500 hover:text-gray-700 text-xs py-1 transition-colors"
              >
                ← Back to Brain
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
