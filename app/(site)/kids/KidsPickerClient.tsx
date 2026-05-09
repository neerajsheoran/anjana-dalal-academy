'use client';

// Client-side picker for /kids. Handles PIN entry modal and switching profiles.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChildLite {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
}

const AGE_GROUP_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  'early-builder': 'Early Builder',
  'skill-builder': 'Skill Builder',
  'advanced-thinker': 'Advanced Thinker',
};

export default function KidsPickerClient({
  children,
  hasPin,
}: {
  children: ChildLite[];
  hasPin: boolean;
}) {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<ChildLite | null>(null);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function pickChild(child: ChildLite) {
    setError('');
    setPin('');
    if (hasPin) {
      // Open PIN modal
      setSelectedChild(child);
    } else {
      // No PIN set yet — switch immediately
      submitSwitch(child.id, '');
    }
  }

  async function submitSwitch(childId: string, pinValue: string) {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/children/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, pin: pinValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to switch profile');
      }
      // Success — go straight to the brain screen (where training happens).
      router.push('/brain');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChild) return;
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }
    submitSwitch(selectedChild.id, pin);
  }

  function closePinModal() {
    setSelectedChild(null);
    setPin('');
    setError('');
  }

  // Empty state — no children added yet
  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
          🧠
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">No children added yet</h2>
        <p className="text-sm text-gray-500 mb-6">
          Add your first child profile to start brain training
        </p>
        <Link
          href="/profile"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Go to Profile to add a child
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => pickChild(child)}
            disabled={submitting}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 p-6 text-center transition-all hover:scale-105 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-3 shadow-md">
              {child.name[0]?.toUpperCase() || '?'}
            </div>
            <p className="font-bold text-gray-800 mb-0.5">{child.name}</p>
            <p className="text-xs text-gray-400">
              Age {child.age} · {AGE_GROUP_LABEL[child.ageGroup] || child.ageGroup}
            </p>
          </button>
        ))}

        {/* Stay in parent mode */}
        <Link
          href="/"
          className="bg-gray-50 rounded-2xl shadow-sm hover:shadow-md border border-dashed border-gray-300 p-6 text-center transition-all hover:border-gray-400"
        >
          <div className="w-20 h-20 rounded-full bg-gray-200 text-gray-500 text-3xl flex items-center justify-center mx-auto mb-3">
            👤
          </div>
          <p className="font-bold text-gray-700 mb-0.5">Parent Mode</p>
          <p className="text-xs text-gray-400">Stay logged in as parent</p>
        </Link>
      </div>

      {/* PIN modal */}
      {selectedChild && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={closePinModal}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handlePinSubmit}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                {selectedChild.name[0]?.toUpperCase() || '?'}
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Switch to {selectedChild.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your 4-digit Parent PIN
              </p>
            </div>

            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••"
              maxLength={4}
              required
            />

            {error && (
              <p className="text-red-500 text-xs text-center mt-2">{error}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={closePinModal}
                disabled={submitting}
                className="flex-1 py-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || pin.length !== 4}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Switching…' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
