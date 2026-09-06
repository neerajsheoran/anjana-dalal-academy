// Palette preview — hidden route, not linked from anywhere in the site.
// Renders representative parent-mode surfaces in BOTH the current palette
// and the proposed cream + blue professional palette so they can be compared
// side-by-side before committing to a full rebrand.
//
// To remove this preview entirely:
//   1. Delete this file (and the surrounding /design folder)
//   2. That's it — nothing else references it.

import {
  User,
  Lock,
  Users,
  CreditCard,
  History,
  Flame,
  Activity,
  Clock,
  RotateCcw,
  Trash2,
  KeyRound,
  Mail,
  UserPlus,
  Pencil,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  Bookmark,
} from "lucide-react";

// ── Proposed palette tokens — Option 1: white body, cream as ACCENT only ──
//
// The body and header are pure white (matching the existing site Header),
// so there's no seam between header and body. Cream (#FAF7F2) becomes a
// warm accent used inside specific sections / callout cards — not the
// page background. Pillar colors (purple/green/orange) stay as semantic
// indicators on charts and bars.
const PALETTE = {
  bgBody: "#FFFFFF",          // white — no seam with the white header
  bgCard: "#FFFFFF",          // white cards
  bgAccent: "#FAF7F2",        // CREAM — used inside accent sections / callouts only
  bgSection: "#F9F5EE",       // slightly deeper cream for section breaks
  borderWarm: "#E8E2D7",      // soft warm border (cards on cream)
  borderCool: "#E5E7EB",      // cool light border (cards on white)
  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  textTertiary: "#9CA3AF",
  brand: "#2563EB",
  brandHover: "#1D4ED8",
  memory: "#8B5CF6",
  focus: "#10B981",
  thinking: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export default function PalettePreviewPage() {
  return (
    <main
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: PALETTE.bgBody }}
    >
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: PALETTE.brand }}
          >
            Internal · Design Preview · Option 1
          </p>
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{ color: PALETTE.textPrimary }}
          >
            White body + cream accents
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: PALETTE.textSecondary }}
          >
            Page body and header are both pure white — <strong>no seam</strong>{" "}
            between the existing site header and the content below.
            Cream (<code>#FAF7F2</code>) appears only inside select cards and
            section breaks as a warm accent. Kid-mode surfaces are not affected.
            To remove: delete <code>app/(site)/design/</code>.
          </p>
        </div>

        {/* Palette swatches */}
        <Section title="Proposed palette swatches">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <Swatch hex={PALETTE.bgBody} label="Body / Card" />
            <Swatch hex={PALETTE.bgAccent} label="Cream accent" />
            <Swatch hex={PALETTE.bgSection} label="Section break" />
            <Swatch hex={PALETTE.borderCool} label="Border (cool)" />
            <Swatch hex={PALETTE.borderWarm} label="Border (warm)" />
            <Swatch hex={PALETTE.textPrimary} label="Ink" dark />
            <Swatch hex={PALETTE.textSecondary} label="Soft ink" dark />
            <Swatch hex={PALETTE.textTertiary} label="Light ink" />
            <Swatch hex={PALETTE.brand} label="Brand blue" dark />
            <Swatch hex={PALETTE.brandHover} label="Blue hover" dark />
            <Swatch hex={PALETTE.memory} label="Memory" dark />
            <Swatch hex={PALETTE.focus} label="Focus" dark />
            <Swatch hex={PALETTE.thinking} label="Thinking" dark />
            <Swatch hex={PALETTE.success} label="Success" dark />
            <Swatch hex={PALETTE.warning} label="Warning" dark />
            <Swatch hex={PALETTE.error} label="Error" dark />
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: PALETTE.textSecondary }}
          >
            Body and cards are pure white. Cream (<code>#FAF7F2</code>) is used
            sparingly — inside callout cards, "How it works" section, hero
            outcome promise — to add warmth where it adds value. Two border
            tones: cool gray when bordering white, warm beige when bordering
            cream.
          </p>
        </Section>

        {/* 1. Marketing hero */}
        <CompareBlock
          title="1. Marketing hero (logged-out)"
          currentLabel="Current — heavy gradient + multiple accent colors"
          proposedLabel="Proposed — cream background, single blue accent"
          current={<CurrentMarketingHero />}
          proposed={<ProposedMarketingHero />}
        />

        {/* 2. Parent setup hero */}
        <CompareBlock
          title="2. Parent setup hero (logged-in, no kids)"
          currentLabel="Current — purple glass card on dark gradient"
          proposedLabel="Proposed — white card on cream, blue CTA"
          current={<CurrentSetupHero />}
          proposed={<ProposedSetupHero />}
        />

        {/* 3. Bridge to school */}
        <CompareBlock
          title="3. Bridge to school card"
          currentLabel="Current — blue-50 to indigo-50 tint, blue button"
          proposedLabel="Proposed — white card on cream, prominent blue CTA"
          current={<CurrentBridgeCard />}
          proposed={<ProposedBridgeCard />}
        />

        {/* 4. /profile dashboard shortcut */}
        <CompareBlock
          title="4. Dashboard shortcut on /profile"
          currentLabel="Current — purple-to-pink gradient"
          proposedLabel="Proposed — white card with blue icon block, no gradient"
          current={<CurrentProfileShortcut />}
          proposed={<ProposedProfileShortcut />}
        />

        {/* 5. Dashboard pillar card */}
        <CompareBlock
          title="5. Dashboard pillar score card"
          currentLabel="Current — full pillar tint as card background"
          proposedLabel="Proposed — white card, pillar color only on the bar + dot"
          current={<CurrentPillarCard />}
          proposed={<ProposedPillarCard />}
        />

        {/* 6. Insight card */}
        <CompareBlock
          title="6. Dashboard insight card"
          currentLabel="Current — gray-50 background, emoji left"
          proposedLabel="Proposed — cream subtle background, refined typography"
          current={<CurrentInsightCard />}
          proposed={<ProposedInsightCard />}
        />

        {/* 7. CTA buttons */}
        <CompareBlock
          title="7. Primary CTA buttons"
          currentLabel="Current — mix of blue, purple, white-on-gradient"
          proposedLabel="Proposed — one solid blue everywhere, white-with-border for secondary"
          current={<CurrentButtons />}
          proposed={<ProposedButtons />}
        />

        {/* ───────── Icon preview (Lucide React) ───────── */}
        <div
          className="mt-14 mb-6 pt-8"
          style={{ borderTop: `1px solid ${PALETTE.borderCool}` }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: PALETTE.brand }}
          >
            Icon Preview · Lucide React
          </p>
          <h2
            className="text-2xl font-extrabold mb-2"
            style={{ color: PALETTE.textPrimary }}
          >
            Same components — with real icons swapped in
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: PALETTE.textSecondary }}
          >
            Lucide React is installed. These mockups show how Phase 1 surfaces
            would look once we apply the icon pass on top of the Option-1
            palette. Emojis on kid-mode surfaces (pillar mascots, insight
            celebrations) stay as-is — they&rsquo;re intentional.
          </p>
        </div>

        {/* I. Profile section headings */}
        <CompareBlock
          title="I. /profile section headings"
          currentLabel="Today — small uppercase title, no visual anchor"
          proposedLabel="With icons — each section gets a leading Lucide icon for scan-ability"
          current={<CurrentProfileSections />}
          proposed={<ProposedProfileSections />}
        />

        {/* II. Dashboard stats strip */}
        <CompareBlock
          title="II. Dashboard top stats strip"
          currentLabel="Today — emoji-led (🔥 📊 ⏱)"
          proposedLabel="With icons — Flame / Activity / Clock for brand-tintable consistency"
          current={<CurrentDashboardStats />}
          proposed={<ProposedDashboardStats />}
        />

        {/* III. Action buttons */}
        <CompareBlock
          title="III. Action buttons (Reset / Remove / Edit)"
          currentLabel="Today — text-only buttons, scan-slow"
          proposedLabel="With icons — leading icon doubles affordance instantly"
          current={<CurrentActionButtons />}
          proposed={<ProposedActionButtons />}
        />

        {/* IV. Form fields */}
        <CompareBlock
          title="IV. Form fields (sign-in form)"
          currentLabel="Today — plain inputs, label-driven"
          proposedLabel="With icons — Mail / Lock leading-icon clarifies field type"
          current={<CurrentFormFields />}
          proposed={<ProposedFormFields />}
        />

        {/* V. Children list row */}
        <CompareBlock
          title="V. Children list row (/profile)"
          currentLabel="Today — initial avatar + text-link actions"
          proposedLabel="With icons — RotateCcw + Trash2 buttons read as actions immediately"
          current={<CurrentChildRow />}
          proposed={<ProposedChildRow />}
        />

        {/* VI. Dashboard shortcut card */}
        <CompareBlock
          title="VI. Dashboard shortcut card"
          currentLabel="Option-1 palette only — emoji icon block"
          proposedLabel="With icons — LayoutDashboard icon in the same cream block"
          current={<ProposedProfileShortcut />}
          proposed={<ProposedProfileShortcutWithIcon />}
        />

        {/* Icon usage notes */}
        <div
          className="mt-6 mb-8 rounded-2xl p-5 text-sm leading-relaxed"
          style={{
            backgroundColor: PALETTE.bgAccent,
            color: PALETTE.textSecondary,
            border: `1px solid ${PALETTE.borderWarm}`,
          }}
        >
          <p className="font-bold mb-2" style={{ color: PALETTE.textPrimary }}>
            Icon rules of thumb
          </p>
          <ul className="space-y-1 list-disc pl-5">
            <li>Use <strong>Lucide icons</strong> on parent / professional surfaces (navigation, sections, actions, forms, status)</li>
            <li>Keep <strong>emojis</strong> on kid surfaces, pillar mascots (🧠 🎯 💡), and insight celebrations (🔥 🚀 🌟 🎯 🌱) — they convey emotion, not just identity</li>
            <li>Standard size: <code>w-4 h-4</code> for inline-with-text, <code>w-5 h-5</code> for buttons, <code>w-6 h-6</code> for section headings</li>
            <li>Tint to text color for monotone, or brand blue for accent — never use multi-color icon variants</li>
            <li>Set <code>strokeWidth=&#123;2&#125;</code> for the default crisp look (Lucide&rsquo;s default 2 is already this)</li>
          </ul>
        </div>

        {/* Footer note */}
        <div
          className="mt-12 rounded-2xl p-6 text-sm leading-relaxed"
          style={{
            backgroundColor: PALETTE.bgAccent,
            color: PALETTE.textSecondary,
            border: `1px solid ${PALETTE.borderWarm}`,
          }}
        >
          <p className="font-bold mb-2" style={{ color: PALETTE.textPrimary }}>
            What stays unchanged
          </p>
          <ul className="space-y-1 list-disc pl-5">
            <li>Brain Screen with pulsing lobe glows — keeps current playful palette</li>
            <li>KidHomepage with gradient pillar tiles — kids&rsquo; surface, stays fun</li>
            <li>All 5 activity components (Pattern Recall, etc.) — playful by design</li>
            <li>Kid-mode strip (purple → pink) — acts as the boundary marker</li>
            <li>Pillar identity colors (purple Memory / green Focus / orange Thinking) — preserved as semantic indicators, just less dominant in chrome</li>
            <li>Existing white site Header — no longer clashes with the body, since the body is also white now</li>
          </ul>
        </div>

        <p
          className="text-xs text-center mt-8"
          style={{ color: PALETTE.textTertiary }}
        >
          Mockup only. No production surface has been modified by this file.
        </p>
      </div>
    </main>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-sm font-bold uppercase tracking-widest mb-3"
        style={{ color: PALETTE.textSecondary }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function CompareBlock({
  title,
  currentLabel,
  proposedLabel,
  current,
  proposed,
}: {
  title: string;
  currentLabel: string;
  proposedLabel: string;
  current: React.ReactNode;
  proposed: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2
        className="text-base font-bold mb-4"
        style={{ color: PALETTE.textPrimary }}
      >
        {title}
      </h2>

      <p
        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: PALETTE.textTertiary }}
      >
        Before — {currentLabel}
      </p>
      <div className="mb-5 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {current}
      </div>

      <p
        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: PALETTE.brand }}
      >
        After — {proposedLabel}
      </p>
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        {proposed}
      </div>
    </section>
  );
}

