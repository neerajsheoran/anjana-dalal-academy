import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import CopyCodeButton from "@/components/partner/CopyCodeButton";

async function getPartner() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login");

  const decoded = await adminAuth.verifySessionCookie(session);
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists) redirect("/login");

  const data = userDoc.data()!;
  if (data.role !== "partner" && data.role !== "admin") redirect("/");

  return {
    uid: decoded.uid,
    name: data.name || "Partner",
    email: data.email || "",
    partnerCode: data.partnerCode || null,
  };
}

async function getReferralCodes(uid: string) {
  try {
    const snap = await adminDb
      .collection("referralCodes")
      .where("partnerUid", "==", uid)
      .get();
    return snap.docs.map((d) => ({
      code: d.id,
      ...d.data(),
      totalUses: (d.data().totalUses as number) || 0,
    }));
  } catch {
    return [];
  }
}

async function getReferralStats(uid: string) {
  try {
    const snap = await adminDb
      .collection("subscriptions")
      .where("referredByUid", "==", uid)
      .get();

    let totalEarnings = 0;
    let pendingPayout = 0;
    let paidOut = 0;
    const referrals: {
      studentUid: string;
      amount: number;
      commission: number;
      paid: boolean;
      date: string;
    }[] = [];

    for (const doc of snap.docs) {
      const d = doc.data();
      const commission = (d.commissionAmountINR as number) || 0;
      totalEarnings += commission;
      if (d.commissionPaid) {
        paidOut += commission;
      } else {
        pendingPayout += commission;
      }
      referrals.push({
        studentUid: d.uid as string,
        amount: (d.amountINR as number) || 0,
        commission,
        paid: d.commissionPaid === true,
        date: d.createdAt?.toDate
          ? d.createdAt.toDate().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
      });
    }

    return {
      totalReferrals: snap.size,
      totalEarnings,
      pendingPayout,
      paidOut,
      referrals: referrals.reverse(),
    };
  } catch {
    return { totalReferrals: 0, totalEarnings: 0, pendingPayout: 0, paidOut: 0, referrals: [] };
  }
}

async function getPayoutHistory(uid: string) {
  try {
    const snap = await adminDb
      .collection("payouts")
      .where("partnerUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        amount: (d.amountINR as number) || 0,
        status: d.status as string,
        date: d.createdAt?.toDate
          ? d.createdAt.toDate().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        notes: (d.notes as string) || "",
      };
    });
  } catch {
    return [];
  }
}

export default async function PartnerDashboardPage() {
  const partner = await getPartner();
  const [codes, stats, payouts] = await Promise.all([
    getReferralCodes(partner.uid),
    getReferralStats(partner.uid),
    getPayoutHistory(partner.uid),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Partner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {partner.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Referrals" value={String(stats.totalReferrals)} color="blue" />
          <StatCard label="Total Earnings" value={`Rs ${stats.totalEarnings}`} color="green" />
          <StatCard label="Pending Payout" value={`Rs ${stats.pendingPayout}`} color="amber" />
          <StatCard label="Paid Out" value={`Rs ${stats.paidOut}`} color="purple" />
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Your Referral Code
          </h2>
          {codes.length === 0 ? (
            <p className="text-sm text-gray-400">
              No referral code assigned yet. Contact admin.
            </p>
          ) : (
            <div className="space-y-3">
              {codes.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3"
                >
                  <div>
                    <span className="text-xl font-bold text-blue-700 font-mono tracking-wider">
                      {c.code}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Used {c.totalUses} times
                    </p>
                  </div>
                  <CopyCodeButton code={c.code} />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Share this code with students. They enter it when subscribing and you earn commission on each payment.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/how-it-works.png"
            alt="How referral works: 1. Copy your code, 2. Share with students, 3. Student subscribes, 4. You earn commission"
            className="w-full"
          />
        </div>

        {/* Referral List */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Referrals
          </h2>
          {stats.referrals.length === 0 ? (
            <p className="text-sm text-gray-400">
              No referrals yet. Share your code to start earning.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.referrals.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm text-gray-500">{r.date}</p>
                    <p className="text-xs text-gray-400">
                      Subscription: Rs {r.amount}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">
                      Rs {r.commission}
                    </p>
                    <p className={`text-xs ${r.paid ? "text-green-500" : "text-amber-500"}`}>
                      {r.paid ? "Paid" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Payout History
          </h2>
          {payouts.length === 0 ? (
            <p className="text-sm text-gray-400">
              No payouts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Rs {p.amount}
                    </p>
                    <p className="text-xs text-gray-400">{p.date}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      p.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className={`${colors[color] || colors.blue} rounded-xl p-4 text-center`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

