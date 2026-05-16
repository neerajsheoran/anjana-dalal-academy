'use client';

// Number Sequence — Thinking module, elder-kid activity.
// Show 5 numbers following a pattern; kid picks what comes next.
// Easy: arithmetic (e.g. 2,4,6,8,?). Medium: geometric (e.g. 2,4,8,16,?).
// Hard: mixed (e.g. squared, Fibonacci-like, alternating ops).

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  NUMBER_SEQUENCE_CONFIG,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';
import {
  REFLECTION_OPTIONS,
  type ReflectionOption,
} from '@/components/brain/reflection-options';
import { useCelebration } from '@/lib/use-celebration';

const TOTAL_ROUNDS = 3;

type Phase =
  | 'instruction'
  | 'playing'
  | 'roundResult'
  | 'reflection'
  | 'submitting'
  | 'summary';


interface RoundResult {
  isCorrect: boolean;
  finalScore: number;
  insightTitle: string;
  insightMessage: string;
}

interface RoundSetup {
  sequence: number[];      // numbers shown
  correct: number;         // the next number
  options: number[];       // shuffled multiple choice (includes correct)
  hint: string;            // human-readable pattern hint, shown after answer
}

interface RoundData {
  setup: RoundSetup;
  picked: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRound(
  patternKind: 'arithmetic' | 'geometric' | 'mixed',
  showCount: number,
  optionCount: number,
): RoundSetup {
  let sequence: number[] = [];
  let correct = 0;
  let hint = '';

  if (patternKind === 'arithmetic') {
    const start = rng(1, 12);
    const d = rng(2, 9);
    sequence = Array.from({ length: showCount }, (_, i) => start + i * d);
    correct = start + showCount * d;
    hint = `+${d} each step`;
  } else if (patternKind === 'geometric') {
    const start = rng(2, 5);
    const r = rng(2, 3);
    sequence = Array.from({ length: showCount }, (_, i) => start * Math.pow(r, i));
    correct = start * Math.pow(r, showCount);
    hint = `×${r} each step`;
  } else {
    // mixed: pick one of {squared, fibonacci, alternating-ops}
    const kind = rng(0, 2);
    if (kind === 0) {
      // n² style: 1, 4, 9, 16, 25, ?
      const start = rng(1, 3);
      sequence = Array.from({ length: showCount }, (_, i) => Math.pow(start + i, 2));
      correct = Math.pow(start + showCount, 2);
      hint = 'each is the next number squared';
    } else if (kind === 1) {
      // Fibonacci-like: a, b, a+b, a+2b, 2a+3b, …
      const a = rng(1, 4);
      const b = rng(2, 6);
      sequence = [a, b];
      while (sequence.length < showCount) {
        sequence.push(sequence[sequence.length - 2] + sequence[sequence.length - 1]);
      }
      correct = sequence[sequence.length - 2] + sequence[sequence.length - 1];
      hint = 'add the previous two';
    } else {
      // alternating ops: +d, ×2, +d, ×2, …
      const start = rng(1, 5);
      const d = rng(2, 5);
      sequence = [start];
      for (let i = 1; i < showCount; i++) {
        if (i % 2 === 1) sequence.push(sequence[i - 1] + d);
        else sequence.push(sequence[i - 1] * 2);
      }
      correct =
        showCount % 2 === 1
          ? sequence[showCount - 1] + d
          : sequence[showCount - 1] * 2;
      hint = `alternates +${d} and ×2`;
    }
  }

  // Build distractors: nearby numbers that look plausible
  const distractors = new Set<number>();
  while (distractors.size < optionCount - 1) {
    // ±d / ±1 / ±2 around correct
    const offset = [-2, -1, 1, 2, -3, 3].sort(() => Math.random() - 0.5)[0];
    const candidate = correct + offset * Math.max(1, Math.floor(correct * 0.05));
    if (candidate !== correct && candidate > 0 && !distractors.has(candidate)) {
      distractors.add(candidate);
    }
    if (distractors.size > 200) break; // safety
  }
  const options = shuffle([correct, ...Array.from(distractors)]);
  return { sequence, correct, options, hint };
}

export default function NumberSequenceActivity({
  moduleKey,
  childName,
  difficulty,
  adaptiveSource,
  previousLevel,
}: {
  moduleKey: ModuleKey;
  childName: string;
  difficulty: Difficulty;
  adaptiveSource?: AdaptiveSource;
  previousLevel?: Difficulty;
}) {
  const config = NUMBER_SEQUENCE_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound(config.patternKind, config.showCount, config.optionCount));
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(option: number) {
    if (phase !== 'playing' || !setup) return;
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    setPicked(option);
    const isCorrect = option === setup.correct;
    setRoundData((prev) => [
      ...prev,
      {
        setup,
        picked: option,
        isCorrect,
        timeTakenSeconds: timeTakenRef.current,
      },
    ]);
    setPhase('roundResult');
  }

  function advanceFromRoundResult() {
    if (round < TOTAL_ROUNDS) {
      setRound(round + 1);
      startRound();
    } else {
      setPhase('reflection');
    }
  }

