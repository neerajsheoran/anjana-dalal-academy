'use client';

import { useState } from 'react';

export default function ApplicationActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'approved' | 'rejected' | 'error'>('idle');

  async function handleAction(action: 'approve' | 'reject') {
    setStatus('loading');
    try {
      const res = await fetch('/api/admin/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action }),
      });
      if (!res.ok) throw new Error();
      setStatus(action === 'approve' ? 'approved' : 'rejected');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  if (status === 'approved') {
    return <span className="text-xs font-medium text-green-600">Approved</span>;
  }
  if (status === 'rejected') {
    return <span className="text-xs font-medium text-red-500">Rejected</span>;
  }
  if (status === 'error') {
    return <span className="text-xs text-red-500">Failed</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={status === 'loading'}
        className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={status === 'loading'}
        className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
