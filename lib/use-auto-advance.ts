// Shared hook for auto-advancing past the roundResult phase.
//
// Kid plays a round → submits → sees the result. Currently they must tap
// "Next round" to continue. This adds an automatic transition after a short
// delay (faster on correct, slower on wrong so the kid can review the
// answer). The original button stays visible so an impatient kid can still
// tap-through and skip the wait.
//
// Tuning per #1 in the audit:
//   - Correct: 1.2s — felt the "yes!", time to move
//   - Wrong:   3.0s — see the answer + correct overlay before continuing
//
// Returns secondsLeft (a 1-step countdown) so activities can render a
// "Auto-continues in Ns" line. null when not in roundResult phase.

import { useEffect, useRef, useState } from 'react';

const CORRECT_DELAY_MS = 1200;
const WRONG_DELAY_MS = 3000;
const TICK_MS = 200;

export function useAutoAdvance({
  phase,
  isCorrect,
  onAdvance,
  correctDelayMs = CORRECT_DELAY_MS,
  wrongDelayMs = WRONG_DELAY_MS,
}: {
  phase: string;
  isCorrect: boolean;
  onAdvance: () => void;
  correctDelayMs?: number;
  wrongDelayMs?: number;
}): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Stash the latest onAdvance in a ref so we don't re-fire the timer when
  // the activity component re-renders and produces a new callback.
  const onAdvanceRef = useRef(onAdvance);
  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    if (phase !== 'roundResult') {
      setSecondsLeft(null);
      return;
    }

    const totalMs = isCorrect ? correctDelayMs : wrongDelayMs;
    const start = Date.now();
    setSecondsLeft(Math.ceil(totalMs / 1000));

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, totalMs - elapsed);
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, TICK_MS);

    const timeout = setTimeout(() => {
      onAdvanceRef.current();
    }, totalMs);

    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [phase, isCorrect, correctDelayMs, wrongDelayMs]);

  return secondsLeft;
}
