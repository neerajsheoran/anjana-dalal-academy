"use client";

import { useState } from "react";

export default function SubscriptionExtender({ uid, userName }: { uid: string; userName: string }) {
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleExtend = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extendTrial", uid, extendDays: days }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(`Extended until ${new Date(data.extendedUntil).toLocaleDateString("en-IN")}`);
      } else {
        setResult("Failed");
      }
    } catch {
      setResult("Error");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
        min={1}
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