function Swatch({
  hex,
  label,
  dark = false,
}: {
  hex: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 text-[11px] font-medium"
      style={{
        backgroundColor: hex,
        color: dark ? "#FFFFFF" : PALETTE.textPrimary,
        border: `1px solid ${PALETTE.borderCool}`,
      }}
    >
      <div className="font-bold mb-0.5">{label}</div>
      <div className="font-mono opacity-80">{hex}</div>
    </div>
  );
}

/* ─────────────────────── CURRENT mockups ──────────────────────── */

function CurrentMarketingHero() {
  return (
    <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-white py-8 px-5">
      <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest mb-2">
        Brain Training for Kids 5–15
      </p>
      <h1 className="text-2xl font-extrabold mb-3 leading-tight">
        Train how your child thinks, not just what they learn.
      </h1>
      <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 mb-4 text-xs text-blue-50 font-medium">
        <span>✨</span>
        <span>10 minutes a day. Sharper focus and recall in 4 weeks.</span>
      </div>
      <div>
        <span className="inline-block bg-white text-blue-800 font-bold px-6 py-3 rounded-full text-sm shadow-xl">
          Try a brain game now →
        </span>
      </div>
    </div>
  );
}

function CurrentSetupHero() {
  return (
    <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-white p-6">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
        <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest mb-2">
          Welcome to CogniLift
        </p>
        <h2 className="text-xl font-extrabold mb-2 leading-tight">
          Hi Neeraj, ready to start?
        </h2>
        <p className="text-blue-100 text-xs mb-4 leading-relaxed">
          Add your child&rsquo;s profile to track their daily progress, get
          personalised insights, and unlock games matched to their age.
        </p>
        <span className="inline-block bg-white text-blue-800 font-bold px-5 py-2.5 rounded-full text-xs shadow">
          Add your child →
        </span>
      </div>
    </div>
  );
}

