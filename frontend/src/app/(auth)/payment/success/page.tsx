"use client";

/**
 * Payment Success Page — /payment/success
 * Shown after telebirr redirects the user back to our site.
 * Polls the backend for payment confirmation, then shows success + dashboard link.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "failed">("checking");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const merchOrderId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("fitsync_merch_order_id")
        : null;

    if (!merchOrderId) {
      setStatus("pending");
      return;
    }

    // Poll for payment status (webhook may take a few seconds)
    let attempts = 0;
    const maxAttempts = 10;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/telebirr/status/${merchOrderId}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.success && data.data.subscriptionStatus === "active") {
          setStatus("success");
          setSubscriptionEnd(data.data.subscriptionEnd || "");
          clearInterval(pollInterval);
          sessionStorage.removeItem("fitsync_merch_order_id");
        } else if (data.success && data.data.paymentStatus === "failed") {
          setStatus("failed");
          clearInterval(pollInterval);
        }
      } catch {
        // Silent retry
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (status === "checking") setStatus("pending");
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [BACKEND_URL, status]);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center mb-6">
          <img src="/logo.png" alt="FitSync Logo" className="h-10 w-auto object-contain" />
        </Link>

        <div className="card p-8">
          {/* Checking status */}
          {status === "checking" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-brand-orange" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Finalizing Your Payment...
              </h2>
              <p className="text-sm text-text-secondary">
                Please wait while we confirm your payment with Telebirr.
              </p>
            </div>
          )}

          {/* Payment successful */}
          {status === "success" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <i className="fa-solid fa-check text-2xl text-green-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-green-700">
                Payment Successful!
              </h2>
              <p className="text-sm text-text-secondary">
                Your subscription is now active. Welcome to FitSync!
              </p>
              {subscriptionEnd && (
                <p className="text-xs text-text-muted">
                  Active until: {new Date(subscriptionEnd).toLocaleDateString("en-ET", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </p>
              )}
              <button
                onClick={() => router.push("/insights")}
                className="btn-primary w-full justify-center py-3 mt-4"
              >
                <i className="fa-solid fa-gauge-high text-xs" /> Go to Insights
              </button>
            </div>
          )}

          {/* Payment pending (webhook not yet received) */}
          {status === "pending" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-clock text-2xl text-yellow-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Payment Processing
              </h2>
              <p className="text-sm text-text-secondary">
                Your payment is being processed. This may take a moment.
                Your dashboard will unlock automatically once confirmed.
              </p>
              <button
                onClick={() => router.push("/insights")}
                className="btn-primary w-full justify-center py-3 mt-4"
              >
                <i className="fa-solid fa-gauge-high text-xs" /> Go to Insights
              </button>
            </div>
          )}

          {/* Payment failed */}
          {status === "failed" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-xmark text-2xl text-red-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-red-700">
                Payment Failed
              </h2>
              <p className="text-sm text-text-secondary">
                Your payment could not be processed. Please try again.
              </p>
              <button
                onClick={() => router.push("/subscribe")}
                className="btn-primary w-full justify-center py-3 mt-4"
              >
                <i className="fa-solid fa-redo text-xs" /> Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Secure payment powered by Telebirr
        </p>
      </div>
    </div>
  );
}
