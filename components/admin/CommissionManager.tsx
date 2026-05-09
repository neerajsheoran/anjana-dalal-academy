"use client";

import { useState } from "react";

interface AdvisorCommission {
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
  referrals: {
    date: string;
    studentName: string;
    amount: number;
    commission: number;
    paid: boolean;
    paidDate: string;
  }[];
  payouts: {
    date: string;
    amount: number;
    notes: string;
  }[];
}

export default function CommissionManager({
  partners,
}: {
  partners: AdvisorCommission[];
}) {
  const [paying, setPaying] = useState<string | null>(null);
  const [paidPartners, setPaidPartners] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [phoneVerifying, setPhoneVerifying] = useState<string | null>(null);
  const [phoneOverrides, setPhoneOverrides] = useState<Record<string, boolean>>({});

  const handleMarkPaid = async (partner: AdvisorCommission) => {
    if (!confirm(`Mark Rs ${partner.unpaidAmount} as paid to ${partner.partnerName}?`)) {
      return;
    }

    setPaying(partner.partnerUid);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markPaid",
          partnerUid: partner.partnerUid,
          subscriptionIds: partner.unpaidSubscriptionIds,
          amount: partner.unpaidAmount,
          notes: `Payout processed on ${new Date().toLocaleDateString("en-IN")}`,
        }),
      });
      if (res.ok) {
        setPaidPartners((prev) => new Set([...prev, partner.partnerUid]));
      }
    } catch {
      // ignore
    }
    setPaying(null);
  };

  const handlePhoneVerify = async (uid: string, verified: boolean) => {
    setPhoneVerifying(uid);
    try {
      const res = await fetch("/api/admin/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, verified }),
      });
      if (res.ok) {
        setPhoneOverrides((prev) => ({ ...prev, [uid]: verified }));
      }
    } catch {
      // ignore
    }
    setPhoneVerifying(null);
  };

  if (partners.length === 0) {
    return <p className="text-sm text-gray-400">No partner commissions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {partners.map((p) => {
        const isExpanded = expanded === p.partnerUid;
        return (
          <div key={p.partnerUid} className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Summary row */}
            <div
              className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : p.partnerUid)}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.partnerName}</p>
                  <p className="text-xs text-gray-400">
                    {p.totalReferrals} referrals · Total: Rs {p.totalCommission}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {p.unpaidAmount > 0 && !paidPartners.has(p.partnerUid) ? (
                  <>
                    <span className="text-sm font-bold text-amber-600">
                      Rs {p.unpaidAmount}
                    </span>
                    <button
                      onClick={() => handleMarkPaid(p)}
                      disabled={paying === p.partnerUid}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-medium px-3 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {paying === p.partnerUid ? "Processing..." : "Mark Paid"}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-green-600 font-medium">All paid</span>
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                {/* Verification Status */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Verification Status
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      {p.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                          Not Verified
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone {p.phone ? `(${p.phone})` : ""}</p>
                      {(() => {
                        const isVerified = p.partnerUid in phoneOverrides ? phoneOverrides[p.partnerUid] : p.phoneVerified;
                        return (
                          <div className="flex items-center gap-2 mt-1">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                Not Verified
                              </span>
                            )}
                            <button
                              onClick={() => handlePhoneVerify(p.partnerUid, !isVerified)}
                              disabled={phoneVerifying === p.partnerUid}
                              className={`text-xs px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${
                                isVerified
                                  ? "bg-red-50 hover:bg-red-100 text-red-600"
                                  : "bg-green-50 hover:bg-green-100 text-green-700"
                              }`}
                            >
                              {phoneVerifying === p.partnerUid
                                ? "..."
                                : isVerified
                                ? "Mark Unverified"
                                : "Mark Verified"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Bank Details
                  </h4>
                  {p.accountHolder || p.bankName || p.bankAccount || p.bankIFSC || p.pan ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Account Holder</p>
                        <p className="font-medium text-gray-700">{p.accountHolder || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bank</p>
                        <p className="font-medium text-gray-700">{p.bankName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Account</p>
                        <p className="font-medium text-gray-700">{p.bankAccount || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">IFSC</p>
                        <p className="font-medium text-gray-700">{p.bankIFSC || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">PAN</p>
                        <p className="font-medium text-gray-700">{p.pan || "—"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided by partner</p>
                  )}
                </div>

                {/* Referral History */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Referral History
                  </h4>
                  {p.referrals.length === 0 ? (
                    <p className="text-sm text-gray-400">No referrals</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-right">Commission</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.referrals.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="px-3 py-2 text-gray-500">{r.date}</td>
                              <td className="px-3 py-2 text-gray-700">{r.studentName}</td>
                              <td className="px-3 py-2 text-right text-gray-500">Rs {r.amount}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-700">Rs {r.commission}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={`text-xs font-medium ${r.paid ? "text-green-600" : "text-amber-500"}`}>
                                  {r.paid ? "Paid" : "Pending"}
                                </span>
                                {r.paid && r.paidDate && (
                                  <p className="text-[10px] text-gray-400">{r.paidDate}</p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Payout History */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Payout History
                  </h4>
                  {p.payouts.length === 0 ? (
                    <p className="text-sm text-gray-400">No payouts yet</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.payouts.map((pay, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="px-3 py-2 text-gray-500">{pay.date}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-700">Rs {pay.amount}</td>
                              <td className="px-3 py-2 text-gray-400">{pay.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