function CurrentBridgeCard() {
  return (
    <div className="bg-white p-5">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-1">
          Bridge to school
        </p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">How it helps in school</h2>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">
          Better thinking → better grades, naturally. Class 1–10 Science and Maths.
        </p>
        <span className="inline-block bg-blue-600 text-white font-semibold px-4 py-2 rounded-full text-xs">
          Explore →
        </span>
      </div>
    </div>
  );
}

function CurrentProfileShortcut() {
  return (
    <div className="bg-gray-50 p-5">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-md p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📊</div>
          <div className="flex-1 min-w-0 text-white">
            <p className="text-sm font-bold">Parent Dashboard</p>
            <p className="text-[11px] text-white/85">
              See your kids&rsquo; progress, scores, and insights
            </p>
          </div>
          <span className="text-xl text-white/80">→</span>
        </div>
      </div>
    </div>
  );
}

function CurrentPillarCard() {
  return (
    <div className="bg-white p-5">
      <div className="bg-purple-50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">🧠</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">Memory</p>
            <p className="text-[11px] text-gray-500">
              12 rounds <span className="ml-1 text-green-600">↑ trending up</span>
            </p>
          </div>
          <p className="text-lg font-bold text-gray-800">
            78<span className="text-xs text-gray-400">/100</span>
          </p>
        </div>
        <div className="h-1.5 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full" style={{ width: "78%" }} />
        </div>
      </div>
    </div>
  );
}

