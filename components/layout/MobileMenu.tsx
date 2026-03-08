'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

type User = {
  name: string;
  email: string;
  initial: string;
  role: string;
} | null;

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/classes', label: 'Browse by Class' },
  { href: '/subjects', label: 'Browse by Subject' },
  { href: '/quiz-start', label: 'Quiz & Revision' },
];

export default function MobileMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close menu on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      {/* Desktop layout (sm+) — same as before */}
      <div className="hidden sm:flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.initial}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
              </div>
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                Admin
              </Link>
            )}
            <div className="w-px h-8 bg-gray-200" />
            <LogoutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile layout (<sm) — hamburger */}
      <div className="sm:hidden" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Menu"
        >
          {open ? (
            // X icon
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            {/* User info */}
            {user && (
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {user.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="py-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-6 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/profile"
                  className={`block px-6 py-3 text-sm font-medium transition-colors ${
                    pathname === '/profile'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  My Profile
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`block px-6 py-3 text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>

            {/* Auth action */}
            <div className="px-6 py-4 border-t border-gray-100">
              {user ? (
                <LogoutButton />
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
