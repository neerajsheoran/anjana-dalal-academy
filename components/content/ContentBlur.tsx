'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ContentAccessLevel } from '@/lib/types';

interface ContentBlurProps {
  children: React.ReactNode;
  accessLevel: ContentAccessLevel;
  currentPath: string;
  chapterOrder?: number;
  maxHeight?: string;
}

export default function ContentBlur({
  children,
  accessLevel,
  currentPath,
  chapterOrder,
  maxHeight = '600px',
}: ContentBlurProps) {
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionLoading, setExtensionLoading] = useState(false);

  // Full access: trial, subscribed, or admin
  if (accessLevel === 'trial' || accessLevel === 'subscribed' || accessLevel === 'admin') {
    return <>{children}</>;
  }

  // Free chapters: first 2 chapters open for everyone
  if (chapterOrder && chapterOrder <= 2) {
    return <>{children}</>;
  }

  async function handleExtensionRequest() {
    setExtensionLoading(true);
    try {
      const res = await fetch('/api/extension-request', { method: 'POST' });
      if (res.ok) {
        setExtensionRequested(true);
      }
    } catch {
      // silently fail
    } finally {
      setExtensionLoading(false);
    }
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
            Chapters 1 and 2 of every subject remain free.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Subscribe Now
          </Link>
          {!extensionRequested ? (
            <div className="mt-4">
              <button
                onClick={handleExtensionRequest}
                disabled={extensionLoading}
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline transition-colors disabled:opacity-50"
              >
                {extensionLoading ? 'Sending request...' : 'Need more time? Request an extension'}
              </button>
            </div>
          ) : (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 max-w-sm mx-auto">
              <p className="text-sm text-green-700 font-medium">
                Extension request sent! We&apos;ll review it shortly.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Anonymous / not logged in CTA */
        <div className="relative -mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            This chapter is available with a free account
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            Sign up now — your first month is free, no payment needed.
            Chapters 1 and 2 are always free without an account.
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
