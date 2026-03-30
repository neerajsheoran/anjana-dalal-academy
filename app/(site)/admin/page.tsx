import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPlatformConfig } from '@/lib/subscription';
import { redirect } from 'next/navigation';
import ApplicationActions from '@/components/admin/ApplicationActions';
import PlatformConfigEditor from '@/components/admin/PlatformConfigEditor';
import CommissionManager from '@/components/admin/CommissionManager';
import UserTable from '@/components/admin/UserTable';
import AdminTabs from '@/components/admin/AdminTabs';
import SystemFlows from '@/components/admin/SystemFlows';

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
      accountHolder: string | null;
      bankName: string | null;
      bankAccount: string | null;
      bankIFSC: string | null;
      pan: string | null;
      phone: string | null;
      emailVerified: boolean;
      phoneVerified: boolean;
      referrals: { date: string; studentName: string; amount: number; commission: number; paid: boolean; paidDate: string }[];
      payouts: { date: string; amount: number; notes: string }[];
    }>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const pUid = d.referredByUid as string;
      if (!pUid) continue;

      if (!partnerMap.has(pUid)) {
        // Look up advisor info
        const pDoc = await adminDb.collection('users').doc(pUid).get();
        const pData = pDoc.data();

        // Look up phone from partner application
        let phone: string | null = null;
        const pEmail = (pData?.email as string) || '';
        if (pEmail) {
          const appSnap = await adminDb
            .collection('partnerApplications')
            .where('email', '==', pEmail)
            .limit(1)
            .get();
          if (!appSnap.empty) {
            phone = (appSnap.docs[0].data().phone as string) || null;
          }
        }

        partnerMap.set(pUid, {
          partnerUid: pUid,
          partnerName: (pData?.name as string) || pUid,
          totalReferrals: 0,
          totalCommission: 0,
          unpaidAmount: 0,
          unpaidSubscriptionIds: [],
          accountHolder: (pData?.accountHolder as string) || null,
          bankName: (pData?.bankName as string) || null,
          bankAccount: (pData?.bankAccount as string) || null,
          bankIFSC: (pData?.bankIFSC as string) || null,
          pan: (pData?.pan as string) || null,
          phone,
          emailVerified: pData?.emailVerified === true,
          phoneVerified: pData?.phoneVerified === true,
          referrals: [],
          payouts: []
        });
      }

      const entry = partnerMap.get(pUid)!;
      entry.totalReferrals++;
      const commission = (d.commissionAmountINR as number) || 0;
      entry.totalCommission += commission;

      // Look up student name
      let studentName = 'Student';
      if (d.uid) {
        const studentDoc = await adminDb.collection('users').doc(d.uid as string).get();
        if (studentDoc.exists) {
          studentName = (studentDoc.data()?.name as string) || 'Student';
        }
      }

      entry.referrals.push({
        date: d.createdAt?.toDate
          ? d.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—',
        studentName,
        amount: (d.amountINR as number) || 0,
        commission,
        paid: d.commissionPaid === true,
        paidDate: d.commissionPaidAt?.toDate
          ? d.commissionPaidAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
      });

      if (!d.commissionPaid) {
        entry.unpaidAmount += commission;
        entry.unpaidSubscriptionIds.push(doc.id);
      }
    }

    // Fetch payout history for each advisor
    for (const [uid, entry] of partnerMap) {
      try {
        const payoutSnap = await adminDb
          .collection('payouts')
          .where('partnerUid', '==', uid)
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();
        entry.payouts = payoutSnap.docs.map((pd) => {
          const p = pd.data();
          return {
            date: p.createdAt?.toDate
              ? p.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—',
            amount: (p.amountINR as number) || 0,
            notes: (p.notes as string) || '',
          };
        });
      } catch {
        // payouts query might fail if no index exists yet
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
    'content-author': activeUsers.filter((u) => u.role === 'content-author').length,
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
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-4">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Students" value={byRole.student} />
          <StatCard label="Teachers" value={byRole.teacher} />
          <StatCard label="Advisors" value={byRole.partner} />
          <StatCard label="Content Authors" value={byRole['content-author']} />
          <StatCard label="Applications" value={applications.total} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="On Trial" value={bySub.trial} />
          <StatCard label="Subscribed" value={bySub.active} />
          <StatCard label="Expired" value={bySub.expired} />
        </div>

        <AdminTabs
          usersTab={<UserTable users={users} />}
          configTab={
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Platform Configuration
              </h2>
              <PlatformConfigEditor initialConfig={{
                trialDays: config.trialDays,
                yearlyPriceINR: config.yearlyPriceINR,
                commissionPercent: config.commissionPercent,
                referralDiscountPercent: config.referralDiscountPercent,
              }} />
            </div>
          }
          advisorsTab={
            <>
              {/* Pending Applications */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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

              {/* Application History */}
              {applications.processed.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6">
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
              <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Advisor Commissions
                </h2>
                <CommissionManager partners={commissions} />
              </div>
            </>
          }
          flowsTab={<SystemFlows />}
        />
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
