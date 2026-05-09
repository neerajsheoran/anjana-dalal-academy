'use client';

// Profile section for managing child brain-training profiles.
// Per cognilift-privacy-consent.md: parent owns the account, kids never log in.

import { useEffect, useState } from 'react';

interface Child {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  createdAt: string | null;
}

const AGE_GROUP_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  'early-builder': 'Early Builder',
  'skill-builder': 'Skill Builder',
  'advanced-thinker': 'Advanced Thinker',
};

export default function ChildrenSection({ hasPinInitial }: { hasPinInitial: boolean }) {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [hasPin, setHasPin] = useState(hasPinInitial);

  // Add-form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [consent, setConsent] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/children');
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children || []);
      } else {
        setChildren([]);
      }
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName('');
    setAge('');
    setConsent(false);
    setPin('');
    setPinConfirm('');
    setError('');
    setShowAdd(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(age, 10);
    if (!name.trim()) return setError('Please enter a first name.');
    if (!Number.isInteger(ageNum) || ageNum < 5 || ageNum > 15) {
      return setError('Age must be a whole number between 5 and 15.');
    }
    if (!consent) return setError('Please confirm parental consent.');

    // PIN setup is required only when no PIN exists yet
    const needsPin = !hasPin;
    if (needsPin) {
      if (!/^\d{4}$/.test(pin)) return setError('PIN must be exactly 4 digits.');
      if (pin !== pinConfirm) return setError('PINs do not match.');
    }

    setSubmitting(true);
    try {
      // Set PIN first so child creation can't succeed without a PIN on first run
      if (needsPin) {
        const pinRes = await fetch('/api/children/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });
        if (!pinRes.ok) throw new Error('Failed to set PIN');
        setHasPin(true);
      }

      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), age: ageNum, consent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save profile');
      }

      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(child: Child) {
    const confirmed = window.confirm(
      `Remove ${child.name}'s profile? All their progress will be permanently deleted. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/children/${child.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await refresh();
    } catch {
      window.alert('Failed to remove profile. Please try again.');
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Your Children
      </h2>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && children !== null && children.length === 0 && !showAdd && (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-2xl mx-auto mb-3">
            🧠
          </div>
          <p className="text-sm text-gray-600 mb-1">No children added yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add your first child to start brain training
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Add your first child
          </button>
        </div>
      )}

      {!loading && children && children.length > 0 && (
        <>
          <div className="space-y-2 mb-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                  {child.name[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{child.name}</p>
                  <p className="text-xs text-gray-400">
                    Age {child.age} · {AGE_GROUP_LABEL[child.ageGroup] || child.ageGroup}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(child)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 transition-colors"
                  aria-label={`Remove ${child.name}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium text-sm py-2 rounded-lg transition-colors"
            >
              + Add another child
            </button>
          )}
        </>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 bg-purple-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              placeholder="e.g. Aanya"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={5}
              max={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              placeholder="5–15"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Must be between 5 and 15. Used to choose age-appropriate games.
            </p>
          </div>

          {!hasPin && (
            <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2">
              <p className="text-xs font-semibold text-purple-700">
                Set a 4-digit Parent PIN
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Used when switching to a child profile. Prevents your child from
                changing settings or accessing payment screens.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="4-digit PIN"
                required
                maxLength={4}
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm PIN"
                required
                maxLength={4}
              />
            </div>
          )}

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              required
            />
            <span className="text-[11px] text-gray-600 leading-relaxed">
              I am the parent or guardian of this child and consent to processing
              their data per CogniLift&apos;s{' '}
              <a href="/privacy" target="_blank" className="text-purple-700 hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