function CurrentInsightCard() {
  return (
    <div className="bg-white p-5">
      <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-3">
        <span className="text-2xl">🔥</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">4-day training week</p>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
            Trained on 4 different days this week. Habit forming nicely.
          </p>
        </div>
      </div>
    </div>
  );
}

function CurrentButtons() {
  return (
    <div className="bg-white p-5">
      <div className="flex flex-wrap gap-3">
        <span className="inline-block bg-blue-600 text-white font-bold px-5 py-2.5 rounded-full text-sm">
          Primary blue
        </span>
        <span className="inline-block bg-purple-600 text-white font-bold px-5 py-2.5 rounded-full text-sm">
          Purple variant
        </span>
        <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-5 py-2.5 rounded-full text-sm">
          Gradient
        </span>
        <span className="inline-block bg-white border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-full text-sm">
          Secondary
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────── PROPOSED mockups ─────────────────────── */

function ProposedMarketingHero() {
  // White hero — cream used only on the outcome promise pill to add warmth.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="py-10 px-5">
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: PALETTE.brand }}
      >
        Brain Training for Kids 5–15
      </p>
      <h1
        className="text-2xl font-extrabold mb-3 leading-tight"
        style={{ color: PALETTE.textPrimary }}
      >
        Train how your child thinks, not just what they learn.
      </h1>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mb-5 text-xs font-medium"
        style={{
          backgroundColor: PALETTE.bgAccent,
          color: PALETTE.textSecondary,
          border: `1px solid ${PALETTE.borderWarm}`,
        }}
      >
        <span>✨</span>
        <span>10 minutes a day. Sharper focus and recall in 4 weeks.</span>
      </div>
      <div>
        <span
          className="inline-block font-bold px-6 py-3 rounded-full text-sm shadow-sm"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          Try a brain game now →
        </span>
      </div>
    </div>
  );
}

