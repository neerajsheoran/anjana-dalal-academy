'use client';

// Pattern Logic — Thinking module MVP activity.
// Mechanic: show an A-B-A-B-? alternating colour sequence; kid picks the
// correct continuation from 3 multiple-choice options.
// Reuses the same scoring/insight/persistence pipeline as the other activities.

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Sun,
  Sparkles,
  Crown,
  Flame,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  PATTERN_LOGIC_CONFIG,
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

// 6 distinct color-icon pairs. The pattern is still color-based (each item
// has a stable color identity), and the paired icon adds a redundant visual
// cue — clearer than plain colored circles AND a quiet accessibility win
// for color-blind kids (shape works as backup).
const COLOR_KEYS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

const COLOR_META: Record<ColorKey, { icon: LucideIcon; hex: string }> = {
  red:    { icon: Heart,    hex: '#ef4444' },
  blue:   { icon: Star,     hex: '#3b82f6' },
  yellow: { icon: Sun,      hex: '#eab308' },
  green:  { icon: Sparkles, hex: '#10b981' },
  purple: { icon: Crown,    hex: '#a855f7' },
  orange: { icon: Flame,    hex: '#f97316' },
};

// Renders a color-item with its Lucide icon at the given size. Used in both
// the playing sequence and the multiple-choice options.
function ColorItem({
  ckey,
  size = 'md',
}: {
  ckey: ColorKey;
  size?: 'sm' | 'md' | 'lg';
}) {
  const meta = COLOR_META[ckey];
  const Icon = meta.icon;
  const cls =
    size === 'lg'
      ? 'w-10 h-10 sm:w-14 sm:h-14'
      : size === 'sm'
        ? 'w-6 h-6 sm:w-8 sm:h-8'
        : 'w-8 h-8 sm:w-10 sm:h-10';
  return (
    <Icon
      className={cls}
      style={{ color: meta.hex, fill: meta.hex }}
      strokeWidth={1.5}
    />
  );
}

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

