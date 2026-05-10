'use client';

// Find the Object — Focus module MVP activity.
// Mechanic: show a 3×3 grid of animal emojis, kid taps the target one.
// First tap ends the round (no submit button) — accuracy + time scored.
// Reuses the same scoring/insight/persistence pipeline as PatternRecallActivity.

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  FIND_OBJECT_CONFIG,
  ANIMAL_POOL_LARGE,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';

const TOTAL_ROUNDS = 3;

type Phase =
  | 'instruction'
  | 'playing'
  | 'roundResult'
  | 'reflection'
  | 'submitting'
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

interface RoundData {
  setup: RoundSetup;
  tappedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

// Pick `count` distinct animals from the pool
function pickAnimals(count: number): string[] {
  const shuffled = [...ANIMAL_POOL_LARGE];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

interface RoundSetup {
  cells: string[];      // distinct animal emojis (length = totalCells)
  target: string;       // one of cells[]
  targetIndex: number;  // index in cells[] for verification
}

function generateRound(totalCells: number): RoundSetup {
  const cells = pickAnimals(totalCells);
  const targetIndex = Math.floor(Math.random() * totalCells);
  return { cells, target: cells[targetIndex], targetIndex };
}

export default function FindTheObjectActivity({
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
  const config = FIND_OBJECT_CONFIG[difficulty];
  const TOTAL_CELLS = config.gridSize * config.gridSize;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound(TOTAL_CELLS));
    setTappedIndex(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handleCellTap(index: number) {
    if (phase !== 'playing' || !setup) return;
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    setTappedIndex(index);
    const isCorrect = index === setup.targetIndex;
    setRoundData((prev) => [
      ...prev,
      {
        setup,
        tappedIndex: index,
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
              activityKey: 'find-the-object',
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
                tappedIndex: r.tappedIndex,
                tappedEmoji: r.setup.cells[r.tappedIndex],
                gridSize: config.gridSize,
              },
              correctAnswerJson: {
                targetIndex: r.setup.targetIndex,
                targetEmoji: r.setup.target,
              },
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
    setTappedIndex(null);
    setSetup(null);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
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
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
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
            <p className="text-green-600 text-xs font-semibold mb-3">
              A Focus game · {TOTAL_ROUNDS} rounds
            </p>
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}
            >
              {DIFFICULTY_LABEL[difficulty]} mode · {config.gridSize}×{config.gridSize} grid
            </span>
            {adaptiveSource && (
              <AdaptiveBanner
                source={adaptiveSource}
                current={difficulty}
                previous={previousLevel}
              />
            )}
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
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
            >
              {setup.cells.map((emoji, i) => {
                // Scale emoji size down as grid grows so they still fit
                const emojiSize =
                  config.gridSize <= 3 ? 'text-4xl' : config.gridSize === 4 ? 'text-3xl' : 'text-2xl';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCellTap(i)}
                    className={`aspect-square rounded-lg bg-gray-50 hover:bg-green-50 active:bg-green-100 active:scale-95 border-2 border-gray-100 hover:border-green-200 flex items-center justify-center transition-all ${emojiSize}`}
                    aria-label={`Cell ${i + 1}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Phase: Round result (between-round feedback) ─────────────── */}
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

            {/* Reveal target vs your tap */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  Target
                </p>
                <div className="w-16 h-16 rounded-xl bg-green-100 border-2 border-green-300 flex items-center justify-center text-3xl">
                  {lastRoundData.setup.target}
                </div>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  You tapped
                </p>
                <div
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl ${
                    lastRoundData.isCorrect
                      ? 'bg-green-100 border-green-300'
                      : 'bg-red-100 border-red-300'
                  }`}
                >
                  {lastRoundData.setup.cells[lastRoundData.tappedIndex]}
                </div>
              </div>
            </div>

            <button
              onClick={advanceFromRoundResult}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS
                ? `Next round (${round + 1}/${TOTAL_ROUNDS}) →`
                : 'How did that go? →'}
            </button>
          </div>
        )}

        {/* ── Phase: Reflection (single picker after round 3) ──────────── */}
        {phase === 'reflection' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-base font-bold text-gray-800 text-center mb-1">
              How did the whole thing feel?
            </h2>
            <p className="text-xs text-gray-500 text-center mb-5">
              {childName}, pick the one that fits best
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
          </div>
        )}

        {/* ── Phase: Submitting ───────────────────────────────────────── */}
        {phase === 'submitting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
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

            <div className="space-y-3 mb-5 text-left">
              {results.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">
                      Round {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          r.isCorrect ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {r.isCorrect ? 'Correct' : 'Missed'}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        {r.finalScore}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {r.insightTitle}
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    {r.insightMessage}
                  </p>
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
