// Bigger, more visible back link used across every brain page.
// Decided 2026-06-12: the previous "< Brain" looked like a tiny link;
// kids missed it. This renders as a chunky labeled button.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 shadow-sm transition-all mb-5"
    >
      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
