'use client';

// Spot the Difference — Focus module activity.
// Two N×N grids of coloured shapes shown side-by-side. Kid taps the cell on
// the RIGHT grid that differs from the LEFT grid. Multiple differences per
// round at higher difficulty.
//
// Procedurally generated — no image assets needed.

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  SPOT_DIFFERENCE_CONFIG,
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

const TOTAL_ROUNDS = 3;

// Each cell shows one of these shape+color combos
const SHAPE_PALETTE: { shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond'; color: string }[] = [
  { shape: 'circle',   color: '#3b82f6' }, // blue
  { shape: 'square',   color: '#f97316' }, // orange
  { shape: 'triangle', color: '#10b981' }, // green
  { shape: 'star',     color: '#a855f7' }, // purple
  { shape: 'diamond',  color: '#ef4444' }, // red
  { shape: 'circle',   color: '#eab308' }, // yellow
];

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

interface CellContent {
  shape: typeof SHAPE_PALETTE[number]['shape'];
  color: string;
}

interface RoundSetup {
  left: CellContent[];          // length = gridSize * gridSize
  right: CellContent[];
  differentIndices: number[];   // which cells differ
}

interface RoundData {
  setup: RoundSetup;
  tappedIndices: number[];
  isCorrect: boolean;
  accuracyPercent: number;
  timeTakenSeconds: number;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRound(gridSize: number, differences: number): RoundSetup {
  const totalCells = gridSize * gridSize;
  // Build LEFT grid first
  const left: CellContent[] = Array.from({ length: totalCells }, () => {
    const item = randItem(SHAPE_PALETTE);
    return { shape: item.shape, color: item.color };
  });

  // Pick `differences` unique cells to modify on the right side
  const indices = Array.from({ length: totalCells }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const differentIndices = indices.slice(0, differences).sort((a, b) => a - b);

  const right: CellContent[] = left.map((c) => ({ ...c }));
  for (const idx of differentIndices) {
    // Force a real change (different shape or color)
    let next = randItem(SHAPE_PALETTE);
    let safety = 0;
    while (next.shape === left[idx].shape && next.color === left[idx].color) {
      next = randItem(SHAPE_PALETTE);
      if (++safety > 20) break;
    }
    right[idx] = { shape: next.shape, color: next.color };
  }

  return { left, right, differentIndices };
}

function Shape({ shape, color, size = 28 }: { shape: CellContent['shape']; color: string; size?: number }) {
  switch (shape) {
    case 'circle':
      return <svg width={size} height={size} viewBox="0 0 32 32"><circle cx={16} cy={16} r={12} fill={color} /></svg>;
    case 'square':
      return <svg width={size} height={size} viewBox="0 0 32 32"><rect x={6} y={6} width={20} height={20} rx={3} fill={color} /></svg>;
    case 'triangle':
      return <svg width={size} height={size} viewBox="0 0 32 32"><polygon points="16,5 28,26 4,26" fill={color} /></svg>;
    case 'star':
      return <svg width={size} height={size} viewBox="0 0 32 32"><polygon points="16,4 19.5,12.5 28.5,13 21.5,19 23.5,28 16,23 8.5,28 10.5,19 3.5,13 12.5,12.5" fill={color} /></svg>;
    case 'diamond':
      return <svg width={size} height={size} viewBox="0 0 32 32"><polygon points="16,4 28,16 16,28 4,16" fill={color} /></svg>;
  }
}

export default function SpotTheDifferenceActivity({
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
  const config = SPOT_DIFFERENCE_CONFIG[difficulty];
  const TOTAL_CELLS = config.gridSize * config.gridSize;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound(config.gridSize, config.differences));
    setTapped(new Set());
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handleCellTap(index: number) {
    if (phase !== 'playing' || !setup) return;
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSubmit() {
    if (!setup) return;
    if (tapped.size === 0) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const tappedArr = Array.from(tapped).sort((a, b) => a - b);
    const correctSet = new Set(setup.differentIndices);
    const correctTaps = tappedArr.filter((i) => correctSet.has(i)).length;
    const wrongTaps = tappedArr.length - correctTaps;
    // Accuracy = (correct - wrong) / total differences, floored at 0
    const rawAcc = ((correctTaps - wrongTaps) / setup.differentIndices.length) * 100;
    const accuracyPercent = Math.max(0, Math.round(rawAcc));
    const isCorrect = correctTaps === setup.differentIndices.length && wrongTaps === 0;
    setRoundData((prev) => [
      ...prev,
      { setup, tappedIndices: tappedArr, isCorrect, accuracyPercent, timeTakenSeconds: timeTaken },
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
              activityKey: 'spot-the-difference',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.accuracyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { tapped: r.tappedIndices, gridSize: config.gridSize },
              correctAnswerJson: { differences: r.setup.differentIndices },
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
    setTapped(new Set());
    setSetup(null);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length)
      : 0;

  function GridDisplay({
    cells,
    interactive,
    onTap,
    highlight,
  }: {
    cells: CellContent[];
    interactive?: boolean;
    onTap?: (i: number) => void;
    highlight?: { correct?: Set<number>; tapped?: Set<number> };
  }) {
    const cellSize = config.gridSize <= 3 ? 'w-12 h-12' : config.gridSize === 4 ? 'w-10 h-10' : 'w-8 h-8';
    const shapeSize = config.gridSize <= 3 ? 28 : config.gridSize === 4 ? 22 : 18;
    return (
      <div
        className="grid gap-1.5 p-2 bg-gray-50 rounded-xl"
        style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, i) => {
          const isCorrectDiff = highlight?.correct?.has(i);
          const wasTapped = highlight?.tapped?.has(i);
          let cellBg = 'bg-white';
          if (isCorrectDiff && wasTapped) cellBg = 'bg-green-200 ring-2 ring-green-500';
          else if (isCorrectDiff) cellBg = 'bg-amber-100 ring-2 ring-amber-400';
          else if (wasTapped) cellBg = 'bg-red-100 ring-2 ring-red-400';
          const tappedActive = interactive && tapped.has(i);
          if (tappedActive) cellBg = 'bg-green-100 ring-2 ring-green-500';
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onTap?.(i)}
              className={`${cellSize} ${cellBg} rounded-md flex items-center justify-center transition-all ${interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              aria-label={`Cell ${i + 1}`}
            >
              <Shape shape={cell.shape} color={cell.color} size={shapeSize} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-green-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* Instruction */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🔍
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Spot the Difference</h1>
            <p className="text-green-600 text-xs font-semibold mb-3">
              A Focus game · {TOTAL_ROUNDS} rounds
            </p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.gridSize}×{config.gridSize} · find {config.differences}
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li><strong className="text-gray-800">1.</strong> Two grids of shapes appear — left and right</li>
              <li><strong className="text-gray-800">2.</strong> Find the {config.differences === 1 ? 'cell' : `${config.differences} cells`} that differ on the right</li>
              <li><strong className="text-gray-800">3.</strong> Tap them and submit</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — look closely!</p>
          </div>
        )}

        {/* Playing */}
        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <p className="text-center text-sm font-semibold text-gray-600 mb-3">
              Tap the {config.differences === 1 ? 'cell' : `${config.differences} cells`} on the right that differ
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-1">Left</p>
                <GridDisplay cells={setup.left} />
              </div>
              <div>
                <p className="text-[10px] text-green-600 uppercase tracking-wider text-center mb-1 font-semibold">Right · tap here</p>
                <GridDisplay cells={setup.right} interactive onTap={handleCellTap} />
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mb-3">
              {tapped.size} of {config.differences} selected
            </p>
            <button
              onClick={handleSubmit}
              disabled={tapped.size === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Got them all!' : 'Some missed'}
            </h2>
            <div className="mb-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Right grid · differences highlighted</p>
              <div className="flex justify-center">
                <GridDisplay
                  cells={lastRoundData.setup.right}
                  highlight={{
                    correct: new Set(lastRoundData.setup.differentIndices),
                    tapped: new Set(lastRoundData.tappedIndices),
                  }}
                />
              </div>
            </div>
            <div className="flex justify-center gap-3 text-[10px] text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded" /> Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-amber-300 rounded" /> Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-300 rounded" /> Wrong
              </span>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS})` : 'How did that go?'}
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Reflection */}
        {phase === 'reflection' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-base font-bold text-gray-800 text-center mb-1">How did the whole thing feel?</h2>
            <p className="text-xs text-gray-500 text-center mb-5">{childName}, pick the one that fits best</p>
            <div className="grid grid-cols-2 gap-3">
              {REFLECTION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleReflectionPick(opt)}
                    disabled={submitting}
                    className="bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl p-4 text-center transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
                  >
                    <Icon className="w-6 h-6 text-green-600" strokeWidth={2} />
                    <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
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
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {/* Summary */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} got {correctCount} out of {TOTAL_ROUNDS} correct</p>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-green-700">{avgScore}</p>
              <p className="text-[10px] text-gray-400">out of 100</p>
            </div>
            <div className="space-y-3 mb-5 text-left">
              {results.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Round {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${r.isCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                        {r.isCorrect ? 'Correct' : 'Missed'}
                      </span>
                      <span className="text-xs font-bold text-green-600">{r.finalScore}/100</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{r.insightTitle}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{r.insightMessage}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button onClick={handleRestart} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Play again</button>
              <button onClick={() => router.push(`/brain/${moduleKey}`)} className="w-full text-green-600 hover:bg-green-50 font-semibold py-2 rounded-xl text-sm transition-colors">Back to Focus module</button>
              <button onClick={() => router.push('/brain')} className="inline-flex items-center justify-center gap-1 w-full text-gray-500 hover:text-gray-700 text-xs py-1 transition-colors">
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
