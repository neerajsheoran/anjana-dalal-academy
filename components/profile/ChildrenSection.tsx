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
  LogIn,
  CheckCircle2,
  X,
  Pencil,
  Lock,
} from 'lucide-react';
import { CLASS_OPTIONS } from '@/lib/age-group';

// Indian convention: Class N maps to roughly age N+5 (Class 1 ≈ 6,
// Class 10 ≈ 15). The parent only enters class now; the form computes
// the kid's age for the existing age-gated activity logic and the
// adaptive engine. Decided 2026-06-13 to drop the explicit Age field
// at signup — it was duplicate friction (parent has to think about
// both class and age) and every consumer of `age` works fine with the
// derived value.
function ageFromClass(classId: string | null | undefined): number {
  if (!classId) return 6; // safe default — Class 1 / age 6
  const m = /^class-(\d+)$/.exec(classId);
  if (!m) return 6;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n + 5 : 6;
}

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
  const [editClassId, setEditClassId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Add-form state
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [consent, setConsent] = useState(false);
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
    setClassId('');
    setConsent(false);
    setError('');
    setShowAdd(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!hasPin) return setError('Set your parent PIN above before adding a child.');
    if (!name.trim()) return setError('Please enter a first name.');
    if (!classId) return setError('Please select your child’s class.');
    const ageNum = ageFromClass(classId);
    if (!consent) return setError('Please confirm parental consent.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          age: ageNum,
          classId,
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
      // Success → land on / (KidHomepage), the kid's single home base.
      // Same destination as tapping the site logo in kid mode, so there's
      // one consistent landing screen in kid mode.
      router.push('/');
      router.refresh();
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Something went wrong');
      setSwitchSubmitting(false);
    }
  }

  function startEdit(child: Child) {
    setEditingChildId(child.id);
    setEditName(child.name);
    // Prefer the stored class. If a legacy child only has age, infer
    // class from age so the dropdown lands on something sensible.
    const inferredClass =
      child.classId ||
      (child.age >= 6 && child.age <= 15 ? `class-${child.age - 5}` : '');
    setEditClassId(inferredClass);
    setEditError('');
  }

  function cancelEdit() {
    setEditingChildId(null);
    setEditName('');
    setEditClassId('');
    setEditError('');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChildId) return;
    setEditError('');

    if (!editName.trim()) return setEditError('Name is required.');
    if (!editClassId) return setEditError('Please select a class.');
    const ageNum = ageFromClass(editClassId);

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/children/${editingChildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          age: ageNum,
          classId: editClassId,
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
    <div
      id="children"
      className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6 scroll-mt-24"
    >
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
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-5xl sm:text-6xl shadow-inner">
            🧒
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full ${hasPin ? "bg-brand" : "bg-gray-400"} text-white flex items-center justify-center text-base font-bold shadow-md`}>
              {hasPin ? "+" : <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </div>
          </div>
          <p className="text-sm text-ink mb-1">No child profiles yet</p>
          {hasPin ? (
            <>
              <p className="text-xs text-ink-light mb-4">
                Add your first child profile to start brain training
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" strokeWidth={2.5} />
                Add your child profile
              </button>
            </>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 inline-block px-3 py-2 rounded-lg mt-1">
              <Lock className="inline w-3 h-3 mr-1 -mt-0.5" strokeWidth={2.5} />
              Set your parent PIN above first
            </p>
          )}
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
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      required
                    >
                      <option value="">Select class</option>
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
              Add another child profile
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
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              required
            >
              <option value="">Select class</option>
              {CLASS_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink-light mt-1">
              We use the class to match academic content and age-appropriate games.
            </p>
          </div>

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
