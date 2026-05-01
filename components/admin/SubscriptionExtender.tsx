"use client";

import { useState } from "react";

export default function SubscriptionExtender({ uid, userName }: { uid: string; userName: string }) {
  // Default to 30 days from today
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const [extendDate, setExtendDate] = useState(defaultDate.toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleExtend = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extendTrial", uid, extendUntil: extendDate }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(`Until ${new Date(data.extendedUntil).toLocaleDateString("en-IN")}`);
      } else {
        setResult("Failed");
      }
    } catch {
      setResult("Error");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={extendDate}
        min={minDate}
        onChange={(e) => setExtendDate(e.target.value)}
        className="border border-gray-300 rounded px-1.5 py-1 text-xs bg-white"
      />
      <button
        onClick={handleExtend}
        disabled={saving}
        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-2 py-1 rounded transition-colors disabled:opacity-50"
        title={`Extend access for ${userName}`}
      >
        {saving ? "..." : "Extend"}
      </button>
      {result && <span className="text-xs text-green-600">{result}</span>}
    </div>
  );
}
