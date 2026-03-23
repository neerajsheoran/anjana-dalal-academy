import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) redirect('/login');

  const decoded = await adminAuth.verifySessionCookie(session);
  const userDoc = await adminDb.collection('users').doc(decoded.uid).get();

  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    redirect('/');
  }
}

interface Props {
  params: Promise<{ uid: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  await requireAdmin();
  const { uid } = await params;

  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin" className="text-sm text-blue-500 hover:underline mb-4 inline-block">
            &larr; Back to Dashboard
          </Link>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400">User not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const d = userDoc.data()!;
  const now = new Date();

  // User info
  const user = {
    uid,
    name: (d.name as string) || '—',
    email: (d.email as string) || '—',
    role: (d.role as string) || 'student',
    isDeleted: d.deleted === true,
    createdAt: d.createdAt?.toDate?.()
      ? d.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—',
    trialEndsAt: d.trialEndsAt?.toDate?.()
      ? d.trialEndsAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null,
    subscriptionEndsAt: d.subscriptionEndsAt?.toDate?.()
      ? d.subscriptionEndsAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null,
    adminExtendedUntil: d.adminExtendedUntil?.toDate?.()
      ? d.adminExtendedUntil.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null,
    partnerCode: (d.partnerCode as string) || null,
  };

  // Determine subscription status
  let subStatus = 'none';
  if (d.role === 'admin') subStatus = 'admin';
  else if (d.adminExtendedUntil?.toDate?.() > now) subStatus = 'extended';
  else if (d.subscriptionEndsAt?.toDate?.() > now) subStatus = 'active';
  else if (d.trialEndsAt?.toDate?.() > now) subStatus = 'trial';
  else if (d.trialEndsAt) subStatus = 'expired';

  // Fetch related data in parallel
  const [subscriptions, quizAttempts, progressDocs, adminLogs] = await Promise.all([
    adminDb.collection('subscriptions').where('uid', '==', uid).get(),
    adminDb.collection(`users/${uid}/quizAttempts`).orderBy('completedAt', 'desc').limit(20).get().catch(() => null),
    adminDb.collection(`users/${uid}/progress`).get().catch(() => null),
    adminDb.collection('adminLogs').where('targetUid', '==', uid).orderBy('createdAt', 'desc').limit(20).get().catch(() => null),
  ]);

  const subs = subscriptions.docs.map((doc) => {
    const s = doc.data();
    return {
      id: doc.id,
      planId: (s.planId as string) || 'yearly',
      amountINR: (s.amountINR as number) || 0,
      referralCode: (s.referralCode as string) || null,
      createdAt: s.createdAt?.toDate?.()
        ? s.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    };
  });

  const quizzes = quizAttempts?.docs.map((doc) => {
    const q = doc.data();
    return {
      id: doc.id,
      quizId: (q.quizId as string) || '—',
      score: (q.score as number) || 0,
      total: (q.total as number) || 0,
      completedAt: q.completedAt?.toDate?.()
        ? q.completedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    };
  }) || [];

  const progressCount = progressDocs?.docs.length || 0;

  const logs = adminLogs?.docs.map((doc) => {
    const l = doc.data();
    return {
      id: doc.id,
      action: (l.action as string) || '—',
      details: (l.details as string) || '',
      createdAt: l.createdAt?.toDate?.()
        ? l.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—',
    };
  }) || [];

  const statusStyles: Record<string, string> = {
    admin: 'bg-blue-50 text-blue-600',
    active: 'bg-green-50 text-green-600',
    extended: 'bg-green-50 text-green-600',
    trial: 'bg-amber-50 text-amber-600',
    expired: 'bg-red-50 text-red-500',
    none: 'bg-gray-50 text-gray-400',
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="text-sm text-blue-500 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {user.isDeleted && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                  Deleted
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[subStatus] || statusStyles.none}`}>
                {subStatus.charAt(0).toUpperCase() + subStatus.slice(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Role</p>
              <p className="font-medium text-gray-700 capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Joined</p>
              <p className="font-medium text-gray-700">{user.createdAt}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">UID</p>
              <p className="font-medium text-gray-700 text-xs break-all">{user.uid}</p>
            </div>
            {user.partnerCode && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Partner Code</p>
                <p className="font-medium text-gray-700">{user.partnerCode}</p>
              </div>
            )}
          </div>

          {/* Subscription dates */}
          {(user.trialEndsAt || user.subscriptionEndsAt || user.adminExtendedUntil) && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {user.trialEndsAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Trial Ends</p>
                  <p className="font-medium text-gray-700">{user.trialEndsAt}</p>
                </div>
              )}
              {user.subscriptionEndsAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Subscription Ends</p>
                  <p className="font-medium text-gray-700">{user.subscriptionEndsAt}</p>
                </div>
              )}
              {user.adminExtendedUntil && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Admin Extended Until</p>
                  <p className="font-medium text-gray-700">{user.adminExtendedUntil}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-gray-800">{subs.length}</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Payments</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-gray-800">{quizzes.length}</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Quizzes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-2xl font-bold text-gray-800">{progressCount}</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Lessons Done</p>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Payment History
            </h2>
          </div>
          {subs.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-sm text-gray-400">No payments.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {subs.map((sub) => (
                <div key={sub.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700 capitalize">{sub.planId}</span>
                    {sub.referralCode && (
                      <span className="ml-2 text-xs text-gray-400">via {sub.referralCode}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-700">&#8377;{sub.amountINR}</span>
                    <span className="ml-3 text-xs text-gray-400">{sub.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Attempts */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Recent Quiz Attempts
            </h2>
          </div>
          {quizzes.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-sm text-gray-400">No quiz attempts.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {quizzes.map((q) => (
                <div key={q.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <span className="text-gray-700">{q.quizId}</span>
                  <div className="text-right">
                    <span className="font-medium text-gray-700">{q.score}/{q.total}</span>
                    <span className="ml-3 text-xs text-gray-400">{q.completedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Admin Actions
            </h2>
          </div>
          {logs.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-sm text-gray-400">No admin actions recorded.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.details && (
                      <span className="ml-2 text-gray-400">{log.details}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{log.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
