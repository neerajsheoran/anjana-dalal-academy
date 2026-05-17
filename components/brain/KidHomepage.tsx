// Personalized homepage shown when an active child profile is selected.
// Replaces the public marketing hero with a kid-focused dashboard:
// greeting, 3 pillar cards, optional class shortcut.
//
// Rendered from app/(site)/page.tsx based on getActiveChild().

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ActiveChild } from '@/lib/active-child';

const CLASS_LABEL: Record<string, string> = {
  'class-1': 'Class 1',
  'class-2': 'Class 2',
  'class-3': 'Class 3',
  'class-4': 'Class 4',
  'class-5': 'Class 5',
  'class-6': 'Class 6',
  'class-7': 'Class 7',
  'class-8': 'Class 8',
  'class-9': 'Class 9',
  'class-10': 'Class 10',
};

export default function KidHomepage({ child }: { child: ActiveChild }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <section className="max-w-md mx-auto px-5 pt-10 pb-12">

        {/* Greeting */}
        <div className="text-center mb-8">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-2">
            Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            Hi {child.name}! 👋
          </h1>
          <p className="text-blue-200 text-sm">
            What do you want to train today?
          </p>
        </div>

        {/* Big primary CTA: Train your brain */}
        <Link
          href="/brain"
          className="block bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-[0.98] rounded-3xl p-6 mb-4 shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shrink-0">
              🧠
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Brain training
              </p>
              <h2 className="text-xl font-bold mb-0.5">Train your brain</h2>
              <p className="text-white/80 text-xs">
                Memory · Focus · Thinking — pick a part to play
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/70" strokeWidth={2.5} />
          </div>
        </Link>

        {/* 3 pillar quick-tap cards (also go to /brain but kid sees what's inside) */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <Link
            href="/brain/memory"
            className="bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 border border-purple-300/40 rounded-2xl p-3 text-center transition-all"
          >
            <div className="text-3xl mb-1">🧠</div>
            <p className="text-purple-100 text-xs font-bold">Memory</p>
          </Link>
          <Link
            href="/brain/focus"
            className="bg-green-500/20 hover:bg-green-500/30 active:scale-95 border border-green-300/40 rounded-2xl p-3 text-center transition-all"
          >
            <div className="text-3xl mb-1">🎯</div>
            <p className="text-green-100 text-xs font-bold">Focus</p>
          </Link>
          <Link
            href="/brain/thinking"
            className="bg-orange-500/20 hover:bg-orange-500/30 active:scale-95 border border-orange-300/40 rounded-2xl p-3 text-center transition-all"
          >
            <div className="text-3xl mb-1">💡</div>
            <p className="text-orange-100 text-xs font-bold">Thinking</p>
          </Link>
        </div>

        {/* School cards. When the kid has a classId we surface BOTH:
              1. Their class (primary, 90% case)
              2. Explore all classes & subjects (browsing, 10% case)
            When no classId is set, only the Explore card shows. */}
        {child.classId && (
          <Link
            href={`/class/${child.classId}`}
            className="block bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-3 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/20 flex items-center justify-center text-2xl shrink-0">
                📚
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                  Your School Work
                </p>
                <h3 className="text-base font-bold">
                  {CLASS_LABEL[child.classId] || child.classId} practice
                </h3>
                <p className="text-blue-100/70 text-xs">
                  Maths and Science from your class
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" strokeWidth={2.5} />
            </div>
          </Link>
        )}

        {/* Explore card — always shown. Same visual weight as the School
            card above, distinct accent color so the two are easy to tell
            apart at a glance. Tappable for curiosity-driven browsing. */}
        <Link
          href="/learn"
          className="block bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-400/20 flex items-center justify-center text-2xl shrink-0">
              🧭
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-200 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                Explore
              </p>
              <h3 className="text-base font-bold">
                {child.classId
                  ? 'See other classes & subjects'
                  : 'Browse all classes & subjects'}
              </h3>
              <p className="text-emerald-100/70 text-xs">
                Peek at Maths and Science from any class, 1 to 10
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" strokeWidth={2.5} />
          </div>
        </Link>

        <p className="text-center text-[11px] text-blue-200/50 mt-6">
          Use the avatar at the top right to switch profiles
        </p>
      </section>
    </main>
  );
}
