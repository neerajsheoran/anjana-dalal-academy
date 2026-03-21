"use client";

import { useState } from "react";

interface PartnerCommission {
  partnerUid: string;
  partnerName: string;
  totalReferrals: number;
  totalCommission: number;
  unpaidAmount: number;
  unpaidSubscriptionIds: string[];
}

export default function CommissionManager({
  partners,
}: {
  partners: PartnerCommission[];
}) {
  const [paying, setPaying] = useState<string | null>(null);
  const [paidPartners, setPaidPartners] = useState<Set<string>>(new Set());

  const handleMarkPaid = async (partner: PartnerCommission) => {
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

  if (partners.length === 0) {
    return <p className="text-sm text-gray-400">No partner commissions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {partners.map((p) => (
        <div
          key={p.partnerUid}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{p.partnerName}</p>
            <p className="text-xs text-gray-400">
              {p.totalReferrals} referrals · Total: Rs {p.totalCommission}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
      ))}
    </div>
  );
}
