"use client";

import { useState } from "react";
import ResendVerificationEmail from "./ResendVerificationEmail";

interface BankDetailsFormProps {
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mobile: string | null;
  accountHolder: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankIFSC: string | null;
  pan: string | null;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  );
}

function NotVerifiedBadge({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      {label || "Not Verified"}
    </span>
  );
}

export default function BankDetailsForm({
  email,
  emailVerified,
  phoneVerified,
  mobile,
  accountHolder,
  bankName,
  bankAccount,
  bankIFSC,
  pan,
}: BankDetailsFormProps) {
  const hasDetails = !!(accountHolder || bankName || bankAccount || bankIFSC || pan);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    mobile: mobile || "",
    accountHolder: accountHolder || "",
    bankName: bankName || "",
    bankAccount: bankAccount || "",
    bankIFSC: bankIFSC || "",
    pan: pan || "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/advisor/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      setEditing(false);
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  // Read-only view
  if (!editing) {
    if (!hasDetails && !form.accountHolder && !form.bankName) {
      return (
        <div>
          {/* Email & Mobile (always visible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-medium text-gray-700">{email}</p>
                {emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
              </div>
              {!emailVerified && <ResendVerificationEmail />}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Mobile</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-medium text-gray-700">{form.mobile || "Not provided"}</p>
                {form.mobile && (phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge label="Pending verification" />)}
              </div>
            </div>
          </div>

          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            Bank details are not provided. These are required for commission payouts.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Details
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Email */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-medium text-gray-700">{email}</p>
              {emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
            </div>
            {!emailVerified && <ResendVerificationEmail />}
          </div>
          {/* Mobile */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Mobile</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-medium text-gray-700">{form.mobile || "Not provided"}</p>
              {form.mobile && (phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge label="Pending verification" />)}
            </div>
          </div>
          {/* Bank fields */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Account Holder</p>
            <p className="font-medium text-gray-700 mt-0.5">{form.accountHolder || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Bank Name</p>
            <p className="font-medium text-gray-700 mt-0.5">{form.bankName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Account Number</p>
            <p className="font-medium text-gray-700 mt-0.5">{form.bankAccount || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">IFSC Code</p>
            <p className="font-medium text-gray-700 mt-0.5">{form.bankIFSC || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">PAN</p>
            <p className="font-medium text-gray-700 mt-0.5">{form.pan || "—"}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          {status === "saved" && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-4">
      {/* Email - read only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          {emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
        </div>
        {!emailVerified && <ResendVerificationEmail />}
      </div>
      {/* Mobile - editable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
        <div className="flex items-center gap-2">
          <input
            type="tel"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^0-9+\- ]/g, "") })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. 9876543210"
            maxLength={15}
          />
          {form.mobile && (phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge label="Pending verification" />)}
        </div>
        {!phoneVerified && (
          <p className="text-xs text-gray-400 mt-1">Admin will verify your mobile via call/WhatsApp</p>
        )}
      </div>
      <hr className="border-gray-100" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
        <input
          type="text"
          value={form.accountHolder}
          onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Name as per bank account"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
        <input
          type="text"
          value={form.bankName}
          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. State Bank of India"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
        <input
          type="text"
          value={form.bankAccount}
          onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Account number"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
        <input
          type="text"
          value={form.bankIFSC}
          onChange={(e) => setForm({ ...form, bankIFSC: e.target.value.toUpperCase() })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. SBIN0001234"
          maxLength={11}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
        <input
          type="text"
          value={form.pan}
          onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. ABCDE1234F"
          maxLength={10}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setForm({
              mobile: mobile || "",
              accountHolder: accountHolder || "",
              bankName: bankName || "",
              bankAccount: bankAccount || "",
              bankIFSC: bankIFSC || "",
              pan: pan || "",
            });
            setEditing(false);
          }}
          className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        {status === "error" && <span className="text-sm text-red-500">Failed to save</span>}
      </div>
    </div>
  );
}