function ProposedSetupHero() {
  // White surrounding, cream "welcome card" to add warmth to the first-touch
  // moment when a parent has just signed up and has no kids yet.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-6">
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: PALETTE.bgAccent,
          border: `1px solid ${PALETTE.borderWarm}`,
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: PALETTE.brand }}
        >
          Welcome to CogniLift
        </p>
        <h2
          className="text-xl font-extrabold mb-2 leading-tight"
          style={{ color: PALETTE.textPrimary }}
        >
          Hi Neeraj, ready to start?
        </h2>
        <p
          className="text-xs mb-4 leading-relaxed"
          style={{ color: PALETTE.textSecondary }}
        >
          Add your child&rsquo;s profile to track their daily progress, get
          personalised insights, and unlock games matched to their age.
        </p>
        <span
          className="inline-block font-bold px-5 py-2.5 rounded-full text-xs shadow-sm"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          Add your child →
        </span>
      </div>
    </div>
  );
}

function ProposedBridgeCard() {
  // White surface, white card with cool border + subtle shadow. Clean and
  // platform-y — doesn't need cream warmth here.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: PALETTE.brand }}
        >
          Bridge to school
        </p>
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: PALETTE.textPrimary }}
        >
          How it helps in school
        </h2>
        <p
          className="text-xs leading-relaxed mb-4"
          style={{ color: PALETTE.textSecondary }}
        >
          Better thinking → better grades, naturally. Class 1–10 Science and Maths.
        </p>
        <span
          className="inline-block font-semibold px-4 py-2 rounded-full text-xs"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          Explore →
        </span>
      </div>
    </div>
  );
}

