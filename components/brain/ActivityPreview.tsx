// Tiny CSS-only mockup of each activity, shown on the kid's module page
// in place of the generic Play button. Hints at the mechanic so the kid
// can pick by sight, not just by name.
//
// Pure HTML+CSS — no JS state, no images, no network requests. Each
// mockup fits in a 64×64 box. Total weight: ~5KB rendered.

import {
  Star,
  Cat,
  Apple,
  Heart,
  type LucideIcon,
} from 'lucide-react';

type ZoneColor = 'purple' | 'green' | 'orange';

const PILLAR_BG_SOFT: Record<ZoneColor, string> = {
  purple: 'bg-purple-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
};
const PILLAR_RING: Record<ZoneColor, string> = {
  purple: 'ring-purple-200',
  green: 'ring-green-200',
  orange: 'ring-orange-200',
};
const PILLAR_DOT: Record<ZoneColor, string> = {
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
};
const PILLAR_DOT_DIM: Record<ZoneColor, string> = {
  purple: 'bg-purple-200',
  green: 'bg-green-200',
  orange: 'bg-orange-200',
};
const PILLAR_TEXT: Record<ZoneColor, string> = {
  purple: 'text-purple-700',
  green: 'text-green-700',
  orange: 'text-orange-700',
};
const PILLAR_TEXT_DIM: Record<ZoneColor, string> = {
  purple: 'text-purple-300',
  green: 'text-green-300',
  orange: 'text-orange-300',
};

// Outer frame — shared shape so all previews have a consistent footprint.
function Frame({
  color,
  children,
  pad = 'p-1.5',
}: {
  color: ZoneColor;
  children: React.ReactNode;
  pad?: string;
}) {
  return (
    <div
      className={`w-16 h-16 rounded-xl ${PILLAR_BG_SOFT[color]} ring-1 ${PILLAR_RING[color]} ${pad} flex items-center justify-center shrink-0`}
    >
      {children}
    </div>
  );
}

// ── Mini-grid helpers ───────────────────────────────────────────────────
// Pre-baked "highlighted cell" patterns so the preview is deterministic
// (no randomness on the server). Indices refer to row-major cell positions.