interface RoundData {
  setup: RoundSetup;
  picked: ColorKey;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

interface RoundSetup {
  sequence: ColorKey[];   // sequence length items, e.g. [A, B, A, B]
  correct: ColorKey;      // the continuation (A)
  options: ColorKey[];    // 3-4 MC options, shuffled (includes correct + distractors)
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Build a round per difficulty. Pattern shapes:
//   ABAB    → 4 long, next is A (length-even ⇒ continues with A)
//   AABAAB  → 6 long with 3-step (A,A,B) repeating, next is A
//   ABCABC  → 6 long with 3-colour cycle, next is A
function generateRound(
  patternKind: "ABAB" | "AABAAB" | "ABCABC",
  sequenceLength: number,
  optionCount: number,
): RoundSetup {
  // Pick enough distinct colours to build the pattern + at least 1 distractor
  const colorsNeeded =
    patternKind === "ABCABC" ? 3 : 2; // ABCABC uses 3, ABAB/AABAAB uses 2
  const distractorCount = Math.max(1, optionCount - colorsNeeded);
  const picks = pickN(COLOR_KEYS, colorsNeeded + distractorCount);
  const a = picks[0];
  const b = picks[1];
  const c = colorsNeeded === 3 ? picks[2] : null;
  const distractors = picks.slice(colorsNeeded);

  const sequence: ColorKey[] = [];
  let correct: ColorKey = a;
  if (patternKind === "ABAB") {
    for (let i = 0; i < sequenceLength; i++) sequence.push(i % 2 === 0 ? a : b);
    // Even length ⇒ next is A
    correct = sequenceLength % 2 === 0 ? a : b;
  } else if (patternKind === "AABAAB") {
    // Repeating triplet [A, A, B]
    const triplet = [a, a, b];
    for (let i = 0; i < sequenceLength; i++) sequence.push(triplet[i % 3]);
    correct = triplet[sequenceLength % 3];
  } else {
    // ABCABC — repeating triplet [A, B, C]
    const triplet = [a, b, c!];
    for (let i = 0; i < sequenceLength; i++) sequence.push(triplet[i % 3]);
    correct = triplet[sequenceLength % 3];
  }

  // Build option set: correct + remaining colours used + distractors,
  // shuffled, deduped, trimmed to optionCount.
  const optionSeed: ColorKey[] = [
    correct,
    ...(patternKind === "ABCABC" ? [a, b, c!] : [a, b]),
    ...distractors,
  ];
  const unique: ColorKey[] = [];
  for (const item of optionSeed) {
    if (!unique.includes(item)) unique.push(item);
  }
  // Top up from COLOR_KEYS if we somehow don't have enough
  for (const colour of COLOR_KEYS) {
    if (unique.length >= optionCount) break;
    if (!unique.includes(colour)) unique.push(colour);
  }
  const options = pickN(unique.slice(0, optionCount), optionCount);
  return { sequence, correct, options };
}

export default function PatternLogicActivity({
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
  const config = PATTERN_LOGIC_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [picked, setPicked] = useState<ColorKey | null>(null);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound(config.patternKind, config.sequenceLength, config.optionCount));
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(option: ColorKey) {
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
              activityKey: 'pattern-logic',
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
              correctAnswerJson: { correct: r.setup.correct },
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

        {/* Top bar: round counter + exit */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/brain/${moduleKey}`}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
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

        {/* ── Phase: Instruction ─────────────────────────────────────── */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              💡
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Pattern Logic</h1>
            <p className="text-orange-600 text-xs font-semibold mb-3">
              A Thinking game · {TOTAL_ROUNDS} rounds
            </p>
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}
            >
              {DIFFICULTY_LABEL[difficulty]} mode · {config.patternKind} pattern
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
              <p className="font-semibold mb-2">Example:</p>
              {config.patternKind === 'ABAB' && (
                <>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" strokeWidth={2} />
                  </div>
                  <p className="text-[11px] text-gray-500 inline-flex items-center gap-1 justify-center w-full">
                    Answer: <ColorItem ckey="red" size="sm" />
                  </p>
                </>
              )}
              {config.patternKind === 'AABAAB' && (
                <>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5 flex-wrap">
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" strokeWidth={2} />
                  </div>
                  <p className="text-[11px] text-gray-500 inline-flex items-center gap-1 justify-center w-full">
                    Answer: <ColorItem ckey="red" size="sm" /> <span>(the triplet repeats)</span>
                  </p>
                </>
              )}
              {config.patternKind === 'ABCABC' && (
                <>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5 flex-wrap">
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <ColorItem ckey="yellow" size="sm" />
                    <ColorItem ckey="red" size="sm" />
                    <ColorItem ckey="blue" size="sm" />
                    <ColorItem ckey="yellow" size="sm" />
                    <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" strokeWidth={2} />
                  </div>
                  <p className="text-[11px] text-gray-500 inline-flex items-center gap-1 justify-center w-full">
                    Answer: <ColorItem ckey="red" size="sm" /> <span>(3-colour cycle)</span>
                  </p>
                </>
              )}
            </div>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
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
            {/* Sequence — wraps if long */}
            <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-6">
              {setup.sequence.map((c, i) => (
                <ColorItem key={i} ckey={c} size="lg" />
              ))}
              <HelpCircle className="w-10 h-10 sm:w-14 sm:h-14 text-orange-400" strokeWidth={2} />
            </div>
            {/* Multiple choice */}
            <p className="text-center text-xs text-gray-400 mb-3">
              Pick one
            </p>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(config.optionCount, 4)}, minmax(0, 1fr))` }}
            >
              {setup.options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  type="button"
                  onClick={() => handlePick(opt)}
                  className="aspect-square rounded-xl bg-gray-50 hover:bg-orange-50 active:bg-orange-100 hover:scale-105 active:scale-95 border-2 border-gray-100 hover:border-orange-300 flex items-center justify-center transition-all"
                  aria-label={`Option ${i + 1}`}
                >
                  <ColorItem ckey={opt} size="lg" />
                </button>
              ))}
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

            {/* Reveal: show sequence + correct vs picked */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                The pattern
              </p>
              <div className="flex items-center justify-center flex-wrap gap-1.5 mb-3">
                {lastRoundData.setup.sequence.map((c, i) => (
                  <ColorItem key={i} ckey={c} size="md" />
                ))}
                <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
                <span className="inline-flex p-1 rounded-xl ring-4 ring-green-300">
                  <ColorItem ckey={lastRoundData.setup.correct} size="md" />
                </span>
              </div>
              {!lastRoundData.isCorrect && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span>You picked</span>
                  <ColorItem ckey={lastRoundData.picked} size="sm" />
                  <span>— correct was</span>
                  <ColorItem ckey={lastRoundData.setup.correct} size="sm" />
                </div>
              )}
            </div>

            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS
                ? `Next round (${round + 1}/${TOTAL_ROUNDS})`
                : 'How did that go?'}
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
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

        {/* ── Phase: Submitting ───────────────────────────────────────── */}
        {phase === 'submitting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
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
                      <span className="text-xs font-bold text-orange-600">
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
