'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  async function createSession(idToken: string) {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error('Session creation failed');
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        await sendEmailVerification(credential.user);
        // Sign out immediately — don't create session until email is verified
        await auth.signOut();
        setVerificationSent(true);
        setLoading(false);
        return;
      }
      // Login flow
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        // Email not verified yet — resend verification and block login
        await sendEmailVerification(credential.user);
        await auth.signOut();
        setError('Please verify your email first. We\'ve sent a new verification link to ' + email + '.');
        setLoading(false);
        return;
      }
      const idToken = await credential.user.getIdToken();
      await createSession(idToken);
      window.location.href = from;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password.');
      } else if (msg.includes('email-already-in-use')) {
        // Check which provider the email is registered with
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
            setError('This email is already registered via Google. Please use the "Continue with Google" button above.');
          } else {
            setError('This email is already registered. Please log in.');
          }
        } catch {
          setError('This email is already registered. Please log in.');
        }
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      await createSession(idToken);
      window.location.href = from;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setResetSent(false);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setError('No account found with this email address.');
      } else if (methods.includes('google.com') && !methods.includes('password')) {
        setError('This account uses Google Sign-In. Please use the "Continue with Google" button above.');
      } else {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch {
      setError('Could not send reset email. Check your email address.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="CogniLift" className="h-16 w-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-blue-700">CogniLift</h1>
          <p className="text-gray-500 text-sm mt-1">Clear Concepts · Strong Foundations</p>
        </div>

        {/* Verification sent screen */}
        {verificationSent && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Check your email</h2>
            <p className="text-sm text-gray-500">
              We&apos;ve sent a verification link to <span className="font-semibold text-gray-700">{email}</span>.
              Click the link to activate your account.
            </p>
            <p className="text-xs text-gray-400">
              After verifying, come back here and log in.
            </p>
            <button
              onClick={() => { setVerificationSent(false); setMode('login'); }}
              className="mt-4 bg-blue-600 text-white rounded-xl py-3 px-6 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Log In
            </button>
          </div>
        )}

        {/* Tab toggle */}
        {!verificationSent && <><div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-white shadow text-blue-700' : 'text-gray-500'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'signup' ? 'bg-white shadow text-blue-700' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or use email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {mode === 'login' && (
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {resetSent && (
            <p className="text-green-600 text-sm text-center">
              Password reset link sent to {email}
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
        </>}
      </div>
    </main>
  );
}
