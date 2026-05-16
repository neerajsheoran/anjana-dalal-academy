// Confetti celebrations for activity wins.
//
// Tier 1 only — visual-only, no sound. Two functions:
//   • celebrateRound()    — small burst when a round is correct
//   • celebrateSession()  — bigger two-side burst when ALL rounds are correct
//
// Both respect `prefers-reduced-motion` so accessibility-conscious users
// don't get particle animations. Tree-shaken via dynamic import so the
// confetti library only ships when actually called.

// canvas-confetti uses CommonJS `export =` — under TS verbatimModuleSyntax /
// esModuleInterop the dynamic-import shape is `mod.default` at runtime but
// the type lives at the namespace root. The function form is what we want.
type ConfettiFn = (options?: import("canvas-confetti").Options) => void;

let _confetti: ConfettiFn | null = null;

async function getConfetti(): Promise<ConfettiFn> {
  if (_confetti) return _confetti;
  const mod = await import("canvas-confetti");
  // Interop: under ESM bundlers, the CJS function is on `.default`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = ((mod as any).default ?? mod) as ConfettiFn;
  _confetti = fn;
  return fn;
}

// Brand-ish colours — purple/pink/blue/orange/green palette.
const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#f97316", "#10b981", "#eab308"];

export async function celebrateRound() {
  // Skip on SSR or if user prefers reduced motion
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = await getConfetti();
  confetti({
    particleCount: 30,
    spread: 65,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.7 },
    colors: COLORS,
    disableForReducedMotion: true,
    ticks: 100,          // ~0.5s
  });
}

export async function celebrateSession() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = await getConfetti();
  // Two-side burst for a "wow" finale
  confetti({
    particleCount: 80,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.2, y: 0.6 },
    colors: COLORS,
    disableForReducedMotion: true,
    ticks: 200,
  });
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.8, y: 0.6 },
      colors: COLORS,
      disableForReducedMotion: true,
      ticks: 200,
    });
  }, 180);
}
