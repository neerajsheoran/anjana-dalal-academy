'use client';

// Silent auto-looping Pattern Recall preview for the homepage hero.
// Visual only — no scoring, no inputs, no Firestore. Shows the
// memorize → recall loop in ~4 seconds so visitors grasp the mechanic.

import { useEffect, useState } from 'react';

type Phase = 'show' | 'hide' | 'recall' | 'celebrate';

const PATTERNS: number[][] = [
  [0, 4, 8],
  [1, 3, 7],
  [2, 4, 6],
  [0, 5, 7],
  [1, 4, 6],
];

const PHASE_MS: Record<Phase, number> = {
  show: 1400,
  hide: 700,
  recall: 1500,
  celebrate: 700,
};

export default function PatternRecallDemo() {
  const [phase, setPhase] = useState<Phase>('show');
  const [patternIdx, setPatternIdx] = useState(0);
  const [recallStep, setRecallStep] = useState(0);

  const pattern = PATTERNS[patternIdx];

  useEffect(() => {
    if (phase === 'recall') {
      // Light up cells one-by-one
      if (recallStep < pattern.length) {
        const t = setTimeout(
          () => setRecallStep((s) => s + 1),
          PHASE_MS.recall / pattern.length,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('celebrate'), 200);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (phase === 'show') {
        setPhase('hide');
      } else if (phase === 'hide') {
        setRecallStep(0);
        setPhase('recall');
      } else if (phase === 'celebrate') {
        setPatternIdx((i) => (i + 1) % PATTERNS.length);
        setRecallStep(0);
        setPhase('show');
      }
    }, PHASE_MS[phase]);

    return () => clearTimeout(t);
  }, [phase, recallStep, pattern.length]);

  function cellState(i: number): 'on' | 'recalled' | 'off' {
    if (phase === 'show' && pattern.includes(i)) return 'on';
    if (phase === 'recall' && pattern.slice(0, recallStep).includes(i)) return 'recalled';
    if (phase === 'celebrate' && pattern.includes(i)) return 'recalled';
    return 'off';
  }

  const label = {
    show: 'Memorize the pattern…',
    hide: 'Now recall it.',
    recall: 'Tap the cells you saw.',
    celebrate: 'Nice — got them all!',
  }[phase];

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl"
        aria-hidden="true"
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const state = cellState(i);
          const base =
            'w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all duration-300';
          const styles =
            state === 'on'
              ? 'bg-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.8)] scale-105'
              : state === 'recalled'
                ? 'bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.7)] scale-105'
                : 'bg-white/10';
          return <div key={i} className={`${base} ${styles}`} />;
        })}
      </div>
      <p
        className="text-xs sm:text-sm text-blue-100 font-medium min-h-[1.25rem]"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  );
}
