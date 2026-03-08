'use client';

import { useState } from 'react';

const ROLES = ['student', 'teacher', 'partner'] as const;

export default function RoleSelector({
  uid,
  currentRole,
}: {
  uid: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function handleChange(newRole: string) {
    if (newRole === role) return;
    setRole(newRole);
    setStatus('saving');

    try {
      const res = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole }),
      });
      if (!res.ok) throw new Error();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setRole(currentRole);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value)}
        disabled={status === 'saving'}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
      {status === 'saving' && <span className="text-xs text-gray-400">Saving...</span>}
      {status === 'saved' && <span className="text-xs text-green-600">Saved</span>}
      {status === 'error' && <span className="text-xs text-red-500">Failed</span>}
    </div>
  );
}
