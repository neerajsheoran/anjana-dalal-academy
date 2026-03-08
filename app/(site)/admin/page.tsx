import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import RoleSelector from '@/components/admin/RoleSelector';
import ApplicationActions from '@/components/admin/ApplicationActions';

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
    return {
      uid: doc.id,
      name: (d.name as string) || '—',
      email: (d.email as string) || '—',
      role: (d.role as string) || 'student',
      createdAt: d.createdAt?.toDate
        ? d.createdAt.toDate().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
    };
  });
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
  const users = await getAllUsers();
  const applications = await getAllApplications();

  const totalUsers = users.length;
  const byRole = {
    student: users.filter((u) => u.role === 'student').length,
    teacher: users.filter((u) => u.role === 'teacher').length,
    partner: users.filter((u) => u.role === 'partner').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Students" value={byRole.student} />
          <StatCard label="Teachers" value={byRole.teacher} />
          <StatCard label="Partners" value={byRole.partner} />
          <StatCard label="Applications" value={applications.total} />
        </div>

        {/* User table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              All Users
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-3 text-gray-500">{user.email}</td>
                    <td className="px-6 py-3">
                      {user.role === 'admin' ? (
                        <span className="text-sm font-medium text-blue-600">Admin</span>
                      ) : (
                        <RoleSelector uid={user.uid} currentRole={user.role} />
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400">{user.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.uid} className="px-6 py-4">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-400 mb-2">{user.email}</p>
                <div className="flex items-center justify-between">
                  {user.role === 'admin' ? (
                    <span className="text-sm font-medium text-blue-600">Admin</span>
                  ) : (
                    <RoleSelector uid={user.uid} currentRole={user.role} />
                  )}
                  <span className="text-xs text-gray-400">{user.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
