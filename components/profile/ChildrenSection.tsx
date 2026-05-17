'use client';

// Profile section for managing child brain-training profiles.
// Per cognilift-privacy-consent.md: parent owns the account, kids never log in.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  RotateCcw,
  Trash2,
  Brain as BrainIcon,
  LogIn,
  CheckCircle2,
  X,
  Pencil,
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
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [hasPin, setHasPin] = useState(hasPinInitial);
  const [justAddedChildName, setJustAddedChildName] = useState<string | null>(null);
  const [justAddedChildId, setJustAddedChildId] = useState<string | null>(null);

  // Switch-to-child state. When `switchTarget` is set, an inline PIN prompt
  // appears below the children list (only needed when a PIN is set).
  const [switchTarget, setSwitchTarget] = useState<Child | null>(null);
  const [switchPin, setSwitchPin] = useState('');
  const [switchSubmitting, setSwitchSubmitting] = useState(false);
  const [switchError, setSwitchError] = useState('');

  // Edit-child state. The row whose id matches `editingChildId` renders an
  // inline edit form instead of the normal display.
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

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

  // Sync local hasPin with the prop. When PinSection sets a PIN and calls
  // router.refresh(), the parent server component re-renders with the new
  // hasPinInitial value — without this sync, ChildrenSection's local state
  // stays stale and the add-child form would re-prompt for a PIN that's
  // already set (which the API then rejects, blocking child creation).
  useEffect(() => {
    setHasPin(hasPinInitial);
  }, [hasPinInitial]);

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

      // Capture the new child so we can offer a one-tap "Switch to {name}"
      // banner. Without this, the parent has to navigate to /kids to start
      // training the kid they just added.
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      setJustAddedChildName(name.trim());
      setJustAddedChildId(data.id || null);

      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // Triggered by the "Switch" row button OR the post-add banner CTA. If no
  // PIN is set, the swap is immediate. Otherwise we surface an inline PIN
  // prompt (same flow as /kids).
  function handleSwitchClick(child: Child) {
    setSwitchError('');
    setSwitchPin('');
    if (!hasPin) {
      doSwitch(child.id, '');
      return;
    }
    setSwitchTarget(child);
  }

  async function doSwitch(childId: string, pinValue: string) {
    setSwitchSubmitting(true);
    setSwitchError('');
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
      // Success → land on /brain where training happens. Refresh so the
      // server components see the new active-child cookie.
      router.push('/brain');
      router.refresh();
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Something went wrong');
      setSwitchSubmitting(false);
    }
  }

  function startEdit(child: Child) {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditAge(String(child.age));
    setEditClassId(child.classId || '');
    setEditError('');
  }

  function cancelEdit() {
    setEditingChildId(null);
    setEditName('');
    setEditAge('');
    setEditClassId('');
    setEditError('');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChildId) return;
    setEditError('');

    const ageNum = parseInt(editAge, 10);
    if (!editName.trim()) return setEditError('Name is required.');
    if (!Number.isInteger(ageNum) || ageNum < 5 || ageNum > 15) {
      return setEditError('Age must be a whole number between 5 and 15.');
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/children/${editingChildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          age: ageNum,
          classId: editClassId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update profile');
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleSwitchPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!switchTarget) return;
    if (!/^\d{4}$/.test(switchPin)) {
      setSwitchError('PIN must be 4 digits');
      return;
    }
    doSwitch(switchTarget.id, switchPin);
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

      {/* Post-add success banner: one-tap switch into the kid we just made */}
      {justAddedChildName && justAddedChildId && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              Added {justAddedChildName}
            </p>
            <p className="text-xs text-emerald-700">
              Switch to their profile to start training, or stay here to add more.
            </p>
          </div>
          <button
            onClick={() => {
              const child = children?.find((c) => c.id === justAddedChildId);
              if (child) handleSwitchClick(child);
            }}
            disabled={switchSubmitting}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
            Switch
          </button>
          <button
            onClick={() => {
              setJustAddedChildName(null);
              setJustAddedChildId(null);
            }}
            className="text-emerald-700 hover:bg-emerald-100 rounded p-1 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Inline PIN prompt for switching (only shown if a PIN is set) */}
      {switchTarget && (
        <form
          onSubmit={handleSwitchPinSubmit}
          className="mb-4 bg-cream border border-warm-line rounded-xl p-4"
        >
          <p className="text-sm font-semibold text-ink mb-1">
            Enter your parent PIN to switch to {switchTarget.name}
          </p>
          <p className="text-xs text-ink-soft mb-3">
            Kid mode hides parent settings and payment screens.
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            value={switchPin}
            onChange={(e) =>
              setSwitchPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white tracking-widest mb-2"
            placeholder="••••"
            maxLength={4}
            autoFocus
            required
          />
          {switchError && (
            <p className="text-red-600 text-xs mb-2">{switchError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={switchSubmitting}
              className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {switchSubmitting ? 'Switching…' : `Switch to ${switchTarget.name}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setSwitchTarget(null);
                setSwitchPin('');
                setSwitchError('');
              }}
              disabled={switchSubmitting}
              className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
            {children.map((child) =>
              editingChildId === child.id ? (
                <form
                  key={child.id}
                  onSubmit={saveEdit}
                  className="bg-cream border border-warm-line rounded-xl p-4 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      min={5}
                      max={15}
                      className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      required
                    />
                    <p className="text-[11px] text-ink-light mt-1">
                      Used to choose age-appropriate games.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      School class <span className="text-ink-light">(optional)</span>
                    </label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                    >
                      <option value="">Not in CBSE / homeschooled</option>
                      {CLASS_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editError && <p className="text-red-600 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {editSubmitting ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={editSubmitting}
                      className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={child.id}
                  className="rounded-xl bg-white border border-cool-line overflow-hidden"
                >
                  {/* Top: avatar + identity (info only, no actions) */}
                  <div className="flex items-center gap-3 p-3">
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
                  </div>
                  {/* Bottom: 4-column action row (icon + label).
                      Labels are always visible — readable on mobile/tablet
                      where hover tooltips don't exist. */}
                  <div className="grid grid-cols-4 border-t border-cool-line text-[11px] sm:text-xs">
                    <button
                      onClick={() => handleSwitchClick(child)}
                      disabled={switchSubmitting}
                      className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-brand hover:bg-cream transition-colors border-r border-cool-line disabled:opacity-40"
                      aria-label={`Switch to ${child.name}'s profile`}
                    >
                      <LogIn className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                      Switch
                    </button>
                    <button
                      onClick={() => startEdit(child)}
                      className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-ink-soft hover:bg-cream transition-colors border-r border-cool-line"
                      aria-label={`Edit ${child.name}`}
                    >
                      <Pencil className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleReset(child)}
                      className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-amber-600 hover:bg-amber-50 transition-colors border-r border-cool-line"
                      aria-label={`Reset progress for ${child.name}`}
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                      Reset
                    </button>
                    <button
                      onClick={() => handleDelete(child)}
                      className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${child.name}`}
                    >
                      <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                      Remove
                    </button>
                  </div>
                </div>
              )
            )}
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
