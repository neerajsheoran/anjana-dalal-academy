'use client';

// Pattern Recall — Memory module MVP activity for the brain training flow.
// Different from /try (the no-signup demo): saves attempts to Firestore via
// /api/attempts, captures reflection + confidence, shows insight per round.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModuleKey } from '@/lib/brain-modules';

// ── Game config ──────────────────────────────────────────────────────────
const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const CELLS_TO_REMEMBER = 3;
const SHOW_DURATION_MS = 3000;
const TOTAL_ROUNDS = 3;
const EXPECTED_TIME_SECONDS = 6; // Used for time-score calculation

type Phase =
  | 'instruction'
  | 'showing'
  | 'recalling'
  | 'reflection'
  | 'result'
  | 'summary';

interface ReflectionOption {
  key: 'felt-easy' | 'felt-tricky' | 'guessed' | 'rushed';
  label: string;
  emoji: string;
  confidence: 'low' | 'medium' | 'high';
  reflection:
    | 'understood'
    | 'looked-carefully'
    | 'guessed'
    | 'distracted';
}

const REFLECTION_OPTIONS: ReflectionOption[] = [
  { key: 'felt-easy', label: 'Felt easy', emoji: '😊', confidence: 'high', reflection: 'understood' },
  { key: 'felt-tricky', label: 'Felt tricky', emoji: '🤔', confidence: 'medium', reflection: 'looked-carefully' },
  { key: 'rushed', label: 'I rushed', emoji: '⚡', confidence: 'medium', reflection: 'distracted' },
  { key: 'guessed', label: 'I guessed', emoji: '🎲', confidence: 'low', reflection: 'guessed' },
];

interface RoundResult {
  isCorrect: boolean;
  finalScore: number;
  insightTitle: string;
  insightMessage: string;
}

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

export default function PatternRecallActivity({
  moduleKey,
  childName,
}: {
  moduleKey: ModuleKey;
  childName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [pattern, setPattern] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  // Auto-advance: showing → recalling
  useEffect(() => {
    if (phase === 'showing') {
      const t = setTimeout(() => {
        startTimeRef.current = Date.now();
        setPhase('recalling');
      }, SHOW_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function startRound() {
    setPattern(generatePattern());
    setSelected(new Set());
    setError('');
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

  function handleSubmitRecall() {
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    setPhase('reflection');
  }

  async function handleReflectionPick(opt: ReflectionOption) {
    setSubmitting(true);
    setError('');

    const userArr = Array.from(selected).sort((a, b) => a - b);
    const isCorrect = arrayEquals(userArr, pattern);
    // Partial credit: % of correct cells
    const correctOverlap = userArr.filter((c) => pattern.includes(c)).length;
    const accuracyPercent = Math.round(
      (correctOverlap / pattern.length) * 100,
    );

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'pattern-recall',
          moduleKey,
          difficultyLevel: 'easy',
          contentVariant: 'abstract',
          isCorrect,
          accuracyPercent,
          timeTakenSeconds: timeTakenRef.current,
          expectedTimeSeconds: EXPECTED_TIME_SECONDS,
          confidence: opt.confidence,
          reflection: opt.reflection,
          answerJson: { selectedCells: userArr },
          correctAnswerJson: { correctCells: pattern },
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
    setSelected(new Set());
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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
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
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* ── Phase: Instruction ─────────────────────────────────────── */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🧠
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Pattern Recall</h1>
            <p className="text-purple-600 text-xs font-semibold mb-4">
              A Memory game · {TOTAL_ROUNDS} rounds
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>
                <strong className="text-gray-800">1.</strong> Watch the highlighted boxes
              </li>
              <li>
                <strong className="text-gray-800">2.</strong> They disappear after 3 seconds
              </li>
              <li>
                <strong className="text-gray-800">3.</strong> Tap the same boxes you remember
              </li>
            </ol>
            <button
              onClick={startRound}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1 →
            </button>
            <p className="text-[11px] text-gray-400 mt-3">
              Hi {childName} — give it your best!
            </p>
          </div>
        )}

        {/* ── Phase: Showing or Recalling ────────────────────────────── */}
        {(phase === 'showing' || phase === 'recalling') && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              {phase === 'showing' ? 'Watch carefully…' : 'Tap the boxes you remember'}
            </p>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
                const isHighlighted = phase === 'showing' && pattern.includes(i);
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
                onClick={handleSubmitRecall}
                disabled={selected.size === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            )}
          </div>
        )}

        {/* ── Phase: Reflection (combined confidence + reflection) ────── */}
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
                  className="bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-4 text-center transition-all disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
            {submitting && (
              <p className="text-xs text-purple-600 text-center mt-3 animate-pulse">
                Saving…
              </p>
            )}
          </div>
        )}

        {/* ── Phase: Result + Insight ────────────────────────────────── */}
        {phase === 'result' && lastResult && (
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

            {/* Visual diff: correct vs your answer */}
            <div className="grid grid-cols-3 gap-2 mb-4 px-4">
              {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
                const isCorrectCell = pattern.includes(i);
                const wasSelected = selected.has(i);
                let bg = 'bg-gray-100';
                if (isCorrectCell && wasSelected) bg = 'bg-green-400';
                else if (isCorrectCell && !wasSelected) bg = 'bg-amber-300';
                else if (!isCorrectCell && wasSelected) bg = 'bg-red-300';
                return <div key={i} className={`aspect-square rounded-lg ${bg}`} />;
              })}
            </div>
            <div className="flex justify-center gap-3 text-[10px] text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded" />
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-amber-300 rounded" />
                Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-300 rounded" />
                Wrong
              </span>
            </div>

            <div className="bg-purple-50 rounded-xl p-2 mb-4">
              <p className="text-xs text-purple-700">
                Round score: <strong>{lastResult.finalScore}/100</strong>
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS}) →` : 'See summary'}
            </button>
          </div>
        )}

        {/* ── Phase: Summary ─────────────────────────────────────────── */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">
              {childName} got {correctCount} out of {TOTAL_ROUNDS} correct
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-purple-700">{avgScore}</p>
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
                    <span className="text-xs font-bold text-purple-600">
                      {r.finalScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleRestart}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Play again
              </button>
              <button
                onClick={() => router.push(`/brain/${moduleKey}`)}
                className="w-full text-purple-600 hover:bg-purple-50 font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Back to Memory module
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
