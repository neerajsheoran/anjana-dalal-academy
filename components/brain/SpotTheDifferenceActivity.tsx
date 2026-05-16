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
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Smile,
  Sun,
  Moon,
  Cloud,
  Flower2,
  Leaf,
  Snowflake,
  Crown,
  Bell,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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
import { useCelebration } from '@/lib/use-celebration';

const TOTAL_ROUNDS = 3;

// 12 universally-recognizable Lucide icons. Kid-friendly + varied silhouettes
// so the grid never feels repetitive. Mix of natural / celebratory / playful.
const ICON_POOL: LucideIcon[] = [
  Star,
  Heart,
  Smile,
  Sun,
  Moon,
  Cloud,
  Flower2,
  Leaf,
  Snowflake,
  Crown,
  Bell,
  Sparkles,
];

// 6 distinct colors. Pillar identity stays out of these — purely the
// kid's "spot the change" palette.
const COLOR_POOL = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#eab308', // yellow
  '#a855f7', // purple
  '#f97316', // orange
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
  icon: LucideIcon;
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

// Difficulty-tuned difference generation:
//   easy   → diff cell has DIFFERENT icon AND DIFFERENT color (very obvious)
//   medium → 50% chance icon-only, 50% chance color-only (one dimension changes)
//   hard   → 70% chance icon-only with SAME color (very tricky — eyes naturally
//            group by color, so spotting an icon swap inside the same hue is
//            genuinely hard); 30% color-only fallback
function pickDifferentCell(
  original: CellContent,
  difficulty: Difficulty,
): CellContent {
  let mutateIcon: boolean;
  let mutateColor: boolean;
  if (difficulty === 'easy') {
    mutateIcon = true;
    mutateColor = true;
  } else if (difficulty === 'medium') {
    const coin = Math.random() < 0.5;
    mutateIcon = coin;
    mutateColor = !coin;
  } else {
    // hard: prefer icon-only change (same color) — much harder to spot
    const r = Math.random();
    if (r < 0.7) {
      mutateIcon = true;
      mutateColor = false;
    } else {
      mutateIcon = false;
      mutateColor = true;
    }
  }

  let newIcon = original.icon;
  let newColor = original.color;
  if (mutateIcon) {
    let candidate = randItem(ICON_POOL);
    let safety = 0;
    while (candidate === original.icon && ++safety < 20) candidate = randItem(ICON_POOL);
    newIcon = candidate;
  }
  if (mutateColor) {
    let candidate = randItem(COLOR_POOL);
    let safety = 0;
    while (candidate === original.color && ++safety < 20) candidate = randItem(COLOR_POOL);
    newColor = candidate;
  }
  return { icon: newIcon, color: newColor };
}

function generateRound(
  gridSize: number,
  differences: number,
  difficulty: Difficulty,
): RoundSetup {
  const totalCells = gridSize * gridSize;
  // Build LEFT grid first — random icon + color per cell
  const left: CellContent[] = Array.from({ length: totalCells }, () => ({
    icon: randItem(ICON_POOL),
    color: randItem(COLOR_POOL),
  }));

  // Pick `differences` unique cells to modify on the right side
  const indices = Array.from({ length: totalCells }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const differentIndices = indices.slice(0, differences).sort((a, b) => a - b);

  const right: CellContent[] = left.map((c) => ({ ...c }));
  for (const idx of differentIndices) {
    right[idx] = pickDifferentCell(left[idx], difficulty);
  }

  return { left, right, differentIndices };
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
    setSetup(generateRound(config.gridSize, config.differences, difficulty));
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

  // Confetti on successful round + on perfect-3 summary
  useCelebration({
    phase,
    lastRoundCorrect: lastRoundData?.isCorrect ?? false,
    perfectSession: results.length > 0 && results.every((r) => r.isCorrect),
  });

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
    // Responsive sizes — bigger on tablets/desktops, comfortably tappable on
    // mobile. Lucide icons scale crisply at all sizes.
    const cellClass =
      config.gridSize <= 3
        ? 'w-16 h-16 sm:w-20 sm:h-20'
        : config.gridSize === 4
          ? 'w-12 h-12 sm:w-16 sm:h-16'
          : 'w-10 h-10 sm:w-12 sm:h-12';
    const iconClass =
      config.gridSize <= 3
        ? 'w-9 h-9 sm:w-11 sm:h-11'
        : config.gridSize === 4
          ? 'w-7 h-7 sm:w-9 sm:h-9'
          : 'w-5 h-5 sm:w-7 sm:h-7';

    return (
      <div
        className="grid gap-1.5 p-2 bg-gray-50 rounded-xl"
        style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, i) => {
          const Icon = cell.icon;
          const isCorrectDiff = highlight?.correct?.has(i);
          const wasTapped = highlight?.tapped?.has(i);
          let cellBg = 'bg-white';
          if (isCorrectDiff && wasTapped) cellBg = 'bg-green-200 ring-2 ring-green-500';
          else if (isCorrectDiff) cellBg = 'bg-amber-100 ring-2 ring-amber-400';
          else if (wasTapped) cellBg = 'bg-red-100 ring-2 ring-red-400';
          const tappedActive = interactive && tapped.has(i);
          if (tappedActive) cellBg = 'bg-green-100 ring-2 ring-green-500 scale-105';
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onTap?.(i)}
              className={`${cellClass} ${cellBg} rounded-lg flex items-center justify-center transition-all ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
              aria-label={`Cell ${i + 1}`}
            >
              <Icon
                className={iconClass}
                style={{ color: cell.color }}
                strokeWidth={2}
              />
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
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
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
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
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
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
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
                    <div className="w-12 h-12 rounded-full bg-green-500 shadow-md flex items-center justify-center mb-1">
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
                <ChevronLeft className="w-3 h-3" strokeWidth={2} />
                Back to Brain
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
