'use client';

// Whack-a-Target — Focus module activity (age 8+).
// Items pop up in a grid for a short time. Some are the TARGET icon, others
// are distractors. Tap targets, ignore distractors. Round is time-bounded.
// Tests sustained attention — a Focus sub-skill the catalog was missing.

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Sparkles,
  Crown,
  Bell,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  WHACK_CONFIG,
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
import { useAutoAdvance } from '@/lib/use-auto-advance';

const TOTAL_ROUNDS = 3;

// Icon pool — first one is always the target, others are distractors
const ICON_POOL: { icon: LucideIcon; name: string; color: string }[] = [
  { icon: Star,     name: 'star',     color: '#3b82f6' },  // target (blue)
  { icon: Heart,    name: 'heart',    color: '#ef4444' },
  { icon: Sparkles, name: 'sparkles', color: '#10b981' },
  { icon: Crown,    name: 'crown',    color: '#a855f7' },
  { icon: Bell,     name: 'bell',     color: '#eab308' },
  { icon: Flame,    name: 'flame',    color: '#f97316' },
];

type Phase =
  | 'instruction'
  | 'countdown'
  | 'playing'
  | 'roundResult'
  | 'reflection'
  | 'submitting'
  | 'summary';

interface ReflectionOptionLocal {
  key: 'felt-easy' | 'felt-tricky' | 'rushed' | 'guessed';
}

interface RoundResult {
  isCorrect: boolean;
  finalScore: number;
  insightTitle: string;
  insightMessage: string;
}

interface ActiveItem {
  id: number;
  cellIndex: number;
  iconIndex: number;     // index into ICON_POOL; 0 = target
  spawnedAt: number;     // ms timestamp
}

interface RoundData {
  targetsShown: number;
  correctTaps: number;
  wrongTaps: number;
  isCorrect: boolean;       // accuracy >= 80%
  accuracyPercent: number;
  timeTakenSeconds: number;
}

