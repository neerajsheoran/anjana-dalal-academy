'use client';

// Odd One Out — Thinking module activity (age 5+).
// Show 4 items: 3 from one category, 1 from a different category. Kid picks
// the one that doesn't fit. Tests categorization — a distinct reasoning
// skill from pattern continuation (Pattern Logic / Number Sequence).

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Cat,
  Dog,
  Bird,
  Fish,
  Bug,
  Rabbit,
  Car,
  Bike,
  Plane,
  Train,
  Truck,
  Ship,
  Apple,
  Cherry,
  Carrot,
  Pizza,
  IceCream,
  Cake,
  Sun,
  Moon,
  Cloud,
  Snowflake,
  Flower2,
  Leaf,
  TreePine,
  Star,
  Heart,
  Sparkles,
  Crown,
  Flame,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  ODD_ONE_OUT_CONFIG,
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

// Categories of items. For each round we pick category A and category B,
// take 3 from A + 1 from B, shuffle. The "distance" between A and B
// scales with difficulty.
interface Category {
  key: string;
  label: string;        // shown after the answer to explain WHY it was odd
  items: { icon: LucideIcon; name: string }[];
  cluster: 'living' | 'manmade' | 'nature';  // for "near" categories
  subCluster?: string;  // for "very-near" disambiguation
}

