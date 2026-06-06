// Content registry for Senior-tier (Class 5–8) brain games.
//
// Validation slice: Memory Match only. If this slice validates with the
// beta cohort (see cognilift-senior-tier-spec.md §Validation plan), we'll
// extend the same registry pattern to the other 13 activities.
//
// Junior tier still uses each activity's hard-coded icon/abstract pool —
// no central registry needed there. The registry is a Senior-tier concept.

// A pair = two cards that match. Each card has its own face.
// For icon games (junior) both faces are identical; for text-pair decks
// (senior) the two faces show different but related text.
export interface MemoryMatchTextPair {
  pairId: number;
  left: { label: string; text: string };   // e.g. { STATE, Maharashtra }
  right: { label: string; text: string };  // e.g. { CAPITAL, Mumbai }
}

export interface MemoryMatchSeniorDeck {
  key: string;                    // stored in attempts.contentVariant
  name: string;                   // shown briefly on the instruction card
  leftLabel: string;              // small label on every left-side card
  rightLabel: string;             // small label on every right-side card
  pairs: { left: string; right: string }[];
}

// Indian state ↔ capital. 10 pairs; activity picks N at random per round.
const STATE_CAPITAL: MemoryMatchSeniorDeck = {
  key: "state-capital",
  name: "Indian states & capitals",
  leftLabel: "STATE",
  rightLabel: "CAPITAL",
  pairs: [
    { left: "Maharashtra",   right: "Mumbai" },
    { left: "Karnataka",     right: "Bengaluru" },
    { left: "Tamil Nadu",    right: "Chennai" },
    { left: "West Bengal",   right: "Kolkata" },
    { left: "Rajasthan",     right: "Jaipur" },
    { left: "Gujarat",       right: "Gandhinagar" },
    { left: "Punjab",        right: "Chandigarh" },
    { left: "Kerala",        right: "Thiruvananthapuram" },
    { left: "Odisha",        right: "Bhubaneswar" },
    { left: "Assam",         right: "Dispur" },
  ],
};

// Element name ↔ chemical symbol. 12 of the most-taught elements.
const ELEMENT_SYMBOL: MemoryMatchSeniorDeck = {
  key: "element-symbol",
  name: "Elements & symbols",
  leftLabel: "ELEMENT",
  rightLabel: "SYMBOL",
  pairs: [
    { left: "Hydrogen",  right: "H" },
    { left: "Helium",    right: "He" },
    { left: "Carbon",    right: "C" },
    { left: "Nitrogen",  right: "N" },
    { left: "Oxygen",    right: "O" },
    { left: "Sodium",    right: "Na" },
    { left: "Magnesium", right: "Mg" },
    { left: "Aluminium", right: "Al" },
    { left: "Iron",      right: "Fe" },
    { left: "Copper",    right: "Cu" },
    { left: "Silver",    right: "Ag" },
    { left: "Gold",      right: "Au" },
  ],
};

export const MEMORY_MATCH_SENIOR_DECKS: MemoryMatchSeniorDeck[] = [
  STATE_CAPITAL,
  ELEMENT_SYMBOL,
];

// Pick a random deck for the next round. Kept simple for the validation
// slice — once we have engagement data we may weight by chapter context.
export function pickMemoryMatchSeniorDeck(): MemoryMatchSeniorDeck {
  const i = Math.floor(Math.random() * MEMORY_MATCH_SENIOR_DECKS.length);
  return MEMORY_MATCH_SENIOR_DECKS[i];
}
