import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPlatformConfig } from '@/lib/subscription';
import { redirect } from 'next/navigation';
import ApplicationActions from '@/components/admin/ApplicationActions';
import PlatformConfigEditor from '@/components/admin/PlatformConfigEditor';
import CommissionManager from '@/components/admin/CommissionManager';
import UserTable from '@/components/admin/UserTable';

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

async function getAllUsers() {
  const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    const now = new Date();

    // Determine subscription status
    let subStatus = 'none';
    if (d.role === 'admin') {
      subStatus = 'admin';
    } else if (d.adminExtendedUntil?.toDate?.() > now) {
      subStatus = 'extended';
    } else if (d.subscriptionEndsAt?.toDate?.() > now) {
      subStatus = 'active';
    } else if (d.trialEndsAt?.toDate?.() > now) {
      subStatus = 'trial';
    } else if (d.trialEndsAt) {
      subStatus = 'expired';
    }

    return {
      uid: doc.id,
      name: (d.name as string) || '—',
      email: (d.email as string) || '—',
      role: (d.role as string) || 'student',
      subStatus,
      createdAt: d.createdAt?.toDate
        ? d.createdAt.toDate().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
      isDeleted: d.deleted === true,
    };
  });
}

async function getCommissionData() {
  try {
    const snap = await adminDb.collection('subscriptions').where('commissionAmountINR', '>', 0).get();
    const partnerMap = new Map<string, {
      partnerUid: string;
      partnerName: string;
      totalReferrals: number;
      totalCommission: number;
      unpaidAmount: number;
      unpaidSubscriptionIds: string[];
    }>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const pUid = d.referredByUid as string;
      if (!pUid) continue;

      if (!partnerMap.has(pUid)) {
        // Look up partner name
        const pDoc = await adminDb.collection('users').doc(pUid).get();
        partnerMap.set(pUid, {
          partnerUid: pUid,
          partnerName: (pDoc.data()?.name as string) || pUid,
          totalReferrals: 0,
          totalCommission: 0,
          unpaidAmount: 0,
          unpaidSubscriptionIds: [],
        });
      }

      const entry = partnerMap.get(pUid)!;
      entry.totalReferrals++;
      entry.totalCommission += (d.commissionAmountINR as number) || 0;
      if (!d.commissionPaid) {
        entry.unpaidAmount += (d.commissionAmountINR as number) || 0;
        entry.unpaidSubscriptionIds.push(doc.id);
      }
    }

    return Array.from(partnerMap.values());
  } catch {
    return [];
  }
}

async function getAllApplications() {
  try {
    const snapshot = await adminDb.collection('partnerApplications').get();
    const all = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) || '—',
          email: (d.email as string) || '—',
          phone: (d.phone as string) || '—',
          city: (d.city as string) || '—',
          reason: (d.reason as string) || '',
          status: (d.status as string) || 'pending',
          createdAt: d.createdAt?.toDate
            ? d.createdAt.toDate().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—',
          _time: d.createdAt?.toMillis?.() ?? 0,
        };
      })
      .sort((a, b) => b._time - a._time);

    return {
      pending: all.filter((a) => a.status === 'pending'),
      processed: all.filter((a) => a.status !== 'pending'),
      total: all.length,
    };
  } catch {
    return { pending: [], processed: [], total: 0 };
  }
}

export default async function AdminPage() {
  await requireAdmin();
  const [users, applications, config, commissions] = await Promise.all([
    getAllUsers(),
    getAllApplications(),
    getPlatformConfig(),
    getCommissionData(),
  ]);

  const activeUsers = users.filter((u) => !u.isDeleted);
  const totalUsers = activeUsers.length;
  const byRole = {
    student: activeUsers.filter((u) => u.role === 'student').length,
    teacher: activeUsers.filter((u) => u.role === 'teacher').length,
    partner: activeUsers.filter((u) => u.role === 'partner').length,
    admin: activeUsers.filter((u) => u.role === 'admin').length,
  };
  const bySub = {
    trial: activeUsers.filter((u) => u.subStatus === 'trial').length,
    active: activeUsers.filter((u) => u.subStatus === 'active' || u.subStatus === 'extended').length,
    expired: activeUsers.filter((u) => u.subStatus === 'expired').length,
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Students" value={byRole.student} />
          <StatCard label="Teachers" value={byRole.teacher} />
          <StatCard label="Partners" value={byRole.partner} />
          <StatCard label="Applications" value={applications.total} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="On Trial" value={bySub.trial} />
          <StatCard label="Subscribed" value={bySub.active} />
          <StatCard label="Expired" value={bySub.expired} />
        </div>

        {/* Platform Configuration */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Platform Configuration
          </h2>
          <PlatformConfigEditor initialConfig={{
            trialDays: config.trialDays,
            yearlyPriceINR: config.yearlyPriceINR,
            commissionPercent: config.commissionPercent,
          }} />
        </div>

        {/* User table */}
        <UserTable users={users} />

        {/* Partner Applications — Pending */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Pending Applications
            </h2>
            {applications.pending.length > 0 && (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {applications.pending.length} pending
              </span>
            )}
          </div>

          {applications.pending.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400">No pending applications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.pending.map((app) => (
                <div key={app.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{app.name}</p>
                      <p className="text-xs text-gray-400">
                        {app.email} · {app.phone} · {app.city}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{app.reason}</p>
                      <p className="text-xs text-gray-300 mt-1">{app.createdAt}</p>
                    </div>
                    <div className="shrink-0">
                      <ApplicationActions applicationId={app.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partner Applications — Processed */}
        {applications.processed.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                Application History
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {applications.processed.map((app) => (
                <div key={app.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{app.name}</p>
                      <p className="text-xs text-gray-400">
                        {app.email} · {app.phone} · {app.city}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">{app.createdAt}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      app.status === 'approved'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {app.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Agent Commissions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Agent Commissions
          </h2>
          <CommissionManager partners={commissions} />
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