const CATEGORIES: Category[] = [
  {
    key: 'animals',
    label: 'animals',
    cluster: 'living',
    subCluster: 'land',
    items: [
      { icon: Cat, name: 'cat' },
      { icon: Dog, name: 'dog' },
      { icon: Rabbit, name: 'rabbit' },
      { icon: Bug, name: 'bug' },
    ],
  },
  {
    key: 'flying',
    label: 'things that fly',
    cluster: 'living',
    subCluster: 'flying',
    items: [
      { icon: Bird, name: 'bird' },
      { icon: Plane, name: 'plane' },
    ],
  },
  {
    key: 'sea',
    label: 'sea creatures',
    cluster: 'living',
    subCluster: 'water',
    items: [
      { icon: Fish, name: 'fish' },
      { icon: Ship, name: 'ship' },
    ],
  },
  {
    key: 'vehicles',
    label: 'vehicles',
    cluster: 'manmade',
    subCluster: 'transport',
    items: [
      { icon: Car, name: 'car' },
      { icon: Bike, name: 'bike' },
      { icon: Train, name: 'train' },
      { icon: Truck, name: 'truck' },
    ],
  },
  {
    key: 'food',
    label: 'food',
    cluster: 'manmade',
    subCluster: 'food',
    items: [
      { icon: Apple, name: 'apple' },
      { icon: Cherry, name: 'cherry' },
      { icon: Carrot, name: 'carrot' },
      { icon: Pizza, name: 'pizza' },
      { icon: IceCream, name: 'ice cream' },
      { icon: Cake, name: 'cake' },
    ],
  },
  {
    key: 'sky',
    label: 'things in the sky',
    cluster: 'nature',
    subCluster: 'sky',
    items: [
      { icon: Sun, name: 'sun' },
      { icon: Moon, name: 'moon' },
      { icon: Cloud, name: 'cloud' },
      { icon: Snowflake, name: 'snowflake' },
    ],
  },
  {
    key: 'plants',
    label: 'plants',
    cluster: 'nature',
    subCluster: 'plant',
    items: [
      { icon: Flower2, name: 'flower' },
      { icon: Leaf, name: 'leaf' },
      { icon: TreePine, name: 'tree' },
    ],
  },
  {
    key: 'symbols',
    label: 'shiny things',
    cluster: 'manmade',
    subCluster: 'symbol',
    items: [
      { icon: Star, name: 'star' },
      { icon: Heart, name: 'heart' },
      { icon: Sparkles, name: 'sparkles' },
      { icon: Crown, name: 'crown' },
      { icon: Flame, name: 'flame' },
      { icon: Bell, name: 'bell' },
    ],
  },
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

interface RoundOption {
  icon: LucideIcon;
  name: string;
  fromCategory: string;
}

interface RoundSetup {
  options: RoundOption[];      // length = optionCount
  oddIndex: number;            // which index is the odd one
  categoryLabel: string;       // "vehicles" (the dominant category)
  oddLabel: string;            // "animal" (the odd one's category)
}

interface RoundData {
  setup: RoundSetup;
  pickedIndex: number;
  isCorrect: boolean;
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

function generateRound(
  distance: 'far' | 'near' | 'very-near',
  optionCount: number,
): RoundSetup {
  // Pick a "dominant" category that has at least (optionCount - 1) items
  const eligible = CATEGORIES.filter((c) => c.items.length >= optionCount - 1);
  const dominant = pickN(eligible, 1)[0];
  // Pick an "odd" category whose distance from dominant matches difficulty
  let oddCandidates: Category[];
  if (distance === 'far') {
    // Different cluster (living/manmade/nature)
    oddCandidates = CATEGORIES.filter(
      (c) => c.cluster !== dominant.cluster && c.items.length > 0,
    );
  } else if (distance === 'near') {
    // Same cluster, different category
    oddCandidates = CATEGORIES.filter(
      (c) =>
        c.cluster === dominant.cluster &&
        c.key !== dominant.key &&
        c.items.length > 0,
    );
    // Fallback if no near candidates (e.g., for some clusters)
    if (oddCandidates.length === 0) {
      oddCandidates = CATEGORIES.filter(
        (c) => c.cluster !== dominant.cluster && c.items.length > 0,
      );
    }
  } else {
    // very-near: same sub-cluster ideally; otherwise same cluster
    const sameSub = CATEGORIES.filter(
      (c) =>
        c.subCluster === dominant.subCluster &&
        c.key !== dominant.key &&
        c.items.length > 0,
    );
    oddCandidates =
      sameSub.length > 0
        ? sameSub
        : CATEGORIES.filter(
            (c) =>
              c.cluster === dominant.cluster &&
              c.key !== dominant.key &&
              c.items.length > 0,
          );
    if (oddCandidates.length === 0) {
      oddCandidates = CATEGORIES.filter(
        (c) => c.cluster !== dominant.cluster && c.items.length > 0,
      );
    }
  }
  const odd = pickN(oddCandidates, 1)[0];

  // Build options
  const dominantPicks = pickN(dominant.items, optionCount - 1);
  const oddPick = pickN(odd.items, 1)[0];
  const items: RoundOption[] = [
    ...dominantPicks.map((it) => ({
      icon: it.icon,
      name: it.name,
      fromCategory: dominant.key,
    })),
    { icon: oddPick.icon, name: oddPick.name, fromCategory: odd.key },
  ];
  // Shuffle, remember odd index
  const indexed = items.map((it, i) => ({ it, originallyOdd: i === items.length - 1 }));
  const shuffled = pickN(indexed, indexed.length);
  const oddIndex = shuffled.findIndex((x) => x.originallyOdd);
  return {
    options: shuffled.map((x) => x.it),
    oddIndex,
    categoryLabel: dominant.label,
    oddLabel: odd.label,
  };
}

export default function OddOneOutActivity({
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
  const config = ODD_ONE_OUT_CONFIG[difficulty];
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

  function startRound() {
    setSetup(generateRound(config.categoryDistance, config.optionCount));
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(index: number) {
    if (phase !== 'playing' || !setup) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    setPicked(index);
    const isCorrect = index === setup.oddIndex;
    setRoundData((prev) => [
      ...prev,
      { setup, pickedIndex: index, isCorrect, timeTakenSeconds: timeTaken },
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
              activityKey: 'odd-one-out',
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
                picked: r.pickedIndex,
                items: r.setup.options.map((o) => o.name),
              },
              correctAnswerJson: {
                oddIndex: r.setup.oddIndex,
                categoryLabel: r.setup.categoryLabel,
                oddLabel: r.setup.oddLabel,
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
    setPicked(null);
    setSetup(null);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) : 0;

  useCelebration({
    phase,
    lastRoundCorrect: lastRoundData?.isCorrect ?? false,
    perfectSession: results.length > 0 && results.every((r) => r.isCorrect),
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">

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

        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🤔
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Odd One Out</h1>
            <p className="text-orange-600 text-xs font-semibold mb-3">A Thinking game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.categoryDistance === 'far' ? 'obvious' : config.categoryDistance === 'near' ? 'close categories' : 'tricky'}
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li><strong className="text-gray-800">1.</strong> You&apos;ll see 4 things</li>
              <li><strong className="text-gray-800">2.</strong> Three of them belong together</li>
              <li><strong className="text-gray-800">3.</strong> Find the one that doesn&apos;t fit</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — think about what fits!</p>
          </div>
        )}

        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Which one doesn&apos;t fit?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {setup.options.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePick(i)}
                    className="aspect-square rounded-xl bg-gray-50 hover:bg-orange-50 hover:scale-105 active:scale-95 border-2 border-gray-100 hover:border-orange-300 flex items-center justify-center transition-all"
                    aria-label={opt.name}
                  >
                    <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-orange-700" strokeWidth={2} />
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
              {lastRoundData.isCorrect ? 'Got it!' : 'Not quite'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">The 4 items</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {lastRoundData.setup.options.map((opt, i) => {
                  const Icon = opt.icon;
                  const isOdd = i === lastRoundData.setup.oddIndex;
                  const wasPicked = i === lastRoundData.pickedIndex;
                  let bg = 'bg-white';
                  if (isOdd && wasPicked) bg = 'bg-green-200 ring-2 ring-green-500';
                  else if (isOdd) bg = 'bg-amber-100 ring-2 ring-amber-400';
                  else if (wasPicked) bg = 'bg-red-100 ring-2 ring-red-400';
                  return (
                    <div key={i} className={`aspect-square rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-orange-700" strokeWidth={2} />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600">
                Three were <strong>{lastRoundData.setup.categoryLabel}</strong>. The odd one was a <strong>{lastRoundData.setup.oddLabel.replace(/s$/, '')}</strong>.
              </p>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS ? `Next round (${round + 1}/${TOTAL_ROUNDS})` : 'How did that go?'}
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
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
                    <Icon className="w-6 h-6 text-orange-600" strokeWidth={2} />
                    <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
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
            <p className="text-sm text-gray-500 mb-4">{childName} got {correctCount} out of {TOTAL_ROUNDS} correct</p>
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
              <button onClick={handleRestart} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Play again</button>
              <button onClick={() => router.push(`/brain/${moduleKey}`)} className="w-full text-orange-600 hover:bg-orange-50 font-semibold py-2 rounded-xl text-sm transition-colors">Back to Thinking module</button>
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
