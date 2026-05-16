// Shared reflection options for the end-of-session picker. All 8 activities
// import this so the 4 buttons (Felt easy / Felt tricky / I rushed / I
// guessed) stay consistent. The per-pillar hover/border colors live in
// each activity's JSX since they vary (purple for Memory, green for Focus,
// orange for Thinking).

import { Smile, Brain, Zap, Dices, type LucideIcon } from "lucide-react";

export interface ReflectionOption {
  key: "felt-easy" | "felt-tricky" | "rushed" | "guessed";
  label: string;
  icon: LucideIcon;
  confidence: "low" | "medium" | "high";
  reflection: "understood" | "looked-carefully" | "guessed" | "distracted";
}

export const REFLECTION_OPTIONS: ReflectionOption[] = [
  {
    key: "felt-easy",
    label: "Felt easy",
    icon: Smile,
    confidence: "high",
    reflection: "understood",
  },
  {
    key: "felt-tricky",
    label: "Felt tricky",
    icon: Brain,
    confidence: "medium",
    reflection: "looked-carefully",
  },
  {
    key: "rushed",
    label: "I rushed",
    icon: Zap,
    confidence: "medium",
    reflection: "distracted",
  },
  {
    key: "guessed",
    label: "I guessed",
    icon: Dices,
    confidence: "low",
    reflection: "guessed",
  },
];
