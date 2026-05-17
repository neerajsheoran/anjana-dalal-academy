'use client';

// Analogies — Thinking module activity (age 9+).
// Show "A : B :: C : ?" — kid picks the correct completion from multiple
// choice options. Tests analogical reasoning — recognising the relationship
// between A and B and applying the SAME relationship to C.

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ModuleKey } from '@/lib/brain-modules';
import {
  ANALOGIES_CONFIG,
  DIFFICULTY_LABEL,
  DIFFICULTY_BADGE_BG,
  type Difficulty,
} from '@/lib/difficulty';
import type { AdaptiveSource } from '@/lib/adaptive';
import AdaptiveBanner from '@/components/brain/AdaptiveBanner';
import {
  REFLECTION_OPTIONS,
  type ReflectionOption,
} from '@/components/brain/reflection-options';
import { useCelebration } from '@/lib/use-celebration';
import { useAutoAdvance } from '@/lib/use-auto-advance';

const TOTAL_ROUNDS = 3;

interface Analogy {
  a: string;
  b: string;
  c: string;
  correct: string;
  distractors: string[];   // at least 3 plausible-but-wrong options
  relationship?: string;   // shown after the round to explain the link
}

const ANALOGIES_BANK: Record<'easy' | 'medium' | 'hard', Analogy[]> = {
  // EASY — simple opposites, animal-baby pairs, function pairs
  easy: [
    { a: 'Dog',   b: 'Puppy',   c: 'Cat',    correct: 'Kitten',   distractors: ['Cub', 'Calf', 'Foal'],   relationship: 'animal → baby' },
    { a: 'Cow',   b: 'Calf',    c: 'Horse',  correct: 'Foal',     distractors: ['Kitten', 'Cub', 'Joey'], relationship: 'animal → baby' },
    { a: 'Big',   b: 'Small',   c: 'Tall',   correct: 'Short',    distractors: ['Wide', 'Fast', 'Slow'],  relationship: 'opposites' },
    { a: 'Hot',   b: 'Cold',    c: 'Up',     correct: 'Down',     distractors: ['Left', 'Open', 'Fast'],  relationship: 'opposites' },
    { a: 'Day',   b: 'Sun',     c: 'Night',  correct: 'Moon',     distractors: ['Star', 'Cloud', 'Sky'],  relationship: 'time → light source' },
    { a: 'Bird',  b: 'Fly',     c: 'Fish',   correct: 'Swim',     distractors: ['Run', 'Walk', 'Jump'],   relationship: 'animal → how it moves' },
    { a: 'Sun',   b: 'Hot',     c: 'Ice',    correct: 'Cold',     distractors: ['Wet', 'Loud', 'Soft'],   relationship: 'thing → property' },
    { a: 'Hand',  b: 'Glove',   c: 'Foot',   correct: 'Sock',     distractors: ['Hat', 'Belt', 'Scarf'],  relationship: 'body part → what covers it' },
    { a: 'Wet',   b: 'Dry',     c: 'Light',  correct: 'Dark',     distractors: ['Heavy', 'Loud', 'Soft'], relationship: 'opposites' },
    { a: 'Cat',   b: 'Meow',    c: 'Dog',    correct: 'Bark',     distractors: ['Moo', 'Roar', 'Sing'],   relationship: 'animal → sound' },
    { a: 'Bee',   b: 'Honey',   c: 'Cow',    correct: 'Milk',     distractors: ['Eggs', 'Wool', 'Cheese'], relationship: 'animal → product' },
    { a: 'Eye',   b: 'See',     c: 'Ear',    correct: 'Hear',     distractors: ['Taste', 'Smell', 'Touch'], relationship: 'organ → sense' },
    { a: 'Sheep', b: 'Lamb',    c: 'Duck',   correct: 'Duckling', distractors: ['Chick', 'Piglet', 'Cub'], relationship: 'animal → baby' },
    { a: 'Frog',  b: 'Tadpole', c: 'Butterfly', correct: 'Caterpillar', distractors: ['Bee', 'Fly', 'Worm'], relationship: 'adult → young form' },
    { a: 'Fast',  b: 'Slow',    c: 'Heavy',  correct: 'Light',    distractors: ['Hard', 'Old', 'Loud'],   relationship: 'opposites' },
    { a: 'In',    b: 'Out',     c: 'Open',   correct: 'Closed',   distractors: ['On', 'Up', 'Wide'],      relationship: 'opposites' },
    { a: 'Push',  b: 'Pull',    c: 'Give',   correct: 'Take',     distractors: ['Hold', 'Drop', 'Throw'], relationship: 'opposite actions' },
    { a: 'Lion',  b: 'Roar',    c: 'Snake',  correct: 'Hiss',     distractors: ['Bark', 'Buzz', 'Sing'],  relationship: 'animal → sound' },
    { a: 'Cow',   b: 'Moo',     c: 'Sheep',  correct: 'Baa',      distractors: ['Bark', 'Meow', 'Quack'], relationship: 'animal → sound' },
    { a: 'Duck',  b: 'Quack',   c: 'Frog',   correct: 'Croak',    distractors: ['Hiss', 'Howl', 'Roar'],  relationship: 'animal → sound' },
    { a: 'Sock',  b: 'Foot',    c: 'Glove',  correct: 'Hand',     distractors: ['Arm', 'Head', 'Leg'],    relationship: 'clothing → body part' },
    { a: 'Bird',  b: 'Nest',    c: 'Bee',    correct: 'Hive',     distractors: ['Cave', 'Hole', 'Tree'],  relationship: 'animal → home' },
    { a: 'Tooth', b: 'Brush',   c: 'Hair',   correct: 'Comb',     distractors: ['Wash', 'Cut', 'Hat'],    relationship: 'body part → tool to groom it' },
    { a: 'Star',  b: 'Sky',     c: 'Fish',   correct: 'Sea',      distractors: ['Lake', 'Tree', 'Cloud'], relationship: 'thing → where it lives' },
    { a: 'Apple', b: 'Tree',    c: 'Grape',  correct: 'Vine',     distractors: ['Bush', 'Plant', 'Root'], relationship: 'fruit → where it grows' },
    { a: 'Salt',  b: 'White',   c: 'Coal',   correct: 'Black',    distractors: ['Brown', 'Grey', 'Red'],  relationship: 'thing → its color' },
    { a: 'Smile', b: 'Happy',   c: 'Cry',    correct: 'Sad',      distractors: ['Angry', 'Scared', 'Tired'], relationship: 'action → feeling' },
    { a: 'Ear',   b: 'Listen',  c: 'Mouth',  correct: 'Speak',    distractors: ['Smell', 'See', 'Touch'], relationship: 'body part → its action' },
    { a: 'Sun',   b: 'Day',     c: 'Moon',   correct: 'Night',    distractors: ['Star', 'Sky', 'Cloud'],  relationship: 'light source → time' },
    { a: 'Bread', b: 'Bake',    c: 'Soup',   correct: 'Boil',     distractors: ['Fry', 'Cut', 'Mix'],     relationship: 'food → how it is made' },
  ],
  // MEDIUM — part-whole, function, characteristic
  medium: [
    { a: 'Wheel', b: 'Car',     c: 'Wing',   correct: 'Plane',    distractors: ['Train', 'Ship', 'Bike'],   relationship: 'part → whole' },
    { a: 'Leaf',  b: 'Tree',    c: 'Petal',  correct: 'Flower',   distractors: ['Bush', 'Grass', 'Vine'],   relationship: 'part → whole' },
    { a: 'Pen',   b: 'Write',   c: 'Knife',  correct: 'Cut',      distractors: ['Eat', 'Cook', 'Hold'],     relationship: 'tool → action' },
    { a: 'Book',  b: 'Read',    c: 'Song',   correct: 'Sing',     distractors: ['Dance', 'Listen', 'Play'], relationship: 'thing → action' },
    { a: 'Cold',  b: 'Sweater', c: 'Rain',   correct: 'Umbrella', distractors: ['Boots', 'Hat', 'Towel'],   relationship: 'condition → what you use' },
    { a: 'Fish',  b: 'Sea',     c: 'Bird',   correct: 'Sky',      distractors: ['Tree', 'Nest', 'Cloud'],   relationship: 'animal → habitat' },
    { a: 'Hour',  b: 'Day',     c: 'Day',    correct: 'Week',     distractors: ['Month', 'Year', 'Minute'], relationship: 'small unit → larger unit' },
    { a: 'Tail',  b: 'Dog',     c: 'Mane',   correct: 'Lion',     distractors: ['Cat', 'Bear', 'Wolf'],     relationship: 'feature → animal' },
    { a: 'Teacher', b: 'School', c: 'Doctor', correct: 'Hospital', distractors: ['Library', 'Office', 'Park'], relationship: 'person → workplace' },
    { a: 'Hungry', b: 'Eat',    c: 'Thirsty', correct: 'Drink',   distractors: ['Sleep', 'Run', 'Cook'],    relationship: 'feeling → action' },
    { a: 'Salt',  b: 'Salty',   c: 'Sugar',  correct: 'Sweet',    distractors: ['Sour', 'Bitter', 'Spicy'], relationship: 'thing → taste' },
    { a: 'Snow',  b: 'Winter',  c: 'Rain',   correct: 'Monsoon',  distractors: ['Summer', 'Spring', 'Autumn'], relationship: 'weather → season' },
    { a: 'Paint', b: 'Brush',   c: 'Hammer', correct: 'Nail',     distractors: ['Wood', 'Saw', 'Wall'],     relationship: 'tool → what it works on' },
    { a: 'Chef',  b: 'Kitchen', c: 'Judge',  correct: 'Court',    distractors: ['Office', 'Library', 'School'], relationship: 'person → workplace' },
    { a: 'Petal', b: 'Flower',  c: 'Branch', correct: 'Tree',     distractors: ['Bush', 'Leaf', 'Root'],   relationship: 'part → whole' },
    { a: 'Cloud', b: 'Rain',    c: 'Volcano', correct: 'Lava',    distractors: ['Smoke', 'Fire', 'Ash'],   relationship: 'source → what comes out' },
    { a: 'Library', b: 'Books', c: 'Garage', correct: 'Cars',     distractors: ['Tools', 'Bikes', 'Doors'], relationship: 'place → what is stored there' },
    { a: 'Page',  b: 'Book',    c: 'Brick',  correct: 'Wall',     distractors: ['House', 'Floor', 'Stone'], relationship: 'part → whole' },
    { a: 'Hot',   b: 'Sun',     c: 'Cold',   correct: 'Ice',      distractors: ['Snow', 'Wind', 'Rain'],   relationship: 'property → thing' },
    { a: 'Soldier', b: 'Army',  c: 'Sailor', correct: 'Navy',     distractors: ['Ship', 'Sea', 'Crew'],    relationship: 'member → organization' },
    { a: 'Roar',  b: 'Lion',    c: 'Bark',   correct: 'Dog',      distractors: ['Cat', 'Wolf', 'Bear'],    relationship: 'sound → animal' },
    { a: 'Pencil', b: 'Wood',   c: 'Window', correct: 'Glass',    distractors: ['Paper', 'Plastic', 'Metal'], relationship: 'object → material' },
    { a: 'Doctor', b: 'Stethoscope', c: 'Painter', correct: 'Brush', distractors: ['Pencil', 'Knife', 'Hammer'], relationship: 'person → tool they use' },
    { a: 'Cake',  b: 'Bakery',  c: 'Bread',  correct: 'Oven',     distractors: ['Flour', 'Sugar', 'Kitchen'], relationship: 'food → where it is made' },
    { a: 'Calf',  b: 'Cow',     c: 'Cub',    correct: 'Bear',     distractors: ['Wolf', 'Lion', 'Tiger'],  relationship: 'baby → parent' },
    { a: 'Library', b: 'Quiet', c: 'Stadium', correct: 'Loud',    distractors: ['Big', 'Crowded', 'Open'], relationship: 'place → its feel' },
    { a: 'Lake',  b: 'Pond',    c: 'Ocean',  correct: 'Sea',      distractors: ['River', 'Stream', 'Pool'], relationship: 'big → smaller version' },
    { a: 'Carrot', b: 'Vegetable', c: 'Mango', correct: 'Fruit',  distractors: ['Tree', 'Plant', 'Food'],  relationship: 'specific → category' },
    { a: 'Mountain', b: 'Climb', c: 'Pool',  correct: 'Swim',     distractors: ['Walk', 'Sit', 'Run'],     relationship: 'place → action there' },
    { a: 'Camera', b: 'Photo',  c: 'Mind',   correct: 'Memory',   distractors: ['Idea', 'Dream', 'Thought'], relationship: 'tool → what it captures' },
  ],
  // HARD — abstract, function, multi-step relationships
  hard: [
    { a: 'Author', b: 'Book',     c: 'Composer',  correct: 'Symphony',  distractors: ['Painting', 'Movie', 'Poem'],    relationship: 'creator → creation' },
    { a: 'Pilot',  b: 'Cockpit',  c: 'Captain',   correct: 'Bridge',    distractors: ['Deck', 'Cabin', 'Engine'],      relationship: 'role → place they command from' },
    { a: 'Drought', b: 'Famine',  c: 'Storm',     correct: 'Flood',     distractors: ['Snow', 'Earthquake', 'Fire'],   relationship: 'cause → effect' },
    { a: 'Mercury', b: 'Planet',  c: 'Sparrow',   correct: 'Bird',      distractors: ['Animal', 'Pet', 'Wing'],        relationship: 'specific → category' },
    { a: 'Eraser', b: 'Mistake',  c: 'Bandage',   correct: 'Wound',     distractors: ['Pain', 'Cut', 'Hand'],          relationship: 'tool → what it fixes' },
    { a: 'Whisper', b: 'Shout',   c: 'Glance',    correct: 'Stare',     distractors: ['Look', 'See', 'Eye'],           relationship: 'soft → intense version' },
    { a: 'Hint',   b: 'Clue',     c: 'Symbol',    correct: 'Meaning',   distractors: ['Letter', 'Idea', 'Picture'],    relationship: 'representation → what it represents' },
    { a: 'Bee',    b: 'Hive',     c: 'Ant',       correct: 'Colony',    distractors: ['Nest', 'Hole', 'Family'],       relationship: 'social insect → group' },
    { a: 'Spark',  b: 'Fire',     c: 'Drop',      correct: 'Ocean',     distractors: ['River', 'Lake', 'Puddle'],      relationship: 'tiny → vast' },
    { a: 'Mask',   b: 'Hide',     c: 'Mirror',    correct: 'Reflect',   distractors: ['Show', 'See', 'Look'],          relationship: 'object → its function' },
    { a: 'Honey',  b: 'Sweet',    c: 'Lemon',     correct: 'Sour',      distractors: ['Bitter', 'Salty', 'Spicy'],     relationship: 'food → its taste' },
    { a: 'Doctor', b: 'Patient',  c: 'Lawyer',    correct: 'Client',    distractors: ['Friend', 'Boss', 'Witness'],    relationship: 'professional → the person they serve' },
    { a: 'Sculptor', b: 'Statue', c: 'Architect', correct: 'Building',  distractors: ['Design', 'Plan', 'House'],      relationship: 'creator → creation' },
    { a: 'Verdict', b: 'Trial',   c: 'Diagnosis', correct: 'Examination', distractors: ['Surgery', 'Cure', 'Medicine'], relationship: 'outcome → process' },
    { a: 'Caution', b: 'Reckless', c: 'Generous', correct: 'Stingy',    distractors: ['Kind', 'Greedy', 'Mean'],       relationship: 'trait → its opposite' },
    { a: 'Botany', b: 'Plants',   c: 'Zoology',   correct: 'Animals',   distractors: ['Stars', 'Rocks', 'Insects'],    relationship: 'field → what it studies' },
    { a: 'Drizzle', b: 'Downpour', c: 'Breeze',   correct: 'Gale',      distractors: ['Wind', 'Storm', 'Cloud'],       relationship: 'mild → severe' },
    { a: 'Hesitate', b: 'Confident', c: 'Mumble', correct: 'Articulate', distractors: ['Quiet', 'Loud', 'Speak'],      relationship: 'weak → strong version' },
    { a: 'Currency', b: 'Wallet', c: 'Letter',    correct: 'Envelope',  distractors: ['Paper', 'Pen', 'Box'],          relationship: 'item → container' },
    { a: 'Witness', b: 'Testify', c: 'Athlete',   correct: 'Compete',   distractors: ['Train', 'Run', 'Win'],          relationship: 'role → what they do' },
    { a: 'Famine', b: 'Hunger',   c: 'Insomnia',  correct: 'Tiredness', distractors: ['Sleep', 'Dream', 'Rest'],       relationship: 'condition → resulting feeling' },
    { a: 'Earthquake', b: 'Tremor', c: 'Volcano', correct: 'Eruption',  distractors: ['Smoke', 'Mountain', 'Lava'],    relationship: 'event → what happens' },
    { a: 'Antidote', b: 'Poison', c: 'Vaccine',   correct: 'Disease',   distractors: ['Cure', 'Doctor', 'Hospital'],   relationship: 'remedy → threat' },
    { a: 'Concert', b: 'Audience', c: 'Match',    correct: 'Spectators', distractors: ['Players', 'Coach', 'Referee'], relationship: 'event → watchers' },
    { a: 'Translator', b: 'Languages', c: 'Mediator', correct: 'Conflicts', distractors: ['People', 'Words', 'Ideas'], relationship: 'role → what they bridge' },
    { a: 'Microscope', b: 'Small', c: 'Telescope', correct: 'Far',      distractors: ['Big', 'Close', 'Bright'],       relationship: 'tool → what it shows' },
    { a: 'Frostbite', b: 'Cold',  c: 'Sunburn',   correct: 'Heat',      distractors: ['Wind', 'Rain', 'Sand'],         relationship: 'injury → cause' },
    { a: 'Detective', b: 'Mystery', c: 'Scientist', correct: 'Hypothesis', distractors: ['Theory', 'Experiment', 'Lab'], relationship: 'investigator → what they investigate' },
    { a: 'Drought', b: 'Rain',    c: 'Silence',   correct: 'Sound',     distractors: ['Music', 'Voice', 'Noise'],      relationship: 'absence → what is missing' },
    { a: 'Apprentice', b: 'Master', c: 'Sapling', correct: 'Tree',      distractors: ['Seed', 'Forest', 'Branch'],     relationship: 'early stage → mature' },
  ],
};

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

