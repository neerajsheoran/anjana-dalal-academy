"use client";

import { useState } from "react";
import Script from "next/script";

interface CheckoutButtonProps {
  userName?: string;
  userEmail?: string;
  amount: number;
  isLoggedIn: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function CheckoutButton({ userName, userEmail, amount, isLoggedIn }: CheckoutButtonProps) {
  const [referralCode, setReferralCode] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    discountPercent: number;
  } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "valid" | "invalid">("idle");

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setCodeStatus("idle");
      setDiscountInfo(null);
      return;
    }
    setValidatingCode(true);
    try {
      const res = await fetch("/api/subscription/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCodeStatus("valid");
        setDiscountInfo({
          originalAmount: data.originalAmount,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          discountPercent: data.discountPercent,
        });
      } else {
        setCodeStatus("invalid");
        setDiscountInfo(null);
      }
    } catch {
      setCodeStatus("invalid");
      setDiscountInfo(null);
    }
    setValidatingCode(false);
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login?from=/pricing";
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create order
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create order");
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "Anjana Dalal Academy",
        description: "Yearly Subscription — All Classes",
        order_id: orderData.orderId,
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        theme: { color: "#2563EB" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify payment
          try {
            const verifyRes = await fetch("/api/subscription/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                referralCode: orderData.referralCode || undefined,
              }),
            });

            if (verifyRes.ok) {
              setSuccess(true);
              setTimeout(() => {
                window.location.href = "/profile";
              }, 2000);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Payment verification failed. Please contact support.");
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 font-semibold px-6 py-3 rounded-xl text-lg">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Payment Successful! Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Referral Code */}
      {!showReferral ? (
        <button
          onClick={() => setShowReferral(true)}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Have a referral code? Get a discount!
        </button>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                setCodeStatus("idle");
                setDiscountInfo(null);
              }}
              placeholder="Enter referral code"
              className={`flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                codeStatus === "valid"
                  ? "border-green-400 focus:ring-green-500"
                  : codeStatus === "invalid"
                  ? "border-red-400 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <button
              onClick={() => validateReferralCode(referralCode)}
              disabled={validatingCode || !referralCode.trim()}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {validatingCode ? "..." : "Apply"}
            </button>
            <button
              onClick={() => { setShowReferral(false); setReferralCode(""); setCodeStatus("idle"); setDiscountInfo(null); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              Clear
            </button>
          </div>
          {codeStatus === "valid" && discountInfo && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <p className="text-sm text-green-700 font-semibold">
                {discountInfo.discountPercent}% discount applied! You save Rs {discountInfo.discountAmount}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                <span className="line-through">Rs {discountInfo.originalAmount}</span>{" "}
                <span className="font-bold">Rs {discountInfo.finalAmount}/year</span>
              </p>
            </div>
          )}
          {codeStatus === "invalid" && (
            <p className="mt-2 text-sm text-red-500">Invalid or expired referral code.</p>
          )}
        </div>
      )}

      {/* Subscribe Button */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
      >
        {loading
          ? "Processing..."
          : isLoggedIn
          ? `Subscribe — Rs ${discountInfo ? discountInfo.finalAmount : amount}/year`
          : "Sign Up to Subscribe"}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
