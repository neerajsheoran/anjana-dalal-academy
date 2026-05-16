// Activated-parent chooser. Shown on `/` when the parent is logged in and has
// at least one child profile (state 3). Replaces the marketing hero with a
// utility-first 2-card (currently) chooser:
//   • Brain Training
//   • School Practice
//
// Future-proofing: the grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`,
// so dropping in a 3rd / 4th / 5th option later requires only an extra <Link>
// — no layout work. Keep the card shape consistent: icon block, title, one-line
// description, primary CTA. Card accent colors stay restrained on the
// parent-mode palette (no rainbow gradients — that's kid-mode).

import Link from 'next/link';
import { ArrowRight, Brain, BookOpen, LayoutDashboard } from 'lucide-react';

interface ChooserCard {
  href: string;
  icon: typeof Brain;
  iconBg: string;    // very light tint behind the icon (parent palette)
  iconBorder: string;
  iconColor: string;
  title: string;
  description: string;
  ctaLabel: string;
}

const CARDS: ChooserCard[] = [
  {
    href: '/kids',
    icon: Brain,
    iconBg: 'bg-purple-50',
    iconBorder: 'border-purple-100',
    iconColor: 'text-purple-600',
    title: 'Brain Training',
    description: 'Memory, Focus, and Thinking games. Pick a profile to start a session.',
    ctaLabel: 'Start training',
  },
  {
    href: '/learn',
    icon: BookOpen,
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100',
    iconColor: 'text-brand',
    title: 'School Practice',
    description: 'Class 1–10 Maths and Science. Browse by class, subject, or take a quiz.',
    ctaLabel: 'Explore',
  },
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconColor: 'text-amber-700',
    title: 'Parent Dashboard',
    description: 'See your kids’ brain-training progress, scores, and insights.',
    ctaLabel: 'Open dashboard',
  },
];

export default function ParentChooser({ firstName }: { firstName: string }) {
  return (
    <section className="bg-white py-12 px-6 border-b border-cool-line">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-8">
          <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2">
            How would you like to start?
          </h1>
          <p className="text-sm text-ink-soft">
            Pick a path to dive in — you can switch any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white border border-cool-line hover:border-brand hover:shadow-md rounded-2xl p-6 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center mb-4 ${card.iconBg} ${card.iconBorder}`}
                >
                  <Icon className={`w-7 h-7 ${card.iconColor}`} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-ink mb-1">{card.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-5">
                  {card.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-brand font-semibold text-sm group-hover:gap-2 transition-all">
                  {card.ctaLabel}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