interface RoundSetup {
  analogy: Analogy;
  options: string[]; // optionCount entries including the correct one, shuffled
}

interface RoundData {
  setup: RoundSetup;
  picked: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function generateRound(
  bank: 'easy' | 'medium' | 'hard',
  optionCount: number,
  exclude: Set<number>,
): { setup: RoundSetup; bankIndex: number } {
  // Pick an analogy not yet used in this session
  const pool = ANALOGIES_BANK[bank];
  let bankIndex = Math.floor(Math.random() * pool.length);
  let safety = 0;
  while (exclude.has(bankIndex) && ++safety < 50) {
    bankIndex = Math.floor(Math.random() * pool.length);
  }
  const analogy = pool[bankIndex];

  // Pick `optionCount - 1` distractors from the bank's distractors list
  const distractors = pickN(analogy.distractors, optionCount - 1);
  const options = pickN([analogy.correct, ...distractors], optionCount);

  return { setup: { analogy, options }, bankIndex };
}

export default function AnalogiesActivity({
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
  const config = ANALOGIES_CONFIG[difficulty];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('instruction');
  const [round, setRound] = useState(1);
  const [setup, setSetup] = useState<RoundSetup | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [usedBankIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  function startRound() {
    const { setup, bankIndex } = generateRound(config.bank, config.optionCount, usedBankIndices);
    usedBankIndices.add(bankIndex);
    setSetup(setup);
    setPicked(null);
    setError('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function handlePick(option: string) {
    if (phase !== 'playing' || !setup) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    setPicked(option);
    const isCorrect = option === setup.analogy.correct;
    setRoundData((prev) => [...prev, { setup, picked: option, isCorrect, timeTakenSeconds: timeTaken }]);
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
              activityKey: 'analogies',
              moduleKey,
              difficultyLevel: difficulty,
              contentVariant: 'abstract',
              isCorrect: r.isCorrect,
              accuracyPercent: r.isCorrect ? 100 : 0,
              timeTakenSeconds: r.timeTakenSeconds,
              expectedTimeSeconds: config.expectedTimeSeconds,
              confidence: opt.confidence,
              reflection: opt.reflection,
              answerJson: { picked: r.picked, analogy: `${r.setup.analogy.a}:${r.setup.analogy.b}::${r.setup.analogy.c}:?` },
              correctAnswerJson: { correct: r.setup.analogy.correct, relationship: r.setup.analogy.relationship },
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
    usedBankIndices.clear();
    setError('');
    setPhase('instruction');
  }

  const lastRoundData = roundData[roundData.length - 1];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgScore =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) : 0;

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href={`/brain/${moduleKey}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Exit
          </Link>
          {phase !== 'instruction' && phase !== 'summary' && phase !== 'submitting' && (
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">
              Round {round} / {TOTAL_ROUNDS}
            </p>
          )}
          <div className="w-12" />
        </div>

        {phase === 'instruction' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">
              🔗
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Analogies</h1>
            <p className="text-orange-600 text-xs font-semibold mb-3">A Thinking game · {TOTAL_ROUNDS} rounds</p>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${DIFFICULTY_BADGE_BG[difficulty]}`}>
              {DIFFICULTY_LABEL[difficulty]} mode · {config.bank} word pairs
            </span>
            {adaptiveSource && (
              <AdaptiveBanner source={adaptiveSource} current={difficulty} previous={previousLevel} />
            )}
            <ol className="text-left text-sm text-gray-600 space-y-2 mb-5">
              <li><strong className="text-gray-800">1.</strong> You see two pairs: <em>A is to B</em></li>
              <li><strong className="text-gray-800">2.</strong> Find what completes <em>C is to ?</em></li>
              <li><strong className="text-gray-800">3.</strong> The relationship is the same on both sides</li>
            </ol>
            <div className="bg-orange-50 rounded-lg p-3 mb-5 text-xs text-gray-700 text-left">
              <p className="font-semibold mb-1">Example:</p>
              <p className="font-mono text-sm">Dog : Puppy :: Cat : ?</p>
              <p className="mt-1 text-[11px] text-gray-500">Answer: <strong>Kitten</strong> (animal → baby)</p>
            </div>
            <button
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors shadow-md"
            >
              Start round 1
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
            <p className="text-[11px] text-gray-400 mt-3">Hi {childName} — what&apos;s the link?</p>
          </div>
        )}

        {phase === 'playing' && setup && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-center text-sm font-semibold text-gray-600 mb-5">
              What completes the pattern?
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
              <div className="flex items-center justify-center gap-2 flex-wrap text-base sm:text-lg font-bold text-gray-800">
                <span className="text-orange-700">{setup.analogy.a}</span>
                <span className="text-gray-400">:</span>
                <span className="text-orange-700">{setup.analogy.b}</span>
                <span className="text-gray-500 mx-1">::</span>
                <span className="text-orange-700">{setup.analogy.c}</span>
                <span className="text-gray-400">:</span>
                <span className="text-orange-400 text-2xl">?</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mb-3">Pick the answer</p>
            <div className="grid grid-cols-2 gap-3">
              {setup.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePick(opt)}
                  className="rounded-xl bg-gray-50 hover:bg-orange-50 hover:scale-[1.03] active:scale-95 border-2 border-gray-100 hover:border-orange-300 py-4 px-2 text-base font-bold text-gray-800 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'roundResult' && lastRoundData && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${lastRoundData.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {lastRoundData.isCorrect ? '✓' : '○'}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {lastRoundData.isCorrect ? 'Got it!' : 'Not quite'}
            </h2>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">The analogy</p>
              <p className="font-mono text-base mb-2">
                <span className="text-gray-800">{lastRoundData.setup.analogy.a}</span>
                <span className="text-gray-400"> : </span>
                <span className="text-gray-800">{lastRoundData.setup.analogy.b}</span>
                <span className="text-gray-500"> :: </span>
                <span className="text-gray-800">{lastRoundData.setup.analogy.c}</span>
                <span className="text-gray-400"> : </span>
                <span className="text-green-700 font-bold">{lastRoundData.setup.analogy.correct}</span>
              </p>
              {lastRoundData.setup.analogy.relationship && (
                <p className="text-xs text-gray-600 italic">{lastRoundData.setup.analogy.relationship}</p>
              )}
              {!lastRoundData.isCorrect && (
                <p className="text-xs text-gray-500 mt-2">
                  You picked <strong>{lastRoundData.picked}</strong>
                </p>
              )}
            </div>
            <button
              onClick={advanceFromRoundResult}
              className="inline-flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-base transition-colors"
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
                    className="bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl p-4 text-center transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-500 shadow-md flex items-center justify-center mb-1">
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
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Saving your results…</p>
            <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
          </div>
        )}

        {phase === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">All done!</h2>
            <p className="text-sm text-gray-500 mb-4">{childName} got {correctCount} out of {TOTAL_ROUNDS} correct</p>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Average score</p>
              <p className="text-3xl font-bold text-orange-700">{avgScore}</p>
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
                      <span className="text-xs font-bold text-orange-600">{r.finalScore}/100</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{r.insightTitle}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{r.insightMessage}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button onClick={handleRestart} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Play again</button>
              <button onClick={() => router.push(`/brain/${moduleKey}`)} className="w-full text-orange-600 hover:bg-orange-50 font-semibold py-2 rounded-xl text-sm transition-colors">Back to Thinking module</button>
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
