'use client';

// Memory Match / Concentration — Memory module activity (age 5+).
// Grid of face-down cards. Tap two to flip; if they match, they stay up.
// Tests visual-spatial recognition memory — kid must REMEMBER where they
// saw which icon. Distinct from Pattern Recall (one-shot memorize) and
// Color Sequence (temporal order memory).

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Apple,
  Banana,
  Cherry,
  Carrot,
  Cat,
  Dog,
  Bird,
  Fish,
  Sun,
  Moon,
  Star,
  Heart,
  Sparkles,
  Crown,
  Flame,
  Bell,
  Flower2,
  Leaf,
  TreePine,
  Cloud,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  MEMORY_MATCH_CONFIG,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import type { TrainingTier } from '@/lib/train-eligibility';
import {
  pickMemoryMatchSeniorDeck,
  type MemoryMatchSeniorDeck,
} from '@/lib/brain-content';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';
import {
  REFLECTION_OPTIONS,
  type ReflectionOption,
} from '@/components/brain/reflection-options';
import { useCelebration } from '@/lib/use-celebration';
import { useAutoAdvance } from '@/lib/use-auto-advance';

const TOTAL_ROUNDS = 3;

// Each card has a "face" — what shows when flipped or matched. Junior tier
// uses icon faces (both cards in a pair show the SAME icon). Senior tier
// uses text-pair faces (the two cards show DIFFERENT but related text,
// e.g. Maharashtra ↔ Mumbai).
type CardFace =
  | { kind: 'icon'; icon: LucideIcon; color: string; bg: string; name: string }
  | { kind: 'text'; text: string; label: string };

interface IconCard {
  icon: LucideIcon;
  color: string;     // tailwind text color
  bg: string;        // tailwind bg color
  name: string;
}