function ProposedProfileShortcut() {
  // White card, cream icon block to give the dashboard CTA a touch of warmth
  // without going overboard.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              backgroundColor: PALETTE.bgAccent,
              color: PALETTE.brand,
              border: `1px solid ${PALETTE.borderWarm}`,
            }}
          >
            📊
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: PALETTE.textPrimary }}
            >
              Parent Dashboard
            </p>
            <p
              className="text-[11px]"
              style={{ color: PALETTE.textSecondary }}
            >
              See your kids&rsquo; progress, scores, and insights
            </p>
          </div>
          <span
            className="text-xl"
            style={{ color: PALETTE.textTertiary }}
          >
            →
          </span>
        </div>
      </div>
    </div>
  );
}

function ProposedPillarCard() {
  // White card with cool border. Pillar color appears ONLY in the icon tint
  // and the score bar — clean and informative, not loud.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${PALETTE.memory}15` }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: PALETTE.memory }}
            />
          </span>
          <div className="flex-1">
            <p
              className="text-sm font-bold"
              style={{ color: PALETTE.textPrimary }}
            >
              Memory
            </p>
            <p
              className="text-[11px]"
              style={{ color: PALETTE.textSecondary }}
            >
              12 rounds{" "}
              <span style={{ color: PALETTE.success }}>↑ trending up</span>
            </p>
          </div>
          <p
            className="text-lg font-bold"
            style={{ color: PALETTE.textPrimary }}
          >
            78
            <span
              className="text-xs"
              style={{ color: PALETTE.textTertiary }}
            >
              /100
            </span>
          </p>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: "78%", backgroundColor: PALETTE.memory }}
          />
        </div>
      </div>
    </div>
  );
}

function ProposedInsightCard() {
  // Cream-accent callout — this is where the cream shines: insight cards
  // feel like a friendly highlighted note on an otherwise white dashboard.
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="rounded-xl p-3 flex items-start gap-3"
        style={{
          backgroundColor: PALETTE.bgAccent,
          border: `1px solid ${PALETTE.borderWarm}`,
        }}
      >
        <span className="text-2xl">🔥</span>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{ color: PALETTE.textPrimary }}
          >
            4-day training week
          </p>
          <p
            className="text-[11px] leading-relaxed mt-0.5"
            style={{ color: PALETTE.textSecondary }}
          >
            Trained on 4 different days this week. Habit forming nicely.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProposedButtons() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div className="flex flex-wrap gap-3 items-center">
        <span
          className="inline-block font-bold px-5 py-2.5 rounded-full text-sm shadow-sm"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          Primary
        </span>
        <span
          className="inline-block font-semibold px-5 py-2.5 rounded-full text-sm"
          style={{
            backgroundColor: PALETTE.bgCard,
            color: PALETTE.textPrimary,
            border: `1px solid ${PALETTE.borderCool}`,
          }}
        >
          Secondary
        </span>
        <span
          className="inline-block font-semibold px-5 py-2.5 rounded-full text-sm"
          style={{ color: PALETTE.brand }}
        >
          Tertiary / link
        </span>
        <span
          className="inline-block font-bold px-5 py-2.5 rounded-full text-sm shadow-sm"
          style={{ backgroundColor: PALETTE.error, color: "#FFFFFF" }}
        >
          Destructive
        </span>
      </div>
      <p
        className="text-[11px] mt-3"
        style={{ color: PALETTE.textTertiary }}
      >
        One blue everywhere, no gradients on parent surfaces.
      </p>
    </div>
  );
}

/* ──────────────── Icon preview mockups ──────────────── */

// I. /profile section headings ─────────────────────────────────

function SectionHeading({
  title,
  withIcon = false,
  icon: Icon,
}: {
  title: string;
  withIcon?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {withIcon && Icon && (
        <Icon
          className="w-5 h-5"
          style={{ color: PALETTE.brand }}
          strokeWidth={2}
        />
      )}
      <h3
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: PALETTE.textTertiary }}
      >
        {title}
      </h3>
    </div>
  );
}

function CurrentProfileSections() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5 space-y-4">
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Account Details" />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          neeraj@example.com · member since May 2026
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Parent PIN" />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          PIN is active
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Your Children" />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          Kavya · Aanya
        </p>
      </div>
    </div>
  );
}

