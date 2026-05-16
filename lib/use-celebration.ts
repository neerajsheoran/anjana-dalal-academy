// Shared celebration hook for activities.
//
// Fires confetti once per phase transition:
//   - on entering `roundResult` if the just-completed round was correct
//   - on entering `summary` if ALL rounds were correct (perfect session)
//
// Activities just call this hook near the top of their render function;
// no per-activity wiring needed beyond passing the right signals.

import { useEffect } from "react";
import { celebrateRound, celebrateSession } from "./confetti";

interface UseCelebrationArgs {
  phase: string;
  lastRoundCorrect: boolean;
  perfectSession: boolean;
}

export function useCelebration({
  phase,
  lastRoundCorrect,
  perfectSession,
}: UseCelebrationArgs): void {
  useEffect(() => {
    if (phase === "roundResult" && lastRoundCorrect) {
      celebrateRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lastRoundCorrect]);

  useEffect(() => {
    if (phase === "summary" && perfectSession) {
      celebrateSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, perfectSession]);
}
