'use client';

// Color Sequence / Simon Says — Memory module activity (age 5+).
// Four colored quadrants flash one at a time in a sequence. After the
// sequence ends, the kid reproduces it by tapping the quadrants in order.
// Tests sequential / temporal memory — a different mechanic from Pattern
// Recall (which is spatial position memory).

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  COLOR_SEQUENCE_CONFIG,
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

// Four classic Simon quadrants
const QUADRANTS = [
  { id: 0, name: 'red',    bg: 'bg-red-500',     dim: 'bg-red-300/50',     glow: 'shadow-[0_0_40px_rgba(239,68,68,0.9)]' },
  { id: 1, name: 'blue',   bg: 'bg-blue-500',    dim: 'bg-blue-300/50',    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.9)]' },
  { id: 2, name: 'yellow', bg: 'bg-yellow-500',  dim: 'bg-yellow-300/50',  glow: 'shadow-[0_0_40px_rgba(234,179,8,0.9)]' },
  { id: 3, name: 'green',  bg: 'bg-emerald-500', dim: 'bg-emerald-300/50', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.9)]' },
];

type Phase =
  | 'instruction'
  | 'showing'
  | 'recalling'
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
  sequence: number[];
  entered: number[];
  isCorrect: boolean;
  accuracyPercent: number;
  timeTakenSeconds: number;
}

function generateSequence(length: number): number[] {
  const out: number[] = [];
  while (out.length < length) {
    const next = Math.floor(Math.random() * QUADRANTS.length);
    // Avoid same color 3× in a row to keep it interesting
    if (out.length >= 2 && out[out.length - 1] === next && out[out.length - 2] === next) continue;
    out.push(next);
  }
  return out;
}

export default function ColorSequenceActivity({
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
  const config = COLOR_SEQUENCE_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [entered, setEntered] = useState<number[]>([]);
  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);  // which quadrant is currently lit during the show phase
  const [tapFlash, setTapFlash] = useState<number | null>(null);           // brief lit-up on tap during recall
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  // Drive the show phase: walk through the sequence, lighting each quadrant
  useEffect(() => {
    if (phase !== 'showing' || sequence.length === 0) return;
    let cancelled = false;
    let i = 0;
    function step() {
      if (cancelled) return;
      if (i >= sequence.length) {
        setFlashingIndex(null);
        startTimeRef.current = Date.now();
        setPhase('recalling');
        return;
      }
      setFlashingIndex(sequence[i]);
      setTimeout(() => {
        if (cancelled) return;
        setFlashingIndex(null);
        i++;
        setTimeout(step, config.gapMs);
      }, config.flashDurationMs);
    }
    // Brief lead-in pause so the kid is ready
    const lead = setTimeout(step, 600);
    return () => {
      cancelled = true;
      clearTimeout(lead);
    };
  }, [phase, sequence, config.flashDurationMs, config.gapMs]);

  function startRound() {
    setSequence(generateSequence(config.sequenceLength));
    setEntered([]);
    setFlashingIndex(null);
    setTapFlash(null);
    setError('');
    setPhase('showing');
  }

  function handleQuadrantTap(qIndex: number) {
    if (phase !== 'recalling') return;
    setTapFlash(qIndex);
    setTimeout(() => setTapFlash(null), 250);
    setEntered((prev) => {
      const next = [...prev, qIndex];
      if (next.length >= sequence.length) {
        // Done — judge correctness now
        const timeTaken = (Date.now() - startTimeRef.current) / 1000;
        const positionalMatches = next.filter((v, i) => v === sequence[i]).length;
        const accuracyPercent = Math.round((positionalMatches / sequence.length) * 100);
        const isCorrect = next.every((v, i) => v === sequence[i]);
        setRoundData((prevRd) => [
          ...prevRd,
          { sequence: [...sequence], entered: next, isCorrect, accuracyPercent, timeTakenSeconds: timeTaken },
        ]);
        setTimeout(() => setPhase('roundResult'), 300);
      }
      return next;
    });
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
              activityKey: 'color-sequence',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.accuracyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { entered: r.entered, sequenceLength: config.sequenceLength },
              correctAnswerJson: { sequence: r.sequence },
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
    setSequence([]);
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
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) : 0;

  // The 2×2 quadrant grid — used both in showing and recalling phases
  function QuadrantGrid({
    interactive,
    highlightIndex,
    onTap,
  }: {
    interactive: boolean;
    highlightIndex: number | null;
    onTap?: (i: number) => void;
  }) {
    return (
      <div className="grid grid-cols-2 gap-3 aspect-square w-full max-w-xs mx-auto">
        {QUADRANTS.map((q) => {
          const isLit = highlightIndex === q.id;
          return (
            <button
              key={q.id}
              type="button"
              disabled={!interactive}
              onClick={() => onTap?.(q.id)}
              className={`rounded-2xl transition-all duration-150 ${
                isLit ? `${q.bg} ${q.glow} scale-95` : q.dim
              } ${interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              aria-label={q.name}
            />
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {/* Instruction */}
        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎵
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Color Sequence</h1>
            <p className="text-purple-600 text-xs font-semibold mb-3">A Memory game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.sequenceLength} colors
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li><strong className="text-gray-800">1.</strong> Four colors light up one at a time</li>
              <li><strong className="text-gray-800">2.</strong> Remember the order</li>
              <li><strong className="text-gray-800">3.</strong> Tap them back in the same order</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — watch the order carefully!</p>
          </div>
        )}

        {/* Showing */}
        {phase === 'showing' && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Watch the order…
            </p>
            <QuadrantGrid interactive={false} highlightIndex={flashingIndex} />
          </div>
        )}

        {/* Recalling */}
        {phase === 'recalling' && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-2">
              Tap them in the same order
            </p>
            <p className="text-center text-xs text-gray-400 mb-3">
              {entered.length} of {config.sequenceLength}
            </p>
            <QuadrantGrid interactive highlightIndex={tapFlash} onTap={handleQuadrantTap} />
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Perfect!' : 'Not quite'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Correct order</p>
                <div className="flex items-center justify-center gap-1.5">
                  {lastRoundData.sequence.map((q, i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-lg ${QUADRANTS[q].bg}`}
                      title={QUADRANTS[q].name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Your order</p>
                <div className="flex items-center justify-center gap-1.5">
                  {lastRoundData.sequence.map((_, i) => {
                    const v = lastRoundData.entered[i];
                    if (v === undefined) return <span key={i} className="w-7 h-7 rounded-lg bg-gray-200" />;
                    const ok = v === lastRoundData.sequence[i];
                    return (
                      <span
                        key={i}
                        className={`w-7 h-7 rounded-lg ${QUADRANTS[v].bg} ${ok ? 'ring-2 ring-green-400' : 'ring-2 ring-red-400'}`}
                        title={QUADRANTS[v].name}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
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
                    className="bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-4 text-center transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
                  >
                    <Icon className="w-6 h-6 text-purple-600" strokeWidth={2} />
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
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {/* Summary */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} got {correctCount} out of {TOTAL_ROUNDS} correct</p>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-purple-700">{avgScore}</p>
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
                      <span className="text-xs font-bold text-purple-600">{r.finalScore}/100</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{r.insightTitle}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{r.insightMessage}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button onClick={handleRestart} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Play again</button>
              <button onClick={() => router.push(`/brain/${moduleKey}`)} className="w-full text-purple-600 hover:bg-purple-50 font-semibold py-2 rounded-xl text-sm transition-colors">Back to Memory module</button>
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
