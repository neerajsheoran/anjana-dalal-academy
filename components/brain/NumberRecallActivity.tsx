'use client';

// Number Recall — Memory module, elder-kid activity.
// Show a digit sequence for a few seconds, then the kid types it back via
// an on-screen numpad. Tests numerical working memory (digit span).

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  NUMBER_RECALL_CONFIG,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';

const TOTAL_ROUNDS = 3;

type Phase =
  | 'instruction'
  | 'showing'
  | 'recalling'
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
  digits: number[];
  entered: number[];
  isCorrect: boolean;
  accuracyPercent: number;
  timeTakenSeconds: number;
}

function generateDigits(count: number): number[] {
  // No leading-zero concern (we render as a sequence, not a single number),
  // but avoid 3+ repeats in a row to keep it interesting.
  const out: number[] = [];
  while (out.length < count) {
    const d = Math.floor(Math.random() * 10);
    const last2 = out.slice(-2);
    if (last2.length === 2 && last2[0] === d && last2[1] === d) continue;
    out.push(d);
  }
  return out;
}

function arrayEquals(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export default function NumberRecallActivity({
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
  const config = NUMBER_RECALL_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [digits, setDigits] = useState<number[]>([]);
  const [entered, setEntered] = useState<number[]>([]);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timeTakenRef = useRef<number>(0);

  // Auto-advance: showing → recalling
  useEffect(() => {
    if (phase === 'showing') {
      const t = setTimeout(() => {
        startTimeRef.current = Date.now();
        setPhase('recalling');
      }, config.showDurationMs);
      return () => clearTimeout(t);
    }
  }, [phase, config.showDurationMs]);

  function startRound() {
    setDigits(generateDigits(config.digitCount));
    setEntered([]);
    setError('');
    setPhase('showing');
  }

  function handleDigitTap(d: number) {
    if (phase !== 'recalling') return;
    if (entered.length >= config.digitCount) return;
    setEntered((prev) => [...prev, d]);
  }

  function handleBackspace() {
    if (phase !== 'recalling') return;
    setEntered((prev) => prev.slice(0, -1));
  }

  function handleSubmit() {
    if (entered.length === 0) return;
    timeTakenRef.current = (Date.now() - startTimeRef.current) / 1000;
    const isCorrect = arrayEquals(entered, digits);
    // Partial credit: positionally correct digits / total
    const positionalMatches = entered.filter((d, i) => d === digits[i]).length;
    const accuracyPercent = Math.round((positionalMatches / digits.length) * 100);
    setRoundData((prev) => [
      ...prev,
      {
        digits: [...digits],
        entered: [...entered],
        isCorrect,
        accuracyPercent,
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
              activityKey: 'number-recall',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.accuracyPercent,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { entered: r.entered, digitCount: config.digitCount },
              correctAnswerJson: { digits: r.digits },
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
    setDigits([]);
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

  const numpad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-sm mx-auto">

        {/* Top bar */}
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
              🔢
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Number Recall</h1>
            <p className="text-purple-600 text-xs font-semibold mb-3">
              A Memory game · {TOTAL_ROUNDS} rounds
            </p>
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}
            >
              {DIFFICULTY_LABEL[difficulty]} mode · {config.digitCount} digits
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li><strong className="text-gray-800">1.</strong> Watch the digits flash for {(config.showDurationMs / 1000).toFixed(1)} seconds</li>
              <li><strong className="text-gray-800">2.</strong> They disappear</li>
              <li><strong className="text-gray-800">3.</strong> Tap the digits in the same order</li>
            </ol>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — focus on the order!</p>
          </div>
        )}

        {/* Showing */}
        {phase === 'showing' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
              Memorize this
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              {digits.map((d, i) => (
                <div
                  key={i}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-purple-100 text-purple-800 text-2xl sm:text-3xl font-bold flex items-center justify-center shadow-sm"
                >
                  {d}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 animate-pulse">Disappearing soon…</p>
          </div>
        )}

        {/* Recalling */}
        {phase === 'recalling' && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-3">
              Type what you saw
            </p>
            {/* Entry boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5">
              {Array.from({ length: config.digitCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg text-2xl sm:text-3xl font-bold flex items-center justify-center border-2 ${
                    i < entered.length
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-gray-50 text-gray-300 border-gray-200'
                  }`}
                >
                  {i < entered.length ? entered[i] : '·'}
                </div>
              ))}
            </div>
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {numpad.slice(0, 9).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigitTap(d)}
                  className="h-12 rounded-xl bg-gray-100 hover:bg-purple-100 active:bg-purple-200 text-gray-800 text-xl font-bold transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                disabled={entered.length === 0}
                className="h-12 rounded-xl bg-gray-100 hover:bg-amber-100 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-30"
              >
                ⌫
              </button>
              <button
                onClick={() => handleDigitTap(0)}
                className="h-12 rounded-xl bg-gray-100 hover:bg-purple-100 active:bg-purple-200 text-gray-800 text-xl font-bold transition-colors"
              >
                0
              </button>
              <button
                onClick={handleSubmit}
                disabled={entered.length === 0}
                className="h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-40"
              >
                ✓
              </button>
            </div>
          </div>
        )}

        {/* Round result */}
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
            <div className="space-y-2 mb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Correct</p>
                <div className="flex items-center justify-center gap-1.5">
                  {lastRoundData.digits.map((d, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 rounded-lg bg-green-100 text-green-800 text-lg font-bold flex items-center justify-center"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">You</p>
                <div className="flex items-center justify-center gap-1.5">
                  {lastRoundData.digits.map((_, i) => {
                    const v = lastRoundData.entered[i];
                    const ok = v === lastRoundData.digits[i];
                    return (
                      <div
                        key={i}
                        className={`w-8 h-10 rounded-lg text-lg font-bold flex items-center justify-center ${
                          v === undefined
                            ? 'bg-gray-100 text-gray-300'
                            : ok
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {v ?? '·'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
            >
              {round < TOTAL_ROUNDS
                ? `Next round (${round + 1}/${TOTAL_ROUNDS})`
                : 'How did that go?'}
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Reflection */}
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
                  className="bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-4 text-center transition-all disabled:opacity-50"
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
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {/* Summary */}
        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">
              {childName} got {correctCount} out of {TOTAL_ROUNDS} correct
            </p>
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
                      <span
                        className={`text-xs font-semibold ${
                          r.isCorrect ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
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
              <button
                onClick={handleRestart}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Play again
              </button>
              <button
                onClick={() => router.push(`/brain/${moduleKey}`)}
                className="w-full text-purple-600 hover:bg-purple-50 font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Back to Memory module
              </button>
              <button
                onClick={() => router.push('/brain')}
                className="inline-flex items-center justify-center gap-1 w-full text-gray-500 hover:text-gray-700 text-xs py-1 transition-colors"
              >
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