function MiniGrid({
  size,
  litIndices,
  color,
}: {
  size: 3 | 4;
  litIndices: number[];
  color: ZoneColor;
}) {
  const total = size * size;
  return (
    <div
      className="grid gap-[2px] w-full h-full"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-[2px] ${
            litIndices.includes(i) ? PILLAR_DOT[color] : PILLAR_DOT_DIM[color]
          }`}
        />
      ))}
    </div>
  );
}

function IconPair({
  Icon,
  color,
  cls = '',
}: {
  Icon: LucideIcon;
  color: string;
  cls?: string;
}) {
  return <Icon className={`w-3.5 h-3.5 ${color} ${cls}`} strokeWidth={2.5} />;
}

// ── Per-activity previews ───────────────────────────────────────────────

function PatternRecallPreview({ color }: { color: ZoneColor }) {
  // 3×3 grid with cells 0, 4, 8 lit (diagonal-ish pattern).
  return (
    <Frame color={color}>
      <MiniGrid size={3} litIndices={[0, 4, 8]} color={color} />
    </Frame>
  );
}

function ColorSequencePreview({ color }: { color: ZoneColor }) {
  // 2×2 colored quadrants — red / blue / yellow / green Simon-style.
  return (
    <Frame color={color}>
      <div className="grid grid-cols-2 gap-[2px] w-full h-full">
        <div className="bg-red-400 rounded-tl" />
        <div className="bg-blue-400 rounded-tr" />
        <div className="bg-yellow-400 rounded-bl" />
        <div className="bg-emerald-400 rounded-br ring-2 ring-emerald-600" />
      </div>
    </Frame>
  );
}

function MemoryMatchPreview({ color }: { color: ZoneColor }) {
  // 2×2: top row face-down (purple "?"), bottom row matching icons revealed.
  return (
    <Frame color={color}>
      <div className="grid grid-cols-2 gap-[2px] w-full h-full">
        <div className={`${PILLAR_DOT[color]} rounded-[2px] flex items-center justify-center text-white text-[10px] font-bold`}>?</div>
        <div className={`${PILLAR_DOT[color]} rounded-[2px] flex items-center justify-center text-white text-[10px] font-bold`}>?</div>
        <div className="bg-white rounded-[2px] flex items-center justify-center">
          <IconPair Icon={Heart} color="text-pink-500" />
        </div>
        <div className="bg-white rounded-[2px] flex items-center justify-center">
          <IconPair Icon={Heart} color="text-pink-500" />
        </div>
      </div>
    </Frame>
  );
}

function TapBackPreview({ color }: { color: ZoneColor }) {
  // 3×3 with cell 5 (right-middle) lit — Corsi single-flash hint.
  return (
    <Frame color={color}>
      <MiniGrid size={3} litIndices={[5]} color={color} />
    </Frame>
  );
}

function NumberRecallPreview({ color }: { color: ZoneColor }) {
  return (
    <Frame color={color}>
      <div className={`font-bold text-base ${PILLAR_TEXT[color]} tracking-wider`}>
        4 <span className={PILLAR_TEXT_DIM[color]}>·</span> 7 <span className={PILLAR_TEXT_DIM[color]}>·</span> 2
      </div>
    </Frame>
  );
}

function FindTheObjectPreview({ color }: { color: ZoneColor }) {
  // 3×3 of dim dots with one bright Star.
  return (
    <Frame color={color}>
      <div className="grid grid-cols-3 gap-[2px] w-full h-full">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full flex items-center justify-center ${
              i === 4 ? PILLAR_DOT[color] : PILLAR_DOT_DIM[color]
            }`}
          >
            {i === 4 && <Star className="w-2 h-2 text-white fill-white" />}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function SpotTheDifferencePreview({ color }: { color: ZoneColor }) {
  // Two side-by-side 2×2 grids; one cell differs.
  return (
    <Frame color={color}>
      <div className="flex gap-1 w-full h-full">
        <div className="grid grid-cols-2 gap-[2px] flex-1">
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
        </div>
        <div className="grid grid-cols-2 gap-[2px] flex-1">
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
          <div className="bg-amber-400 rounded-[2px] ring-1 ring-amber-600" />
          <div className={`${PILLAR_DOT[color]} rounded-[2px]`} />
        </div>
      </div>
    </Frame>
  );
}

function StroopPreview({ color }: { color: ZoneColor }) {
  // The classic "BLUE written in red" preview.
  return (
    <Frame color={color}>
      <div className="font-bold text-sm text-red-500">BLUE</div>
    </Frame>
  );
}

function WhackTargetPreview({ color }: { color: ZoneColor }) {
  // 2×2 with one big star (the target).
  return (
    <Frame color={color}>
      <div className="grid grid-cols-2 gap-[2px] w-full h-full">
        <div className={`${PILLAR_DOT_DIM[color]} rounded-[2px]`} />
        <div className={`${PILLAR_DOT[color]} rounded-[2px] flex items-center justify-center`}>
          <Star className="w-3 h-3 text-white fill-white" strokeWidth={2.5} />
        </div>
        <div className={`${PILLAR_DOT_DIM[color]} rounded-[2px] flex items-center justify-center`}>
          <Heart className="w-2.5 h-2.5 text-white/70" strokeWidth={2.5} />
        </div>
        <div className={`${PILLAR_DOT_DIM[color]} rounded-[2px]`} />
      </div>
    </Frame>
  );
}

function PatternLogicPreview({ color }: { color: ZoneColor }) {
  // Row of small icons: ▲ ● ▲ ● ? — alternating pattern.
  return (
    <Frame color={color}>
      <div className="flex items-center gap-1">
        <Heart className="w-3 h-3 text-pink-500 fill-pink-500" strokeWidth={2.5} />
        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" strokeWidth={2.5} />
        <Heart className="w-3 h-3 text-pink-500 fill-pink-500" strokeWidth={2.5} />
        <span className={`text-xs font-bold ${PILLAR_TEXT[color]}`}>?</span>
      </div>
    </Frame>
  );
}

function OddOneOutPreview({ color }: { color: ZoneColor }) {
  // 2×2 of icons: three cats + one apple (the odd one).
  return (
    <Frame color={color}>
      <div className="grid grid-cols-2 gap-[3px] w-full h-full place-items-center">
        <IconPair Icon={Cat} color={PILLAR_TEXT[color]} />
        <IconPair Icon={Cat} color={PILLAR_TEXT[color]} />
        <IconPair Icon={Cat} color={PILLAR_TEXT[color]} />
        <div className="ring-2 ring-amber-500 rounded-full p-[2px]">
          <IconPair Icon={Apple} color="text-red-500" />
        </div>
      </div>
    </Frame>
  );
}

function MiniSudokuPreview({ color }: { color: ZoneColor }) {
  // 4×4 mini-grid with a few cells "filled" (textured darker) and one empty.
  // Use pre-baked positions to keep it static & deterministic.
  const filled = [0, 3, 5, 6, 9, 10, 12, 15];
  return (
    <Frame color={color}>
      <MiniGrid size={4} litIndices={filled} color={color} />
    </Frame>
  );
}

function AnalogiesPreview({ color }: { color: ZoneColor }) {
  return (
    <Frame color={color}>
      <div className={`text-[9px] font-bold ${PILLAR_TEXT[color]} leading-tight text-center`}>
        A : B<br />::<br />C : ?
      </div>
    </Frame>
  );
}

function NumberSequencePreview({ color }: { color: ZoneColor }) {
  return (
    <Frame color={color}>
      <div className={`text-xs font-bold ${PILLAR_TEXT[color]} tracking-tight`}>
        2,4,<br />6,?
      </div>
    </Frame>
  );
}

// ── Dispatcher ──────────────────────────────────────────────────────────

export default function ActivityPreview({
  activityKey,
  color,
}: {
  activityKey: string;
  color: ZoneColor;
}) {
  switch (activityKey) {
    case 'pattern-recall':       return <PatternRecallPreview color={color} />;
    case 'color-sequence':       return <ColorSequencePreview color={color} />;
    case 'memory-match':         return <MemoryMatchPreview color={color} />;
    case 'tap-back':             return <TapBackPreview color={color} />;
    case 'number-recall':        return <NumberRecallPreview color={color} />;
    case 'find-the-object':      return <FindTheObjectPreview color={color} />;
    case 'spot-the-difference':  return <SpotTheDifferencePreview color={color} />;
    case 'stroop-task':          return <StroopPreview color={color} />;
    case 'whack-a-target':       return <WhackTargetPreview color={color} />;
    case 'pattern-logic':        return <PatternLogicPreview color={color} />;
    case 'odd-one-out':          return <OddOneOutPreview color={color} />;
    case 'mini-sudoku':          return <MiniSudokuPreview color={color} />;
    case 'analogies':            return <AnalogiesPreview color={color} />;
    case 'number-sequence':      return <NumberSequencePreview color={color} />;
    default:
      // Fallback for any not-yet-previewed activity — pillar dot.
      return (
        <Frame color={color}>
          <div className={`w-3 h-3 rounded-full ${PILLAR_DOT[color]}`} />
        </Frame>
      );
  }
}

