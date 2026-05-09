'use client';

// Pattern Logic — Thinking module MVP activity.
// Mechanic: show an A-B-A-B-? alternating colour sequence; kid picks the
// correct continuation from 3 multiple-choice options.
// Reuses the same scoring/insight/persistence pipeline as the other activities.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModuleKey } from '@/lib/brain-modules';

// ── Game config ──────────────────────────────────────────────────────────
const SEQUENCE_LENGTH = 4;        // shown to user
const TOTAL_ROUNDS = 3;
const EXPECTED_TIME_SECONDS = 6;  // pattern reasoning needs a beat

// 6 distinct coloured circle emojis. Visually clear; works on all devices.
const COLOR_POOL = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'];

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

interface RoundSetup {
  sequence: string[];     // SEQUENCE_LENGTH alternating colours, e.g. [A, B, A, B]
  correct: string;        // the continuation (A)
  options: string[];      // 3 MC options, shuffled (includes correct, B, and 1 distractor)
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function generateRound(): RoundSetup {
  const [a, b, distractor] = pickN(COLOR_POOL, 3);
  // Build alternating sequence A B A B
  const sequence: string[] = [];
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    sequence.push(i % 2 === 0 ? a : b);
  }
  // Correct continuation in A B A B is A (since SEQUENCE_LENGTH is even)
  const correct = a;
  const options = pickN([correct, b, distractor], 3);
  return { sequence, correct, options };
}

export default function PatternLogicActivity({
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
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound());
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(option: string) {
    if (phase !== 'playing' || !setup) return;
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    setPicked(option);
    setPhase('reflection');
  }

  async function handleReflectionPick(opt: ReflectionOption) {
    if (!setup || picked === null) return;
    setSubmitting(true);
    setError('');

    const isCorrect = picked === setup.correct;

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'pattern-logic',
          moduleKey,
          difficultyLevel: 'easy',
          contentVariant: 'abstract',
          isCorrect,
          accuracyPercent: isCorrect ? 100 : 0,
          timeTakenSeconds: timeTakenRef.current,
          expectedTimeSeconds: EXPECTED_TIME_SECONDS,
          confidence: opt.confidence,
          reflection: opt.reflection,
          answerJson: { picked, sequence: setup.sequence },
          correctAnswerJson: { correct: setup.correct },
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
    setPicked(null);
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
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
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
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* ── Phase: Instruction ─────────────────────────────────────── */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              💡
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Pattern Logic</h1>
            <p className="text-orange-600 text-xs font-semibold mb-4">
              A Thinking game · {TOTAL_ROUNDS} rounds
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>
                <strong className="text-gray-800">1.</strong> You&apos;ll see a pattern of colours
              </li>
              <li>
                <strong className="text-gray-800">2.</strong> Figure out what comes next
              </li>
              <li>
                <strong className="text-gray-800">3.</strong> Pick the right answer
              </li>
            </ol>
            <div className="bg-orange-50 rounded-lg p-3 mb-6 text-xs text-gray-600">
              <p className="font-semibold mb-1">Example:</p>
              <p className="text-2xl tracking-wider">🔴 🔵 🔴 🔵 ❓</p>
              <p className="mt-1 text-[11px] text-gray-500">Answer: 🔴</p>
            </div>
            <button
              onClick={startRound}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1 →
            </button>
            <p className="text-[11px] text-gray-400 mt-3">
              Hi {childName} — think it through!
            </p>
          </div>
        )}

        {/* ── Phase: Playing ─────────────────────────────────────────── */}
        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              What comes next?
            </p>
            {/* Sequence */}
            <div className="flex items-center justify-center gap-2 mb-6 text-4xl">
              {setup.sequence.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
              <span className="text-gray-400">❓</span>
            </div>
            {/* Multiple choice */}
            <p className="text-center text-xs text-gray-400 mb-3">
              Pick one
            </p>
            <div className="grid grid-cols-3 gap-3">
              {setup.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  type="button"
                  onClick={() => handlePick(opt)}
                  className="aspect-square rounded-xl bg-gray-50 hover:bg-orange-50 active:bg-orange-100 active:scale-95 border-2 border-gray-100 hover:border-orange-200 flex items-center justify-center text-4xl transition-all"
                  aria-label={`Option ${i + 1}`}
                >
                  {opt}
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
                  className="bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl p-4 text-center transition-all disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
            {submitting && (
              <p className="text-xs text-orange-600 text-center mt-3 animate-pulse">
                Saving…
              </p>
            )}
          </div>
        )}

        {/* ── Phase: Result + Insight ────────────────────────────────── */}
        {phase === 'result' && lastResult && setup && picked !== null && (
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

            {/* Reveal: show sequence + correct vs picked */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                The pattern
              </p>
              <div className="flex items-center justify-center gap-1 text-3xl mb-3">
                {setup.sequence.map((c, i) => (
                  <span key={i}>{c}</span>
                ))}
                <span className="text-gray-300">→</span>
                <span className="ring-4 ring-green-300 rounded-full">{setup.correct}</span>
              </div>
              {!lastResult.isCorrect && (
                <p className="text-xs text-gray-500">
                  You picked <span className="text-2xl align-middle">{picked}</span> — correct was <span className="text-2xl align-middle">{setup.correct}</span>
                </p>
              )}
            </div>

            <div className="bg-orange-50 rounded-xl p-2 mb-4">
              <p className="text-xs text-orange-700">
                Round score: <strong>{lastResult.finalScore}/100</strong>
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS}) →` : 'See summary'}
            </button>
          </div>
        )}

        {/* ── Phase: Summary ─────────────────────────────────────────── */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">
              {childName} got {correctCount} out of {TOTAL_ROUNDS} correct
            </p>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-orange-700">{avgScore}</p>
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
                    <span className="text-xs font-bold text-orange-600">
                      {r.finalScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleRestart}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Play again
              </button>
              <button
                onClick={() => router.push(`/brain/${moduleKey}`)}
                className="w-full text-orange-600 hover:bg-orange-50 font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Back to Thinking module
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