export default function WhackTargetActivity({
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
  const config = WHACK_CONFIG[difficulty];
  const TOTAL_CELLS = config.gridSize * config.gridSize;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [tappedFeedback, setTappedFeedback] = useState<{ cellIndex: number; correct: boolean } | null>(null);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Track stats for the in-progress round via refs to avoid stale-closure issues
  const targetsShownRef = useRef(0);
  const correctTapsRef = useRef(0);
  const wrongTapsRef = useRef(0);
  const itemIdRef = useRef(0);
  const expiredTargetsRef = useRef<Set<number>>(new Set()); // item ids that disappeared as targets without being tapped

  // Spawn an item and schedule its disappearance
  const spawnItem = useCallback(() => {
    const id = ++itemIdRef.current;
    setActiveItems((prev) => {
      // Find empty cells
      const occupied = new Set(prev.map((it) => it.cellIndex));
      const empty: number[] = [];
      for (let i = 0; i < TOTAL_CELLS; i++) if (!occupied.has(i)) empty.push(i);
      if (empty.length === 0) return prev; // grid full; skip this tick
      const cellIndex = empty[Math.floor(Math.random() * empty.length)];

      // Probability of target ~ 50% (always plenty to whack)
      const isTarget = Math.random() < 0.55;
      let iconIndex: number;
      if (isTarget) {
        iconIndex = 0;
        targetsShownRef.current += 1;
      } else {
        // Pick a distractor between 1..(distractorCount)
        const distractorRange = Math.min(config.distractorCount, ICON_POOL.length - 1);
        iconIndex = 1 + Math.floor(Math.random() * distractorRange);
      }

      const newItem: ActiveItem = { id, cellIndex, iconIndex, spawnedAt: Date.now() };

      // Schedule disappearance
      setTimeout(() => {
        setActiveItems((cur) => {
          const stillThere = cur.find((it) => it.id === id);
          if (stillThere && stillThere.iconIndex === 0) {
            // Target expired without being tapped
            expiredTargetsRef.current.add(id);
          }
          return cur.filter((it) => it.id !== id);
        });
      }, config.itemLifetimeMs);

      return [...prev, newItem];
    });
  }, [TOTAL_CELLS, config.distractorCount, config.itemLifetimeMs]);

  // Run the round: countdown → playing → end
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown <= 0) {
        // Start playing
        targetsShownRef.current = 0;
        correctTapsRef.current = 0;
        wrongTapsRef.current = 0;
        itemIdRef.current = 0;
        expiredTargetsRef.current.clear();
        setActiveItems([]);
        setRoundStartTime(Date.now());
        setPhase('playing');
        return;
      }
      const t = setTimeout(() => setCountdown((c) => c - 1), 700);
      return () => clearTimeout(t);
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let cancelled = false;

    // Spawn an item immediately on start
    spawnItem();

    // Periodic spawn
    const spawnTimer = setInterval(() => {
      if (cancelled) return;
      spawnItem();
    }, config.spawnIntervalMs);

    // End-of-round timer
    const endTimer = setTimeout(() => {
      if (cancelled) return;
      // Compute score now
      const timeTaken = (Date.now() - roundStartTime) / 1000;
      const total = targetsShownRef.current;
      const correct = correctTapsRef.current;
      const wrong = wrongTapsRef.current;
      // Accuracy = (correct - wrong*0.5) / total, floored at 0
      // Wrong taps are penalised but less than missing a target.
      const raw = total === 0 ? 0 : ((correct - wrong * 0.5) / total) * 100;
      const accuracy = Math.max(0, Math.min(100, Math.round(raw)));
      const isCorrect = accuracy >= 80;
      setRoundData((prev) => [
        ...prev,
        {
          targetsShown: total,
          correctTaps: correct,
          wrongTaps: wrong,
          isCorrect,
          accuracyPercent: accuracy,
          timeTakenSeconds: timeTaken,
        },
      ]);
      setActiveItems([]);
      setPhase('roundResult');
    }, config.durationMs);

    return () => {
      cancelled = true;
      clearInterval(spawnTimer);
      clearTimeout(endTimer);
    };
  }, [phase, config.spawnIntervalMs, config.durationMs, roundStartTime, spawnItem]);

  function handleCellTap(cellIndex: number) {
    if (phase !== 'playing') return;
    const item = activeItems.find((it) => it.cellIndex === cellIndex);
    if (!item) return;

    // Remove it; record correctness
    setActiveItems((prev) => prev.filter((it) => it.id !== item.id));
    if (item.iconIndex === 0) {
      correctTapsRef.current += 1;
      setTappedFeedback({ cellIndex, correct: true });
    } else {
      wrongTapsRef.current += 1;
      setTappedFeedback({ cellIndex, correct: false });
    }
    setTimeout(() => setTappedFeedback(null), 250);
  }

  function startRound() {
    setCountdown(3);
    setPhase('countdown');
    setError('');
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
              activityKey: 'whack-a-target',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.accuracyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: {
                targetsShown: r.targetsShown,
                correctTaps: r.correctTaps,
                wrongTaps: r.wrongTaps,
                gridSize: config.gridSize,
              },
              correctAnswerJson: { threshold: 80 },
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
    setActiveItems([]);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) : 0;

  const autoAdvanceSecondsLeft = useAutoAdvance({
    phase,
    isCorrect: lastRoundData?.isCorrect ?? false,
    onAdvance: advanceFromRoundResult,
  });

  useCelebration({
    phase,
    lastRoundCorrect: lastRoundData?.isCorrect ?? false,
    perfectSession: results.length > 0 && results.every((r) => r.isCorrect),
  });

  const TargetIcon = ICON_POOL[0].icon;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

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

        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎯
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Whack-a-Target</h1>
            <p className="text-green-600 text-xs font-semibold mb-3">A Focus game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {(config.durationMs / 1000).toFixed(0)}s per round
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> Tap only the <strong className="inline-flex items-center gap-1">target <TargetIcon className="w-4 h-4 inline" style={{ color: ICON_POOL[0].color }} fill={ICON_POOL[0].color} strokeWidth={1.5} /></strong></li>
              <li><strong className="text-gray-800">2.</strong> Ignore the other icons (they&apos;re distractors)</li>
              <li><strong className="text-gray-800">3.</strong> Wrong taps lose points — be careful!</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — eyes sharp, fingers quick!</p>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Get ready</p>
            <p className="text-7xl font-bold text-green-600 animate-pulse">{countdown > 0 ? countdown : 'GO'}</p>
            <p className="mt-4 text-xs text-gray-500 inline-flex items-center gap-1.5">
              Tap only:
              <TargetIcon className="w-5 h-5" style={{ color: ICON_POOL[0].color }} fill={ICON_POOL[0].color} strokeWidth={1.5} />
            </p>
          </div>
        )}

        {phase === 'playing' && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <p className="text-center text-xs font-semibold text-gray-600 mb-3 inline-flex items-center justify-center gap-1.5 w-full">
              Tap only:
              <TargetIcon className="w-4 h-4" style={{ color: ICON_POOL[0].color }} fill={ICON_POOL[0].color} strokeWidth={1.5} />
            </p>
            <div
              className="grid gap-2 mb-3"
              style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
                const item = activeItems.find((it) => it.cellIndex === i);
                const feedback = tappedFeedback?.cellIndex === i ? tappedFeedback : null;
                let bg = 'bg-gray-100';
                if (feedback?.correct) bg = 'bg-green-200';
                else if (feedback) bg = 'bg-red-200';
                else if (item) bg = 'bg-white shadow-md';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCellTap(i)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${bg} ${item ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                    aria-label={`Cell ${i + 1}`}
                  >
                    {item && (() => {
                      const iconMeta = ICON_POOL[item.iconIndex];
                      const Icon = iconMeta.icon;
                      return (
                        <Icon
                          className="w-8 h-8 sm:w-10 sm:h-10 animate-in fade-in zoom-in duration-200"
                          style={{ color: iconMeta.color }}
                          fill={iconMeta.color}
                          strokeWidth={1.5}
                        />
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Sharp focus!' : 'Stay focused'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Targets that appeared:</span>
                <strong>{lastRoundData.targetsShown}</strong>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Correct taps:</span>
                <strong>{lastRoundData.correctTaps}</strong>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Wrong taps:</span>
                <strong>{lastRoundData.wrongTaps}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-bold">Accuracy:</span>
                <strong className="text-green-700">{lastRoundData.accuracyPercent}%</strong>
              </div>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS})` : 'How did that go?'}
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
            {autoAdvanceSecondsLeft !== null && (
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Auto-continues in {autoAdvanceSecondsLeft}s · tap above to skip
              </p>
            )}
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

        {phase === 'submitting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} hit the bar {correctCount} of {TOTAL_ROUNDS} times</p>
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
                        {r.isCorrect ? 'Sharp' : 'Distracted'}
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