function ProposedProfileSections() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5 space-y-4">
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Account Details" withIcon icon={User} />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          neeraj@example.com · member since May 2026
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Parent PIN" withIcon icon={Lock} />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          PIN is active
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Your Children" withIcon icon={Users} />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          Kavya · Aanya
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Subscription" withIcon icon={CreditCard} />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          Free trial · 12 days left
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${PALETTE.borderCool}` }}
      >
        <SectionHeading title="Past Quizzes" withIcon icon={History} />
        <p className="text-xs" style={{ color: PALETTE.textSecondary }}>
          Hidden when empty
        </p>
      </div>
    </div>
  );
}

// II. Dashboard stats strip ────────────────────────────────────

function CurrentDashboardStats() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div className="grid grid-cols-3 gap-3">
        <StatBox emoji="🔥" value="4" label="days this week" />
        <StatBox emoji="📊" value="12" label="sessions" />
        <StatBox emoji="⏱" value="2 h ago" label="last played" small />
      </div>
    </div>
  );
}

function ProposedDashboardStats() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div className="grid grid-cols-3 gap-3">
        <StatBox icon={Flame} value="4" label="days this week" />
        <StatBox icon={Activity} value="12" label="sessions" />
        <StatBox icon={Clock} value="2 h ago" label="last played" small />
      </div>
    </div>
  );
}

function StatBox({
  emoji,
  icon: Icon,
  value,
  label,
  small = false,
}: {
  emoji?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  value: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center shadow-sm"
      style={{
        backgroundColor: PALETTE.bgCard,
        border: `1px solid ${PALETTE.borderCool}`,
      }}
    >
      <div className="flex items-center justify-center mb-1 h-6">
        {Icon && (
          <Icon
            className="w-5 h-5"
            style={{ color: PALETTE.brand }}
            strokeWidth={2}
          />
        )}
        {emoji && <span className="text-xl">{emoji}</span>}
      </div>
      <p
        className={`font-bold ${small ? "text-xs" : "text-lg"}`}
        style={{ color: PALETTE.textPrimary }}
      >
        {value}
      </p>
      <p
        className="text-[10px] uppercase tracking-wide leading-tight"
        style={{ color: PALETTE.textTertiary }}
      >
        {label}
      </p>
    </div>
  );
}

// III. Action buttons ──────────────────────────────────────────

function CurrentActionButtons() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div className="flex flex-wrap gap-2 items-center">
        <span
          className="inline-block px-3 py-1.5 rounded-md text-xs font-medium"
          style={{ color: PALETTE.warning }}
        >
          Reset
        </span>
        <span style={{ color: PALETTE.textTertiary }}>·</span>
        <span
          className="inline-block px-3 py-1.5 rounded-md text-xs font-medium"
          style={{ color: PALETTE.error }}
        >
          Remove
        </span>
        <span
          className="inline-block px-3 py-1.5 rounded-md text-xs font-medium ml-3"
          style={{ color: PALETTE.brand }}
        >
          Edit name
        </span>
        <span
          className="inline-block ml-3 font-semibold px-4 py-2 rounded-full text-xs"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          Set PIN
        </span>
      </div>
    </div>
  );
}

function ProposedActionButtons() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-50 transition-colors"
          style={{ color: PALETTE.warning }}
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
          Reset
        </button>
        <span style={{ color: PALETTE.textTertiary }}>·</span>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-50 transition-colors"
          style={{ color: PALETTE.error }}
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.25} />
          Remove
        </button>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ml-3 hover:bg-blue-50 transition-colors"
          style={{ color: PALETTE.brand }}
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2.25} />
          Edit name
        </button>
        <button
          className="inline-flex items-center gap-1.5 ml-3 font-semibold px-4 py-2 rounded-full text-xs shadow-sm"
          style={{ backgroundColor: PALETTE.brand, color: "#FFFFFF" }}
        >
          <KeyRound className="w-3.5 h-3.5" strokeWidth={2.5} />
          Set PIN
        </button>
      </div>
    </div>
  );
}

// IV. Form fields with leading icons ───────────────────────────

function CurrentFormFields() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5 max-w-sm">
      <div className="space-y-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: PALETTE.textPrimary }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="parent@example.com"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              border: `1px solid ${PALETTE.borderCool}`,
              backgroundColor: PALETTE.bgCard,
            }}
            readOnly
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: PALETTE.textPrimary }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              border: `1px solid ${PALETTE.borderCool}`,
              backgroundColor: PALETTE.bgCard,
            }}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

function ProposedFormFields() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5 max-w-sm">
      <div className="space-y-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: PALETTE.textPrimary }}
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: PALETTE.textTertiary }}
              strokeWidth={2}
            />
            <input
              type="email"
              placeholder="parent@example.com"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                border: `1px solid ${PALETTE.borderCool}`,
                backgroundColor: PALETTE.bgCard,
              }}
              readOnly
            />
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: PALETTE.textPrimary }}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: PALETTE.textTertiary }}
              strokeWidth={2}
            />
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                border: `1px solid ${PALETTE.borderCool}`,
                backgroundColor: PALETTE.bgCard,
              }}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// V. Children list row with action icons ───────────────────────

function CurrentChildRow() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: "linear-gradient(135deg, #c084fc, #f472b6)" }}
        >
          K
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{ color: PALETTE.textPrimary }}
          >
            Kavya
          </p>
          <p className="text-[11px]" style={{ color: PALETTE.textTertiary }}>
            Age 6 · Class 1 · Foundation
          </p>
        </div>
        <span
          className="text-xs font-medium px-2 py-1"
          style={{ color: PALETTE.warning }}
        >
          Reset
        </span>
        <span style={{ color: PALETTE.textTertiary }}>·</span>
        <span
          className="text-xs font-medium px-2 py-1"
          style={{ color: PALETTE.error }}
        >
          Remove
        </span>
      </div>
    </div>
  );
}

function ProposedChildRow() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: "linear-gradient(135deg, #c084fc, #f472b6)" }}
        >
          K
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{ color: PALETTE.textPrimary }}
          >
            Kavya
          </p>
          <p className="text-[11px]" style={{ color: PALETTE.textTertiary }}>
            Age 6 · Class 1 · Foundation
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-amber-50 transition-colors"
          style={{ color: PALETTE.warning }}
          aria-label="Reset Kavya's progress"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2.25} />
        </button>
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 transition-colors"
          style={{ color: PALETTE.error }}
          aria-label="Remove Kavya's profile"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

// VI. Dashboard shortcut with Lucide icon ──────────────────────

function ProposedProfileShortcutWithIcon() {
  return (
    <div style={{ backgroundColor: PALETTE.bgBody }} className="p-5">
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{
          backgroundColor: PALETTE.bgCard,
          border: `1px solid ${PALETTE.borderCool}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: PALETTE.bgAccent,
              border: `1px solid ${PALETTE.borderWarm}`,
            }}
          >
            <LayoutDashboard
              className="w-5 h-5"
              style={{ color: PALETTE.brand }}
              strokeWidth={2}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: PALETTE.textPrimary }}
            >
              Parent Dashboard
            </p>
            <p
              className="text-[11px]"
              style={{ color: PALETTE.textSecondary }}
            >
              See your kids&rsquo; progress, scores, and insights
            </p>
          </div>
          <ChevronRight
            className="w-5 h-5"
            style={{ color: PALETTE.textTertiary }}
            strokeWidth={2}
          />
        </div>
      </div>
    </div>
  );
}

// Currently unused but reserved for future preview blocks:
// - <TrendingUp /> on activity progression rows (best score indicator)
// - <UserPlus /> on "Add another child" buttons
// - <Bookmark /> on chapter bookmarks (replacing the hand-rolled SVG)
const _RESERVED_FOR_LATER = { TrendingUp, UserPlus, Bookmark };
