// Internal activities reference — hidden route, not linked from anywhere.
// Shows every brain activity in one screen with name, pillar, age range,
// mechanic, status, and a direct "Play" link. Useful for QA passes (test
// every activity without navigating three module pages) and as a quick
// map for future development sessions.
//
// To remove: delete this folder. Nothing else references it.

import Link from "next/link";
import {
  Brain,
  Target,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { BRAIN_ACTIVITIES, type ModuleKey } from "@/lib/brain-modules";

// One-line mechanic blurbs for quick orientation. Kept here (not in
// brain-modules.ts) because they're for internal reference only — kid-
// facing copy lives inside each activity component.
const MECHANIC: Record<string, string> = {
  "pattern-recall":
    "N×N grid — memorize K highlighted cells, recall their positions",
  "find-the-object":
    "N×N grid of distinct emoji animals — tap the named target",
  "pattern-logic":
    "Lucide icon+color sequences (ABAB / AABAAB / ABCABC), pick next",
  "number-recall":
    "Digit sequence shown briefly, type back via numpad",
  "number-sequence":
    "Arithmetic / geometric / mixed (Fibonacci, n²), pick the next number",
  "spot-the-difference":
    "Two icon grids side-by-side — tap cells on right that differ from left",
  "stroop-task":
    "Color word in different ink color — tap the INK color (inhibition)",
  "color-sequence":
    "4 quadrants flash in sequence (Simon Says), reproduce the order",
  "tap-back":
    "Cells light up in sequence on a grid — tap them back in order (Corsi)",
  "odd-one-out":
    "4 icons shown — pick the one from a different category",
  "analogies":
    "A : B :: C : ? word puzzles, pick the correct completion",
  "whack-a-target":
    "Timed game — tap target Star, avoid distractors (sustained attention)",
  "mini-sudoku":
    "4×4 Sudoku — fill empty cells with 1-4 satisfying row/col/box rules",
  "memory-match":
    "Flip-and-pair cards — match all pairs in fewest moves (recognition)",
};

const PILLAR_META: Record<
  ModuleKey,
  { label: string; icon: typeof Brain; bg: string; ring: string; text: string }
> = {
  memory: {
    label: "Memory",
    icon: Brain,
    bg: "bg-purple-50",
    ring: "ring-purple-200",
    text: "text-purple-700",
  },
  focus: {
    label: "Focus",
    icon: Target,
    bg: "bg-green-50",
    ring: "ring-green-200",
    text: "text-green-700",
  },
  thinking: {
    label: "Thinking",
    icon: Lightbulb,
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    text: "text-orange-700",
  },
};

export default function ActivitiesReferencePage() {
  const all = Object.values(BRAIN_ACTIVITIES);
  const byPillar: Record<ModuleKey, typeof all> = {
    memory: all.filter((a) => a.module === "memory"),
    focus: all.filter((a) => a.module === "focus"),
    thinking: all.filter((a) => a.module === "thinking"),
  };

  const total = all.length;
  const liveCount = all.filter((a) => a.available).length;

  return (
    <main className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-light mb-1">
            Internal reference · /design/activities
          </p>
          <h1 className="text-3xl font-bold text-ink mb-2">
            Brain activities catalog
          </h1>
          <p className="text-sm text-ink-soft">
            {liveCount} of {total} activities live ·{" "}
            {byPillar.memory.length} Memory · {byPillar.focus.length} Focus ·{" "}
            {byPillar.thinking.length} Thinking. Click <em>Play</em> to launch
            directly (requires an active child cookie — if missing, you&apos;ll
            be sent to <code className="text-xs">/kids</code> first).
          </p>
        </header>

        {(["memory", "focus", "thinking"] as const).map((pillar) => {
          const meta = PILLAR_META[pillar];
          const Icon = meta.icon;
          const activities = byPillar[pillar].sort(
            (a, b) => a.minAge - b.minAge,
          );
          return (
            <section key={pillar} className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-lg ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${meta.text}`} strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-ink">
                  {meta.label}{" "}
                  <span className="text-sm font-normal text-ink-light">
                    ({activities.length} activities)
                  </span>
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {activities.map((a) => (
                  <div
                    key={a.key}
                    className={`bg-white rounded-xl ring-1 ${meta.ring} p-4 flex flex-col gap-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-ink leading-tight">
                          {a.name}
                        </h3>
                        <p className="text-[11px] text-ink-light mt-0.5">
                          {a.skill}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            a.available
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {a.available ? (
                            <CheckCircle2
                              className="w-3 h-3"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <XCircle className="w-3 h-3" strokeWidth={2.5} />
                          )}
                          {a.available ? "Live" : "Coming soon"}
                        </span>
                        <span className="text-[10px] font-semibold text-ink-light">
                          Age {a.minAge}–{a.maxAge}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      {MECHANIC[a.key] || "—"}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <code className="text-[10px] text-ink-light">
                        {a.key}
                      </code>
                      {a.available && (
                        <Link
                          href={`/brain/${a.module}/${a.key}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
                        >
                          Play
                          <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <footer className="text-[11px] text-ink-light border-t border-cool-line pt-4 mt-8">
          Reads from{" "}
          <code className="text-ink-soft">BRAIN_ACTIVITIES</code> in{" "}
          <code className="text-ink-soft">lib/brain-modules.ts</code>. New
          activities appear automatically once registered there.
        </footer>
      </div>
    </main>
  );
}
