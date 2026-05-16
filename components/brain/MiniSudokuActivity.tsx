'use client';

// Mini Sudoku 4×4 — Thinking module activity (age 8+).
// 4×4 grid with numbers 1–4. Each row, column, and 2×2 box must contain
// each digit exactly once. Some cells are pre-filled (givens); the kid
// taps an empty cell and picks a digit from 1–4.
//
// Tests constraint reasoning — a distinct cognitive skill from pattern
// continuation (Pattern Logic / Number Sequence) or categorization
// (Odd One Out).

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  MINI_SUDOKU_CONFIG,
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
const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// A bank of valid 4×4 Sudoku solutions. Each row/column/2×2 box has
// 1, 2, 3, 4 exactly once. We pick one per round and mask N cells based on
// difficulty. 30 solutions = plenty of variety across a session (kids see
// 3 puzzles per session, so duplicates within a sitting are extremely rare).
const SOLUTIONS: number[][] = [
  [1, 2, 3, 4,  3, 4, 1, 2,  2, 1, 4, 3,  4, 3, 2, 1],
  [1, 2, 3, 4,  3, 4, 1, 2,  4, 3, 2, 1,  2, 1, 4, 3],
  [1, 2, 3, 4,  3, 4, 1, 2,  2, 3, 4, 1,  4, 1, 2, 3],
  [1, 2, 3, 4,  3, 4, 1, 2,  4, 1, 2, 3,  2, 3, 4, 1],
  [1, 2, 3, 4,  3, 4, 2, 1,  2, 1, 4, 3,  4, 3, 1, 2],
  [1, 2, 3, 4,  3, 4, 2, 1,  4, 3, 1, 2,  2, 1, 4, 3],
  [1, 2, 3, 4,  4, 3, 1, 2,  2, 1, 4, 3,  3, 4, 2, 1],
  [1, 2, 3, 4,  4, 3, 1, 2,  3, 4, 2, 1,  2, 1, 4, 3],
  [1, 2, 3, 4,  4, 3, 2, 1,  2, 1, 4, 3,  3, 4, 1, 2],
  [1, 2, 3, 4,  4, 3, 2, 1,  2, 4, 1, 3,  3, 1, 4, 2],
  [1, 2, 3, 4,  4, 3, 2, 1,  3, 1, 4, 2,  2, 4, 1, 3],
  [1, 2, 3, 4,  4, 3, 2, 1,  3, 4, 1, 2,  2, 1, 4, 3],
  [1, 3, 2, 4,  2, 4, 1, 3,  3, 1, 4, 2,  4, 2, 3, 1],
  [1, 3, 2, 4,  2, 4, 1, 3,  4, 2, 3, 1,  3, 1, 4, 2],
  [1, 3, 2, 4,  2, 4, 3, 1,  3, 1, 4, 2,  4, 2, 1, 3],
  [1, 3, 2, 4,  4, 2, 1, 3,  3, 1, 4, 2,  2, 4, 3, 1],
  [1, 4, 2, 3,  2, 3, 1, 4,  3, 1, 4, 2,  4, 2, 3, 1],
  [2, 1, 4, 3,  3, 4, 1, 2,  1, 2, 3, 4,  4, 3, 2, 1],
  [2, 1, 4, 3,  4, 3, 2, 1,  1, 2, 3, 4,  3, 4, 1, 2],
  [2, 1, 4, 3,  4, 3, 2, 1,  3, 4, 1, 2,  1, 2, 3, 4],
  [2, 1, 4, 3,  4, 3, 2, 1,  1, 4, 3, 2,  3, 2, 1, 4],
  [2, 1, 4, 3,  4, 3, 2, 1,  3, 2, 1, 4,  1, 4, 3, 2],
  [2, 3, 4, 1,  4, 1, 2, 3,  1, 4, 3, 2,  3, 2, 1, 4],
  [3, 4, 1, 2,  1, 2, 3, 4,  4, 3, 2, 1,  2, 1, 4, 3],
  [3, 4, 1, 2,  1, 2, 3, 4,  2, 1, 4, 3,  4, 3, 2, 1],
  [3, 4, 2, 1,  1, 2, 3, 4,  4, 3, 1, 2,  2, 1, 4, 3],
  [4, 1, 2, 3,  2, 3, 4, 1,  3, 4, 1, 2,  1, 2, 3, 4],
  [4, 3, 2, 1,  2, 1, 4, 3,  3, 4, 1, 2,  1, 2, 3, 4],
  [4, 3, 2, 1,  2, 1, 4, 3,  1, 2, 3, 4,  3, 4, 1, 2],
  [4, 3, 2, 1,  1, 2, 3, 4,  2, 1, 4, 3,  3, 4, 1, 2],
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

interface RoundSetup {
  solution: number[];     // length 16
  givens: number[];       // length 16; 0 = empty (kid fills), >0 = given
  emptyIndices: number[]; // which cells are empty
}

interface RoundData {
  setup: RoundSetup;
  entered: number[];      // length 16
  isCorrect: boolean;
  accuracyPercent: number;
  timeTakenSeconds: number;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function generateRound(cellsToFill: number, exclude: Set<number>): { setup: RoundSetup; solIndex: number } {
  // Pick a solution we haven't used in this session
  let solIndex = Math.floor(Math.random() * SOLUTIONS.length);
  let safety = 0;
  while (exclude.has(solIndex) && ++safety < 50) {
    solIndex = Math.floor(Math.random() * SOLUTIONS.length);
  }
  const solution = SOLUTIONS[solIndex];

  // Pick random cells to mask
  const allIndices = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  const emptyIndices = pickN(allIndices, cellsToFill).sort((a, b) => a - b);
  const givens = solution.map((v, i) => (emptyIndices.includes(i) ? 0 : v));
  return { setup: { solution, givens, emptyIndices }, solIndex };
}

export default function MiniSudokuActivity({
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
  const config = MINI_SUDOKU_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [entered, setEntered] = useState<number[]>([]);    // current grid state
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [usedSolutionIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  function startRound() {
    const { setup: newSetup, solIndex } = generateRound(config.cellsToFill, usedSolutionIndices);
    usedSolutionIndices.add(solIndex);
    setSetup(newSetup);
    setEntered([...newSetup.givens]);
    setSelectedCell(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handleCellSelect(index: number) {
    if (phase !== 'playing' || !setup) return;
    // Only empty (kid-fillable) cells are selectable
    if (!setup.emptyIndices.includes(index)) return;
    setSelectedCell(index);
  }

  function handleDigitTap(digit: number) {
    if (phase !== 'playing' || selectedCell === null) return;
    setEntered((prev) => {
      const next = [...prev];
      next[selectedCell] = digit;
      return next;
    });
  }

  function handleClear() {
    if (phase !== 'playing' || selectedCell === null) return;
    setEntered((prev) => {
      const next = [...prev];
      next[selectedCell] = 0;
      return next;
    });
  }

  function handleSubmit() {
    if (!setup) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    // Compare entered to solution
    const matches = entered.filter((v, i) => v === setup.solution[i]).length;
    const accuracyPercent = Math.round((matches / TOTAL_CELLS) * 100);
    const isCorrect = matches === TOTAL_CELLS;
    setRoundData((prev) => [
      ...prev,
      { setup, entered: [...entered], isCorrect, accuracyPercent, timeTakenSeconds: timeTaken },
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
              activityKey: 'mini-sudoku',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.accuracyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { entered: r.entered, cellsToFill: config.cellsToFill },
              correctAnswerJson: { solution: r.setup.solution },
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
    setEntered([]);
    setSetup(null);
    setSelectedCell(null);
    usedSolutionIndices.clear();
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) : 0;
  const filledCount = entered.filter((v) => v > 0).length;
  const allFilled = filledCount === TOTAL_CELLS;

  useCelebration({
    phase,
    lastRoundCorrect: lastRoundData?.isCorrect ?? false,
    perfectSession: results.length > 0 && results.every((r) => r.isCorrect),
  });

  // Renders the 4×4 grid. Heavy borders separate the four 2×2 boxes.
  function SudokuGrid({
    cells,
    givens,
    selectedIndex,
    onSelect,
    overlay, // when in roundResult, color cells correct/wrong
  }: {
    cells: number[];
    givens: number[];
    selectedIndex: number | null;
    onSelect?: (i: number) => void;
    overlay?: number[];  // solution; cells matching => green, wrong => red
  }) {
    return (
      <div
        className="grid gap-0 mx-auto rounded-xl overflow-hidden ring-2 ring-orange-300"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          maxWidth: '280px',
        }}
      >
        {cells.map((v, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isGiven = givens[i] > 0;
          const isSelected = selectedIndex === i;
          // Thick borders between 2×2 boxes
          const borderRight = col === 1 ? 'border-r-2 border-r-orange-400' : col < 3 ? 'border-r border-r-gray-200' : '';
          const borderBottom = row === 1 ? 'border-b-2 border-b-orange-400' : row < 3 ? 'border-b border-b-gray-200' : '';

          let bg = isGiven ? 'bg-orange-50' : 'bg-white';
          let textColor = isGiven ? 'text-orange-800 font-bold' : 'text-orange-600 font-semibold';
          if (overlay) {
            if (cells[i] === overlay[i] && cells[i] > 0) {
              if (!isGiven) bg = 'bg-green-100';
            } else if (cells[i] > 0 && cells[i] !== overlay[i]) {
              bg = 'bg-red-100';
              textColor = 'text-red-700 font-bold';
            } else if (cells[i] === 0) {
              bg = 'bg-amber-100';
              textColor = 'text-amber-700';
            }
          } else if (isSelected) {
            bg = 'bg-orange-200 ring-2 ring-orange-500';
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect?.(i)}
              disabled={isGiven || !!overlay}
              className={`aspect-square ${bg} ${textColor} ${borderRight} ${borderBottom} flex items-center justify-center text-xl sm:text-2xl transition-colors ${!isGiven && !overlay ? 'cursor-pointer hover:bg-orange-100' : 'cursor-default'}`}
              aria-label={`Row ${row + 1}, column ${col + 1}`}
            >
              {v > 0 ? v : overlay && cells[i] === 0 ? overlay[i] : ''}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🧩
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Mini Sudoku</h1>
            <p className="text-orange-600 text-xs font-semibold mb-3">A Thinking game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.cellsToFill} empty cells
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> Fill empty cells with 1, 2, 3, or 4</li>
              <li><strong className="text-gray-800">2.</strong> Each <strong>row</strong> needs 1, 2, 3, 4 (no repeats)</li>
              <li><strong className="text-gray-800">3.</strong> Each <strong>column</strong> needs 1, 2, 3, 4</li>
              <li><strong className="text-gray-800">4.</strong> Each <strong>2×2 box</strong> needs 1, 2, 3, 4</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — use logic, not guesswork!</p>
          </div>
        )}

        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Fill each row, column, and 2×2 box with 1–4
            </p>
            <SudokuGrid
              cells={entered}
              givens={setup.givens}
              selectedIndex={selectedCell}
              onSelect={handleCellSelect}
            />
            <p className="text-center text-xs text-gray-500 mt-3 mb-3">
              {filledCount} / {TOTAL_CELLS} cells filled
              {selectedCell !== null && <span className="block text-orange-600 mt-0.5">Pick a digit for the highlighted cell</span>}
            </p>
            {/* Digit picker */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitTap(d)}
                  disabled={selectedCell === null}
                  className="aspect-square rounded-xl bg-orange-100 hover:bg-orange-200 active:bg-orange-300 active:scale-95 text-2xl font-bold text-orange-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={selectedCell === null}
                className="aspect-square rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-bold text-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Clear cell"
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allFilled ? 'Submit' : `Fill ${TOTAL_CELLS - filledCount} more cell${TOTAL_CELLS - filledCount === 1 ? '' : 's'}`}
            </button>
          </div>
        )}

        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Solved it!' : 'Close — see the answer'}
            </h2>
            <div className="mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Solution overlay</p>
              <SudokuGrid
                cells={lastRoundData.entered}
                givens={lastRoundData.setup.givens}
                selectedIndex={null}
                overlay={lastRoundData.setup.solution}
              />
              <div className="flex justify-center gap-3 text-[10px] text-gray-500 mt-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded" /> Correct
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-red-300 rounded" /> Wrong
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-amber-300 rounded" /> Missed
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {lastRoundData.accuracyPercent}% of cells correct
              </p>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS})` : 'How did that go?'}
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        )}

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

        {phase === 'submitting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} solved {correctCount} of {TOTAL_ROUNDS}</p>
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
                      <span className={`text-xs font-semibold ${r.isCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                        {r.isCorrect ? 'Solved' : 'Partial'}
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
              <button onClick={handleRestart} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Play again</button>
              <button onClick={() => router.push(`/brain/${moduleKey}`)} className="w-full text-orange-600 hover:bg-orange-50 font-semibold py-2 rounded-xl text-sm transition-colors">Back to Thinking module</button>
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