const ICON_POOL: IconCard[] = [
  { icon: Apple,     color: 'text-red-500',     bg: 'bg-red-50',     name: 'apple' },
  { icon: Banana,    color: 'text-yellow-500',  bg: 'bg-yellow-50',  name: 'banana' },
  { icon: Cherry,    color: 'text-rose-500',    bg: 'bg-rose-50',    name: 'cherry' },
  { icon: Carrot,    color: 'text-orange-500',  bg: 'bg-orange-50',  name: 'carrot' },
  { icon: Cat,       color: 'text-amber-600',   bg: 'bg-amber-50',   name: 'cat' },
  { icon: Dog,       color: 'text-stone-600',   bg: 'bg-stone-50',   name: 'dog' },
  { icon: Bird,      color: 'text-sky-500',     bg: 'bg-sky-50',     name: 'bird' },
  { icon: Fish,      color: 'text-blue-500',    bg: 'bg-blue-50',    name: 'fish' },
  { icon: Sun,       color: 'text-yellow-500',  bg: 'bg-yellow-50',  name: 'sun' },
  { icon: Moon,      color: 'text-indigo-500',  bg: 'bg-indigo-50',  name: 'moon' },
  { icon: Star,      color: 'text-yellow-600',  bg: 'bg-yellow-50',  name: 'star' },
  { icon: Heart,     color: 'text-pink-500',    bg: 'bg-pink-50',    name: 'heart' },
  { icon: Sparkles,  color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', name: 'sparkles' },
  { icon: Crown,     color: 'text-amber-500',   bg: 'bg-amber-50',   name: 'crown' },
  { icon: Flame,     color: 'text-orange-600',  bg: 'bg-orange-50',  name: 'flame' },
  { icon: Bell,      color: 'text-amber-600',   bg: 'bg-amber-50',   name: 'bell' },
  { icon: Flower2,   color: 'text-pink-600',    bg: 'bg-pink-50',    name: 'flower' },
  { icon: Leaf,      color: 'text-green-600',   bg: 'bg-green-50',   name: 'leaf' },
  { icon: TreePine,  color: 'text-emerald-600', bg: 'bg-emerald-50', name: 'pine tree' },
  { icon: Cloud,     color: 'text-slate-400',   bg: 'bg-slate-50',   name: 'cloud' },
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

interface CardState {
  pairId: number;        // 0..pairs-1
  face: CardFace;
  isMatched: boolean;
  isFlipped: boolean;
}

interface RoundData {
  pairs: number;
  moves: number;
  minMoves: number;       // = pairs (best possible: every flip-pair is a match)
  efficiencyPercent: number;
  isCorrect: boolean;     // efficiency >= 75%
  timeTakenSeconds: number;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildJuniorBoard(pairs: number): CardState[] {
  const chosen = shuffle(ICON_POOL).slice(0, pairs);
  const cards: CardState[] = [];
  chosen.forEach((card, pairId) => {
    const face: CardFace = { kind: 'icon', ...card };
    cards.push({ pairId, face, isMatched: false, isFlipped: false });
    cards.push({ pairId, face, isMatched: false, isFlipped: false });
  });
  return shuffle(cards);
}

function buildSeniorBoard(
  pairs: number,
  deck: MemoryMatchSeniorDeck,
): CardState[] {
  const chosen = shuffle(deck.pairs).slice(0, pairs);
  const cards: CardState[] = [];
  chosen.forEach((pair, pairId) => {
    cards.push({
      pairId,
      face: { kind: 'text', text: pair.left, label: deck.leftLabel },
      isMatched: false,
      isFlipped: false,
    });
    cards.push({
      pairId,
      face: { kind: 'text', text: pair.right, label: deck.rightLabel },
      isMatched: false,
      isFlipped: false,
    });
  });
  return shuffle(cards);
}

export default function MemoryMatchActivity({
  moduleKey,
  childName,
  difficulty,
  adaptiveSource,
  previousLevel,
  tier = 'junior',
}: {
  moduleKey: ModuleKey;
  childName: string;
  difficulty: Difficulty;
  adaptiveSource?: AdaptiveSource;
  previousLevel?: Difficulty;
  tier?: TrainingTier;
}) {
  const config = MEMORY_MATCH_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [board, setBoard] = useState<CardState[]>([]);
  const [activeDeck, setActiveDeck] = useState<MemoryMatchSeniorDeck | null>(null);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);  // briefly true while showing a non-match pair before re-hiding
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  function startRound() {
    if (tier === 'senior') {
      const deck = pickMemoryMatchSeniorDeck();
      setActiveDeck(deck);
      setBoard(buildSeniorBoard(config.pairs, deck));
    } else {
      setActiveDeck(null);
      setBoard(buildJuniorBoard(config.pairs));
    }
    setFlippedIndices([]);
    setMoves(0);
    setIsPeeking(false);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  // When 2 cards are flipped, check for a match.
  useEffect(() => {
    if (flippedIndices.length !== 2) return;
    const [aIdx, bIdx] = flippedIndices;
    const a = board[aIdx];
    const b = board[bIdx];
    if (!a || !b) return;
    setMoves((m) => m + 1);
    if (a.pairId === b.pairId) {
      // Match — keep them up, mark matched
      setBoard((prev) => {
        const next = [...prev];
        next[aIdx] = { ...next[aIdx], isMatched: true };
        next[bIdx] = { ...next[bIdx], isMatched: true };
        return next;
      });
      setFlippedIndices([]);
    } else {
      // Mismatch — show briefly, then flip back
      setIsPeeking(true);
      const t = setTimeout(() => {
        setBoard((prev) => {
          const next = [...prev];
          next[aIdx] = { ...next[aIdx], isFlipped: false };
          next[bIdx] = { ...next[bIdx], isFlipped: false };
          return next;
        });
        setFlippedIndices([]);
        setIsPeeking(false);
      }, config.peekDurationMs);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIndices]);

  // When all cards are matched, end the round.
  useEffect(() => {
    if (phase !== 'playing' || board.length === 0) return;
    const allMatched = board.every((c) => c.isMatched);
    if (!allMatched) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const minMoves = config.pairs;
    // moves count starts at 0 and increments after every 2-flip pair. Add 1
    // since the final pair completing the board ALSO counts.
    // Actually the +1 already happens because we increment in the match-check
    // effect. So `moves` here is the total move count.
    const efficiency = Math.round((minMoves / Math.max(moves, minMoves)) * 100);
    const isCorrect = efficiency >= 75;
    setRoundData((prev) => [
      ...prev,
      {
        pairs: config.pairs,
        moves,
        minMoves,
        efficiencyPercent: efficiency,
        isCorrect,
        timeTakenSeconds: timeTaken,
      },
    ]);
    setPhase('roundResult');
  }, [board, phase, config.pairs, moves]);

  function handleCardTap(index: number) {
    if (phase !== 'playing') return;
    if (isPeeking) return;
    if (flippedIndices.length >= 2) return;
    const card = board[index];
    if (!card || card.isMatched || card.isFlipped) return;
    setBoard((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isFlipped: true };
      return next;
    });
    setFlippedIndices((prev) => [...prev, index]);
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
              activityKey: 'memory-match',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: tier === 'senior' ? (activeDeck?.key ?? 'senior') : 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.efficiencyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { moves: r.moves, pairs: r.pairs },
              correctAnswerJson: { minMoves: r.minMoves },
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
    setBoard([]);
    setFlippedIndices([]);
    setMoves(0);
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const matchedCount = board.filter((c) => c.isMatched).length / 2;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length)
      : 0;

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

  function Card({ card, index }: { card: CardState; index: number }) {
    const showFace = card.isFlipped || card.isMatched;
    const face = card.face;
    const ringClass = card.isMatched
      ? 'ring-emerald-400 opacity-70'
      : tier === 'senior'
        ? 'ring-slate-400 scale-105'
        : 'ring-purple-400 scale-105';
    const faceBg = face.kind === 'icon'
      ? face.bg
      : tier === 'senior'
        ? 'bg-slate-50'
        : 'bg-purple-50';
    const backBg = tier === 'senior'
      ? 'bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 ring-slate-600'
      : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 ring-purple-300';
    const ariaLabel = showFace
      ? (face.kind === 'icon' ? face.name : `${face.label}: ${face.text}`)
      : 'face down card';
    return (
      <button
        type="button"
        onClick={() => handleCardTap(index)}
        disabled={card.isMatched || card.isFlipped || isPeeking}
        className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
          showFace
            ? `${faceBg} ring-2 ${ringClass}`
            : `${backBg} cursor-pointer ring-2 active:scale-95`
        } disabled:cursor-default`}
        aria-label={ariaLabel}
      >
        {showFace ? (
          face.kind === 'icon' ? (
            <face.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${face.color}`} strokeWidth={2} />
          ) : (
            <span className="flex flex-col items-center justify-center gap-0.5 px-1 text-center leading-tight">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {face.label}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-800 break-words">
                {face.text}
              </span>
            </span>
          )
        ) : (
          <span className="text-white text-xl sm:text-2xl font-bold opacity-50">?</span>
        )}
      </button>
    );
  }

  const mainBg =
    tier === 'senior'
      ? 'bg-gradient-to-br from-slate-100 to-slate-50'
      : 'bg-gradient-to-br from-purple-50 to-fuchsia-50';

  return (
    <main data-tier={tier} className={`min-h-screen ${mainBg} py-8 px-4`}>
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🃏
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Memory Match</h1>
            <p className="text-purple-600 text-xs font-semibold mb-3">A Memory game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.pairs} pairs
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> Tap a card to flip it</li>
              <li><strong className="text-gray-800">2.</strong> Tap another card to find its match</li>
              <li><strong className="text-gray-800">3.</strong> Matching pairs stay face-up</li>
              <li><strong className="text-gray-800">4.</strong> Use fewer flips for a better score!</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">
              {tier === 'senior'
                ? `Hi ${childName} — match each pair (state ↔ capital, element ↔ symbol).`
                : `Hi ${childName} — remember where the pairs hide!`}
            </p>
          </div>
        )}

        {phase === 'playing' && board.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>Matched: <strong className="text-emerald-600">{matchedCount} / {config.pairs}</strong></span>
              <span>Moves: <strong className="text-purple-600">{moves}</strong></span>
            </div>
            <div
              className="grid gap-2 sm:gap-3 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                maxWidth: config.cols === 3 ? '280px' : '320px',
              }}
            >
              {board.map((card, i) => (
                <Card key={i} card={card} index={i} />
              ))}
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-4">
              Best score = {config.pairs} moves (one flip per pair)
            </p>
          </div>
        )}

        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {lastRoundData.isCorrect ? 'Sharp memory!' : 'Found them all'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {lastRoundData.moves} moves · best is {lastRoundData.minMoves}
            </p>
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Efficiency</p>
              <p className="text-3xl font-bold text-purple-700">{lastRoundData.efficiencyPercent}%</p>
              <p className="text-[10px] text-gray-400">
                {lastRoundData.efficiencyPercent >= 90
                  ? 'Almost perfect — strong recognition'
                  : lastRoundData.efficiencyPercent >= 75
                    ? 'Solid — kept the mental map'
                    : 'Lots of flips — try grouping by color or position next time'}
              </p>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
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
                    className="bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-4 text-center transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-500 shadow-md flex items-center justify-center mb-1">
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
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} got {correctCount} of {TOTAL_ROUNDS} sharp</p>
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-4 mb-5">
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
                      <span className={`text-xs font-semibold ${r.isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.isCorrect ? 'Sharp' : 'Solid'}
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
