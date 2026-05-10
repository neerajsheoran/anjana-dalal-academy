// Small notification shown on the activity instruction screen when the
// adaptive engine has changed the child's level since their last session.

import {
  DIFFICULTY_LABEL,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';

interface Props {
  source: AdaptiveSource;
  current: Difficulty;
  previous?: Difficulty;
}

export default function AdaptiveBanner({ source, current, previous }: Props) {
  if (source !== 'leveled-up' && source !== 'leveled-down') return null;

  const isUp = source === 'leveled-up';

  return (
    <div
      className={`rounded-xl px-3 py-2 text-xs font-medium mb-3 text-left ${
        isUp
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'bg-blue-50 text-blue-800 border border-blue-200'
      }`}
    >
      {isUp ? (
        <>
          <span className="text-base mr-1">🚀</span>
          Great job last time — you&apos;ve earned{' '}
          <strong>{DIFFICULTY_LABEL[current]} mode</strong>
          {previous && ` (was ${DIFFICULTY_LABEL[previous]})`}.
        </>
      ) : (
        <>
          <span className="text-base mr-1">💪</span>
          Stepping it down to <strong>{DIFFICULTY_LABEL[current]} mode</strong>
          {previous && ` (was ${DIFFICULTY_LABEL[previous]})`} — let&apos;s nail this level first.
        </>
      )}
    </div>
  );
}
