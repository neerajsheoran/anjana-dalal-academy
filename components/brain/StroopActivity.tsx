'use client';

// Stroop Task — Focus module activity (age 8+).
// Show a color WORD (e.g., "RED") rendered in a DIFFERENT ink color.
// Kid taps the INK color, NOT the word. Tests inhibition control —
// suppressing the dominant "read the word" response.
//
// 3 rounds, each with a fresh trial. No special images / assets.

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  STROOP_CONFIG,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';

const TOTAL_ROUNDS = 3;

// Color palette — name, hex, and Tailwind bg class for the buttons.
const COLOR_POOL = [
  { name: 'RED',    hex: '#ef4444', bg: 'bg-red-500',    hoverBg: 'hover:bg-red-600' },
  { name: 'BLUE',   hex: '#3b82f6', bg: 'bg-blue-500',   hoverBg: 'hover:bg-blue-600' },
  { name: 'GREEN',  hex: '#10b981', bg: 'bg-emerald-500',hoverBg: 'hover:bg-emerald-600' },
  { name: 'YELLOW', hex: '#eab308', bg: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-600' },
  { name: 'PURPLE', hex: '#a855f7', bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600' },
  { name: 'ORANGE', hex: '#f97316', bg: 'bg-orange-500', hoverBg: 'hover:bg-orange-600' },
] as const;

type ColorName = typeof COLOR_POOL[number]['name'];

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

interface RoundSetup {
  word: ColorName;       // the text shown
  inkColor: ColorName;   // what color the text is rendered in (different from word)
  options: ColorName[];  // which color buttons to show
}

interface RoundData {
  setup: RoundSetup;
  picked: ColorName;
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

function generateRound(optionCount: number): RoundSetup {
  // Pick optionCount distinct colors. The word and the ink color must both be
  // in this set, and they must DIFFER (otherwise no inhibition test).
  const picked = shuffle(COLOR_POOL.map((c) => c.name)).slice(0, optionCount);
  const word = picked[Math.floor(Math.random() * picked.length)];
  let inkColor = picked[Math.floor(Math.random() * picked.length)];
  let safety = 0;
  while (inkColor === word && safety < 20) {
    inkColor = picked[Math.floor(Math.random() * picked.length)];
    safety++;
  }
  return { word, inkColor, options: picked };
}

function getColorMeta(name: ColorName) {
  return COLOR_POOL.find((c) => c.name === name)!;
}

export default function StroopActivity({
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
  const config = STROOP_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [picked, setPicked] = useState<ColorName | null>(null);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  function startRound() {
    setSetup(generateRound(config.optionCount));
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(color: ColorName) {
    if (phase !== 'playing' || !setup) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const isCorrect = color === setup.inkColor;
    setPicked(color);
    setRoundData((prev) => [...prev, { setup, picked: color, isCorrect, timeTakenSeconds: timeTaken }]);
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
              activityKey: 'stroop-task',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.isCorrect ? 100 : 0,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { word: r.setup.word, inkColor: r.setup.inkColor, picked: r.picked },
              correctAnswerJson: { inkColor: r.setup.inkColor },
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto">

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
              🎨
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Color Catch</h1>
            <p className="text-green-600 text-xs font-semibold mb-3">A Focus game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.optionCount} colors
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> A color name appears, but in a different color</li>
              <li><strong className="text-gray-800">2.</strong> Tap the <strong className="text-green-700">ink color</strong> — NOT the word</li>
              <li><strong className="text-gray-800">3.</strong> Be quick, but careful</li>
            </ol>
            <div className="bg-green-50 rounded-lg p-3 mb-5 text-xs text-gray-600 text-left">
              <p className="font-semibold mb-1">Example:</p>
              <p className="text-2xl font-extrabold tracking-wider" style={{ color: '#3b82f6' }}>RED</p>
              <p className="mt-1 text-[11px] text-gray-500">Answer: tap the <strong style={{ color: '#3b82f6' }}>blue</strong> button — that&apos;s the ink color.</p>
            </div>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — trust your eyes, not the word!</p>
          </div>
        )}

        {/* Playing */}
        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Tap the <span className="text-green-700">INK color</span>
            </p>
            <div className="bg-gray-50 rounded-2xl py-10 mb-6 text-center">
              <p
                className="text-5xl sm:text-6xl font-extrabold tracking-wider"
                style={{ color: getColorMeta(setup.inkColor).hex }}
              >
                {setup.word}
              </p>
            </div>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(setup.options.length, 3)}, minmax(0, 1fr))` }}
            >
              {setup.options.map((c) => {
                const meta = getColorMeta(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handlePick(c)}
                    className={`${meta.bg} ${meta.hoverBg} text-white font-bold py-4 rounded-xl text-sm shadow active:scale-95 transition-all`}
                    aria-label={c.toLowerCase()}
                  >
                    {/* No text — children should pick by COLOR, not by reading the label */}
                    <span className="block w-6 h-6 mx-auto rounded-full bg-white/30" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Got it!' : 'Tricky one'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Word and ink</p>
              <p
                className="text-4xl font-extrabold tracking-wider mb-3"
                style={{ color: getColorMeta(lastRoundData.setup.inkColor).hex }}
              >
                {lastRoundData.setup.word}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Correct ink:</span>
                  <span
                    className="inline-block w-5 h-5 rounded-full ring-2 ring-green-300"
                    style={{ backgroundColor: getColorMeta(lastRoundData.setup.inkColor).hex }}
                  />
                </div>
                {!lastRoundData.isCorrect && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">You picked:</span>
                    <span
                      className="inline-block w-5 h-5 rounded-full ring-2 ring-red-300"
                      style={{ backgroundColor: getColorMeta(lastRoundData.picked).hex }}
                    />
                  </div>
                )}
              </div>
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