  async function handleReflectionPick(opt: ReflectionOption) {
    setSubmitting(true);
    setError('');
    setPhase('submitting');

    try {
      const responses = await Promise.all(
        roundData.map((r) =>
          fetch('/api/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activityKey: 'number-sequence',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.isCorrect ? 100 : 0,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: {
                picked: r.picked,
                sequence: r.setup.sequence,
                patternKind: config.patternKind,
              },
              correctAnswerJson: { correct: r.setup.correct, hint: r.setup.hint },
            }),
          }),
        ),
      );

      const parsed = await Promise.all(
        responses.map(async (res, i) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed to save round ${i + 1}`);
          }
          return res.json() as Promise<{
            scores: { finalActivityScore: number };
            insight: { title: string; message: string };
          }>;
        }),
      );

      setResults(
        parsed.map((data, i) => ({
          isCorrect: roundData[i].isCorrect,
          finalScore: data.scores.finalActivityScore,
          insightTitle: data.insight.title,
          insightMessage: data.insight.message,
        })),
      );
      setPhase('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save attempts');
      setPhase('reflection');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRestart() {
    setRound(1);
    setRoundData([]);
    setResults([]);
    setPicked(null);
    setSetup(null);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;

  useCelebration({
    phase,
    lastRoundCorrect: lastRoundData?.isCorrect ?? false,
    perfectSession: results.length > 0 && results.every((r) => r.isCorrect),
  });

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.finalScore, 0) / results.length,
        )
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-sm mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* Instruction */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🔢
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Number Sequence</h1>
            <p className="text-orange-600 text-xs font-semibold mb-3">
              A Thinking game · {TOTAL_ROUNDS} rounds
            </p>
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}
            >
              {DIFFICULTY_LABEL[difficulty]} mode · {config.patternKind}
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> Look at the numbers</li>
              <li><strong className="text-gray-800">2.</strong> Figure out the pattern</li>
              <li><strong className="text-gray-800">3.</strong> Pick the next number</li>
            </ol>
            <div className="bg-orange-50 rounded-lg p-3 mb-5 text-xs text-gray-600 text-left">
              <p className="font-semibold mb-1">Example:</p>
              {config.patternKind === 'arithmetic' && (
                <>
                  <p className="font-mono">2, 4, 6, 8, ?</p>
                  <p className="text-[11px] text-gray-500">Answer: 10 (+2 each step)</p>
                </>
              )}
              {config.patternKind === 'geometric' && (
                <>
                  <p className="font-mono">2, 4, 8, 16, ?</p>
                  <p className="text-[11px] text-gray-500">Answer: 32 (×2 each step)</p>
                </>
              )}
              {config.patternKind === 'mixed' && (
                <>
                  <p className="font-mono">1, 1, 2, 3, 5, ?</p>
                  <p className="text-[11px] text-gray-500">Answer: 8 (add the previous two)</p>
                </>
              )}
            </div>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — think it through!</p>
          </div>
        )}

        {/* Playing */}
        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              What comes next?
            </p>
            <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-6">
              {setup.sequence.map((n, i) => (
                <div
                  key={i}
                  className="min-w-[2.5rem] px-2 py-2 rounded-lg bg-orange-100 text-orange-800 text-xl sm:text-2xl font-bold text-center"
                >
                  {n}
                </div>
              ))}
              <div className="min-w-[2.5rem] px-2 py-2 rounded-lg bg-gray-100 text-gray-300 text-xl sm:text-2xl font-bold text-center">
                ?
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mb-3">Pick the answer</p>
            <div className="grid grid-cols-2 gap-3">
              {setup.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePick(opt)}
                  className="rounded-xl bg-gray-50 hover:bg-orange-50 active:bg-orange-100 active:scale-95 border-2 border-gray-100 hover:border-orange-200 py-4 text-2xl font-bold text-gray-800 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
                lastRoundData.isCorrect
                  ? 'bg-green-100 text-green-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Got it!' : 'Not quite'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                The pattern
              </p>
              <div className="flex items-center justify-center flex-wrap gap-1.5 mb-2">
                {lastRoundData.setup.sequence.map((n, i) => (
                  <span key={i} className="font-mono text-base sm:text-lg text-gray-700">
                    {n}
                  </span>
                ))}
                <span className="text-gray-300">→</span>
                <span className="font-mono text-base sm:text-lg ring-2 ring-green-300 rounded-md px-1.5 text-green-700">
                  {lastRoundData.setup.correct}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 italic">{lastRoundData.setup.hint}</p>
              {!lastRoundData.isCorrect && (
                <p className="text-xs text-gray-500 mt-2">
                  You picked <strong>{lastRoundData.picked}</strong> — correct was{' '}
                  <strong>{lastRoundData.setup.correct}</strong>
                </p>
              )}
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS
                ? `Next round (${round + 1}/${TOTAL_ROUNDS})`
                : 'How did that go?'}
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Reflection */}
        {phase === 'reflection' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-base font-bold text-gray-800 text-center mb-1">
              How did the whole thing feel?
            </h2>
            <p className="text-xs text-gray-500 text-center mb-5">
              {childName}, pick the one that fits best
            </p>
            <div className="grid grid-cols-2 gap-3">
              {REFLECTION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleReflectionPick(opt)}
                    disabled={submitting}
                    className="bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl p-4 text-center transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-500 shadow-md flex items-center justify-center mb-1">
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
                    </div>
                    <div className="text-sm font-semibold text-gray-700">{opt.label}</div>
                  </button>
                );
              })}
            </div>
            {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
          </div>
        )}

        {/* Submitting */}
        {phase === 'submitting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {/* Summary */}
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
            <div className="space-y-3 mb-5 text-left">
              {results.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Round {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          r.isCorrect ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {r.isCorrect ? 'Correct' : 'Missed'}
                      </span>
                      <span className="text-xs font-bold text-orange-600">{r.finalScore}/100</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{r.insightTitle}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{r.insightMessage}</p>
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
                className="inline-flex items-center justify-center gap-1 w-full text-gray-500 hover:text-gray-700 text-xs py-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                Back to Brain
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
