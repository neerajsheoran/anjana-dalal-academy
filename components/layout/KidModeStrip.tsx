// Persistent strip shown below the header whenever a child profile is active.
// Replaces the cramped header pill — full-width, sticky, hard to miss on mobile.
//
// Renders nothing in parent mode (no active child).

import Link from 'next/link';
import { getActiveChild } from '@/lib/active-child';

export default async function KidModeStrip() {
  const activeChild = await getActiveChild();
  if (!activeChild) return null;

  return (
    <div className="sticky top-0 z-30">
      <Link
        href="/kids"
        className="block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors shadow-sm"
        title="Switch profile or stay in parent mode"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-sm text-white text-sm font-bold flex items-center justify-center shrink-0 ring-2 ring-white/30">
            {activeChild.name[0]?.toUpperCase() || '?'}
          </span>
          <span className="text-sm text-white flex-1 min-w-0 truncate">
            Training as <strong>{activeChild.name}</strong>
          </span>
          <span className="text-xs font-semibold text-white/90 bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full shrink-0 transition-colors">
            Switch →
          </span>
        </div>
      </Link>
    </div>
  );
}
