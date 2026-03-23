"use client";

import { useState } from "react";

interface PlatformConfigEditorProps {
  initialConfig: {
    trialDays: number;
    yearlyPriceINR: number;
    commissionPercent: number;
    referralDiscountPercent: number;
  };
}

export default function PlatformConfigEditor({ initialConfig }: PlatformConfigEditorProps) {
  const [trialDays, setTrialDays] = useState(initialConfig.trialDays);
  const [yearlyPriceINR, setYearlyPriceINR] = useState(initialConfig.yearlyPriceINR);
  const [commissionPercent, setCommissionPercent] = useState(initialConfig.commissionPercent);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(initialConfig.referralDiscountPercent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateConfig",
          trialDays,
          yearlyPriceINR,
          commissionPercent,
          referralDiscountPercent,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Trial Period (days)
          </label>
          <input
            type="number"
            value={trialDays}
            onChange={(e) => setTrialDays(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Yearly Price (INR)
          </label>
          <input
            type="number"
            value={yearlyPriceINR}
            onChange={(e) => setYearlyPriceINR(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Commission (%)
          </label>
          <input
            type="number"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Referral Discount (%)
          </label>
          <input
            type="number"
            value={referralDiscountPercent}
            onChange={(e) => setReferralDiscountPercent(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}
