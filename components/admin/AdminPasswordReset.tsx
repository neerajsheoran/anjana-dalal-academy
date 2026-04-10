"use client";

import { useState } from "react";

export default function AdminPasswordReset({ uid, userEmail }: { uid: string; userEmail: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch {
      setError("Failed to send reset email");
    }
    setSending(false);
  };

  return (
    <div className="flex items-center gap-3">
      {sent ? (
        <span className="text-sm text-green-600">
          Password reset email sent to {userEmail}
        </span>
      ) : (
        <button
          onClick={handleReset}
          disabled={sending}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Password Reset Email"}
        </button>
      )}
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
