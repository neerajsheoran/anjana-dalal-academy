'use client';

import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ResendVerificationEmail() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleResend() {
    if (!auth.currentUser) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await sendEmailVerification(auth.currentUser);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p className="text-xs text-green-600 mt-1">
        Verification email sent! Check your inbox and click the link.
      </p>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={status === 'sending'}
      className="text-xs text-blue-600 hover:text-blue-700 underline mt-1 disabled:opacity-50"
    >
      {status === 'sending' ? 'Sending…' : status === 'error' ? 'Failed — try again' : 'Resend verification email'}
    </button>
  );
}
