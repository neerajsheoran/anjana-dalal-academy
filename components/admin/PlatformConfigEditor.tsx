"use client";

import { useState } from "react";
import type { ContentAuthorPermissions } from "@/lib/types";

interface PlatformConfigEditorProps {
  initialConfig: {
    trialDays: number;
    yearlyPriceINR: number;
    commissionPercent: number;
    referralDiscountPercent: number;
    contentAuthorPermissions: ContentAuthorPermissions;
  };
}

const PERMISSION_LABELS: { key: keyof ContentAuthorPermissions; label: string; description: string }[] = [
  { key: "viewUsers", label: "View Users", description: "Can see the Users tab (read-only)" },
  { key: "manageUsers", label: "Manage Users", description: "Can change roles, delete, and extend subscriptions" },
  { key: "viewSystemFlows", label: "View System Flows", description: "Can see the System Flows documentation tab" },
  { key: "viewConfiguration", label: "View Configuration", description: "Can see the Configuration tab" },
  { key: "viewAdvisors", label: "View Advisors", description: "Can see the Advisors tab" },
];

export default function PlatformConfigEditor({ initialConfig }: PlatformConfigEditorProps) {
  const [trialDays, setTrialDays] = useState(initialConfig.trialDays);
  const [yearlyPriceINR, setYearlyPriceINR] = useState(initialConfig.yearlyPriceINR);
  const [commissionPercent, setCommissionPercent] = useState(initialConfig.commissionPercent);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(initialConfig.referralDiscountPercent);
  const [permissions, setPermissions] = useState<ContentAuthorPermissions>(initialConfig.contentAuthorPermissions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePermission = (key: keyof ContentAuthorPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
          contentAuthorPermissions: permissions,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
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

      {/* Content Author Permissions */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Content Author Permissions
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Control what Content Authors can see on the Dashboard page.
        </p>
        <div className="space-y-3">
          {PERMISSION_LABELS.map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={permissions[key]}
                onChange={() => togglePermission(key)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {label}
                </span>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
            </label>
          ))}
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
