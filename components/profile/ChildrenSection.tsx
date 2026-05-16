'use client';

// Profile section for managing child brain-training profiles.
// Per cognilift-privacy-consent.md: parent owns the account, kids never log in.

import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  RotateCcw,
  Trash2,
  Brain as BrainIcon,
} from 'lucide-react';
import {
  CLASS_OPTIONS,
  suggestClassFromAge,
} from '@/lib/age-group';

interface Child {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  classId: string | null;
  createdAt: string | null;
}

const CLASS_LABEL: Record<string, string> = Object.fromEntries(
  CLASS_OPTIONS.map((o) => [o.id, o.label]),
);

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
  const [classId, setClassId] = useState('');
  const [classManuallyChanged, setClassManuallyChanged] = useState(false);
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
    setClassId('');
    setClassManuallyChanged(false);
    setConsent(false);
    setPin('');
    setPinConfirm('');
    setError('');
    setShowAdd(false);
  }

  function handleAgeChange(value: string) {
    setAge(value);
    // Auto-suggest class from age unless the parent has already picked one
    if (!classManuallyChanged) {
      const ageNum = parseInt(value, 10);
      if (Number.isInteger(ageNum)) {
        const suggested = suggestClassFromAge(ageNum);
        setClassId(suggested);
      }
    }
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
        body: JSON.stringify({
          name: name.trim(),
          age: ageNum,
          classId: classId || null,
          consent,
        }),
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
      `Permanently delete ${child.name}'s profile and all training history? This cannot be undone.`
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

  async function handleReset(child: Child) {
    const confirmed = window.confirm(
      `Clear all training history for ${child.name}? Their profile stays — progress just starts fresh.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/children/${child.id}/attempts`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      await refresh();
    } catch {
      window.alert('Failed to reset progress. Please try again.');
    }
  }

  return (
    <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-brand" strokeWidth={2} />
        <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest">
          Your Children
        </h2>
      </div>

      {loading && <p className="text-sm text-ink-light">Loading…</p>}

      {!loading && children !== null && children.length === 0 && !showAdd && (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-xl bg-cream border border-warm-line flex items-center justify-center mx-auto mb-3">
            <BrainIcon className="w-6 h-6 text-brand" strokeWidth={2} />
          </div>
          <p className="text-sm text-ink mb-1">No children added yet</p>
          <p className="text-xs text-ink-light mb-4">
            Add your first child to start brain training
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2.5} />
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
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cool-line"
              >
                <div className="w-10 h-10 rounded-full bg-cream border border-warm-line text-brand font-bold flex items-center justify-center shrink-0">
                  {child.name[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{child.name}</p>
                  <p className="text-xs text-ink-light">
                    Age {child.age}
                    {child.classId && ` · ${CLASS_LABEL[child.classId] || child.classId}`}
                    {' · '}
                    {AGE_GROUP_LABEL[child.ageGroup] || child.ageGroup}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleReset(child)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                    aria-label={`Reset progress for ${child.name}`}
                    title="Clear training history, keep profile"
                  >
                    <RotateCcw className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => handleDelete(child)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    aria-label={`Remove ${child.name}`}
                    title="Permanently delete profile + history"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full inline-flex items-center justify-center gap-2 text-brand hover:bg-cream font-medium text-sm py-2 rounded-lg transition-colors border border-dashed border-warm-line"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.25} />
              Add another child
            </button>
          )}
        </>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 bg-cream border border-warm-line p-4 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              First name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              placeholder="e.g. Aanya"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              min={5}
              max={15}
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              placeholder="5–15"
              required
            />
            <p className="text-[11px] text-ink-light mt-1">
              Must be between 5 and 15. Used to choose age-appropriate games.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              School class <span className="text-ink-light">(optional)</span>
            </label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setClassManuallyChanged(true);
              }}
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Not in CBSE / homeschooled</option>
              {CLASS_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink-light mt-1">
              We&apos;ll suggest matching academic content for this class.
            </p>
          </div>

          {!hasPin && (
            <div className="bg-white p-3 rounded-lg border border-warm-line space-y-2">
              <p className="text-xs font-semibold text-brand">
                Set a 4-digit Parent PIN
              </p>
              <p className="text-[11px] text-ink-soft leading-relaxed">
                Used when switching to a child profile. Prevents your child from
                changing settings or accessing payment screens.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
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
                className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
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
              className="mt-0.5 h-4 w-4 rounded border-cool-line text-brand focus:ring-brand"
              required
            />
            <span className="text-[11px] text-ink-soft leading-relaxed">
              I am the parent or guardian of this child and consent to processing
              their data per CogniLift&apos;s{' '}
              <a href="/privacy" target="_blank" className="text-brand hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
