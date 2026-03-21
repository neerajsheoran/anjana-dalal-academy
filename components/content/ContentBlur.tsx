'use client';

import Link from 'next/link';
import type { ContentAccessLevel } from '@/lib/types';

interface ContentBlurProps {
  children: React.ReactNode;
  accessLevel: ContentAccessLevel;
  currentPath: string;
  maxHeight?: string;
}

export default function ContentBlur({
  children,
  accessLevel,
  currentPath,
  maxHeight = '600px',
}: ContentBlurProps) {
  // Full access: trial, subscribed, or admin
  if (accessLevel === 'trial' || accessLevel === 'subscribed' || accessLevel === 'admin') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div style={{ maxHeight, overflow: 'hidden' }}>
        {children}
      </div>

      {/* Gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '200px',
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,1) 100%)',
        }}
      />

      {accessLevel === 'expired' ? (
        /* Expired trial CTA */
        <div className="relative -mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Your free trial has ended
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            Subscribe to continue accessing all chapters, worksheets, and quizzes.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            View Plans
          </Link>
        </div>
      ) : (
        /* Anonymous / not logged in CTA */
        <div className="relative -mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Sign up free to read the full chapter
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            Create a free account to unlock all notes, track your progress, and save quiz scores.
          </p>
          <Link
            href={`/login?from=${encodeURIComponent(currentPath)}`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Sign Up Free
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Already have an account?{' '}
            <Link
              href={`/login?from=${encodeURIComponent(currentPath)}`}
              className="text-blue-600 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
