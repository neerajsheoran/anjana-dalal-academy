"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function PasswordReset({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setSending(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError("Failed to send reset email. Try again.");
    }
    setSending(false);
  };

  return (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500 shrink-0">Password</span>
      <div className="flex items-center gap-2">
        {sent ? (
          <span className="text-xs text-green-600">Reset link sent to {email}</span>
        ) : (
          <button
            onClick={handleReset}
            disabled={sending}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Change Password"}
          </button>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
