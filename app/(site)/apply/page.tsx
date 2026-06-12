// /apply — landing for the Apply pillar (DIYs, project worksheets,
// project kits). Placeholder catalog 2026-06-12: we surface a few
// curated DIY cards lifted from the Apply What You Have Learned blocks
// inside Class 6-8 Science chapters. Future phases:
//   Phase 2: paid printable worksheets per project
//   Phase 3: physical project kits with materials shipped to home
//
// Reachable without signin so anonymous users can browse what's there.

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";

// Curated free DIY preview pulled from chapters we've already written.
// Each links to the chapter's Concepts tab where the full Apply block
// (materials, steps, "show what you found", reflection) lives.
const FEATURED_DIYS: {
  title: string;
  blurb: string;
  classLabel: string;
  time: string;
  href: string;
  emoji: string;
  tag?: string;
}[] = [
  {
    title: "The Wonder Notebook",
    blurb:
      "Five minutes a day for a week — write one thing you noticed but didn't understand. Two guesses each. Pick a favourite and look up the real answer.",
    classLabel: "Class 6 Science · Ch 1",
    time: "5 min/day · 1 week",
    href: "/class/class-6/science/chapter-1-the-wonderful-world-of-science",
    emoji: "📓",
    tag: "Free",
  },
  {
    title: "Backyard Biodiversity Walk",
    blurb:
      "Walk 200 m around your home and count how many different plants, birds, and insects you can spot. Sketch the three most interesting.",
    classLabel: "Class 6 Science · Ch 2",
    time: "30 min",
    href: "/class/class-6/science/chapter-2-diversity-in-the-living-world",
    emoji: "🌿",
    tag: "Free",
  },
  {
    title: "School Bag Magnet Hunt",
    blurb:
      "Take a magnet to your school bag. Which items stick, which don't? Sort them into two piles and try to figure out the pattern.",
    classLabel: "Class 6 Science · Ch 4",
    time: "20 min",
    href: "/class/class-6/science/chapter-4-exploring-magnets",
    emoji: "🧲",
    tag: "Free",
  },
  {
    title: "Make Your Own pH Indicator",
    blurb:
      "Boil red cabbage leaves to make a purple solution. Test 6 kitchen liquids — see who turns it pink, blue, or green.",
    classLabel: "Class 7 Science · Ch 2",
    time: "30 min · mild mess",
    href: "/class/class-7/science/chapter-2-exploring-substances-acidic-basic-and-neutral",
    emoji: "🧪",
    tag: "Free",
  },
  {
    title: "Backyard Sundial",
    blurb:
      "Plant a straight stick in the ground at 9am. Mark the shadow every hour. Compare the marks the next day — what stays, what changes?",
    classLabel: "Class 8 Science · Ch 11",
    time: "1 full day",
    href: "/class/class-8/science/chapter-11-keeping-time-with-the-skies",
    emoji: "🌞",
    tag: "Free",
  },
  {
    title: "Pinhole Camera",
    blurb:
      "Make a closed shoebox with one pinhole, observe the inverted image of a bright window scene. Try different hole sizes.",
    classLabel: "Class 8 Science · Ch 10",
    time: "45 min",
    href: "/class/class-8/science/chapter-10-light-mirrors-and-lenses",
    emoji: "📷",
    tag: "Free",
  },
];

export default function ApplyLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm mb-6"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          Home
        </Link>

        <div className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">
            Apply
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
            Hands-on, made-at-home
          </h1>
          <p className="text-base text-gray-600">
            Curated science DIYs your kid can do with stuff from the kitchen.
            Print-ready worksheets and project kits coming soon.
          </p>
        </div>

        {/* DIY catalog — anonymous can browse, tap into a chapter to read
            the full activity. The chapter route applies the free-Ch1-2
            preview gate; deeper chapters require signup. */}
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURED_DIYS.map((d) => (
            <Link
              key={d.title}
              href={d.href}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all p-5 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">
                  {d.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-800 leading-snug">
                      {d.title}
                    </h3>
                    {d.tag && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {d.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{d.classLabel}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">{d.blurb}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.25} />
                  {d.time}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700 group-hover:text-amber-900">
                  Read & try
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming-soon teaser for paid products */}
        <div className="mt-10 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
          <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-2" strokeWidth={2.25} />
          <h2 className="text-lg font-bold text-amber-900 mb-1">
            Project worksheets + kits — coming soon
          </h2>
          <p className="text-sm text-amber-800 max-w-xl mx-auto">
            Printable step-by-step project workbooks for ₹49. Physical
            project kits with all materials shipped to your home for ₹399.
            Want early access? Drop your email — we&apos;ll tell you when the
            first batch ships.
          </p>
        </div>
      </div>
    </main>
  );
}
