"use client";

import { useState } from "react";

export default function EditableName({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === currentName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500 shrink-0">Full Name</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{name || "—"}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit name"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {saved && <span className="text-xs text-green-600">Saved!</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500 shrink-0">Full Name</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
          maxLength={100}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setEditing(false); setName(currentName || ""); }
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setName(currentName || ""); }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
