'use client';

// Parent PIN management — set, change, view status.
// Lives between Account Details and Children on /profile.
//
// First-time setup: just enter a new PIN twice.
// Change: enter the current PIN, then a new one twice.
//
// (Forgot-PIN reset via re-auth is deferred — see cognilift-shipped.md.)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';

export default function PinSection({ hasPinInitial }: { hasPinInitial: boolean }) {
  const router = useRouter();
  const [hasPin, setHasPin] = useState(hasPinInitial);
  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function reset() {
    setOpen(false);
    setCurrentPin('');
    setNewPin('');
    setNewPinConfirm('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (hasPin && !/^\d{4}$/.test(currentPin)) {
      return setError('Enter your current 4-digit PIN.');
    }
    if (!/^\d{4}$/.test(newPin)) {
      return setError('New PIN must be exactly 4 digits.');
    }
    if (newPin !== newPinConfirm) {
      return setError('New PINs do not match.');
    }
    if (hasPin && newPin === currentPin) {
      return setError('New PIN must be different from current.');
    }

    setSubmitting(true);
    try {
      const body: { pin: string; currentPin?: string } = { pin: newPin };
      if (hasPin) body.currentPin = currentPin;

      const res = await fetch('/api/children/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save PIN');
      }
      setHasPin(true);
      setSuccessMessage(
        hasPinInitial ? 'PIN updated successfully.' : 'PIN set successfully.',
      );
      reset();
      // Refresh server components so the rest of the profile sees hasPin = true
      router.refresh();
      // Auto-clear the success notice
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-brand" strokeWidth={2} />
        <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest">
          Parent PIN
        </h2>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-cream border border-warm-line flex items-center justify-center shrink-0">
          {hasPin ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {hasPin ? (
            <>
              <p className="text-sm font-semibold text-ink">
                PIN is active
              </p>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Required when switching between profiles or exiting kid mode.
                Stops your child from changing settings.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">
                No PIN set
              </p>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Set a 4-digit PIN to gate switching between profiles. Without
                it, anyone using this device can enter any child profile or exit
                kid mode.
              </p>
            </>
          )}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={2.5} />
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
        )}
      </div>

      {successMessage && (
        <p className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
          {successMessage}
        </p>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 bg-cream border border-warm-line p-4 rounded-xl"
        >
          {hasPin && (
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Current PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={currentPin}
                onChange={(e) =>
                  setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white tracking-widest"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              New PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white tracking-widest"
              placeholder="4-digit PIN"
              maxLength={4}
              required
              autoFocus={!hasPin}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Confirm new PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              value={newPinConfirm}
              onChange={(e) =>
                setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="w-full border border-cool-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white tracking-widest"
              placeholder="4-digit PIN"
              maxLength={4}
              required
            />
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : hasPin ? 'Update PIN' : 'Save PIN'}
            </button>
            <button
              type="button"
              onClick={reset}
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
