"use client";

/**
 * Subscribe Page — /subscribe
 * Displays B2B subscription plans for gym owners.
 * On plan selection, initiates telebirr payment and redirects to checkout.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_etb: number;
  billing_cycle: string;
  duration_days: number;
  features: string[];
}

export default function SubscribePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Fetch available subscription plans on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/subscription-plans`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPlans(data.data);
        else setError("Failed to load plans");
      })
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false));
  }, [BACKEND_URL]);

  /**
   * Initiates telebirr payment for the selected plan.
   * Calls backend → gets checkout URL → redirects to telebirr payment page.
   */
  async function handleSubscribe(planId: string) {
    setPaying(planId);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/telebirr/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to initiate payment");
        return;
      }

      // Store merchOrderId for status checking on success page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fitsync_merch_order_id", data.data.merchOrderId);
      }

      // Redirect to telebirr checkout page
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      setError("Payment initiation failed. Please try again.");
      console.error("Payment Error:", err);
    } finally {
      setPaying(null);
    }
  }

  /** Formats price with ETB currency */
  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);
  }

  /** Maps billing cycle to human-readable label */
  function cycleLabelMap(cycle: string) {
    const labels: Record<string, string> = {
      MONTHLY: "/month",
      HALF_YEARLY: "/6 months",
      YEARLY: "/year",
    };
    return labels[cycle] || "";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white px-4 py-12 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-text-primary">FitSync</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            Choose Your Plan
          </h1>
          <p className="text-text-secondary max-w-md mx-auto">
            Subscribe to FitSync to unlock your gym management dashboard.
            Pay securely with Telebirr.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`card p-6 flex flex-col ${
                index === 1 ? "ring-2 ring-brand-orange relative !overflow-visible" : ""
              }`}
            >
              {/* Popular badge for middle plan */}
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-text-secondary">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-text-primary">
                  {formatPrice(plan.price_etb)}
                </span>
                <span className="text-text-secondary text-sm">{cycleLabelMap(plan.billing_cycle)}</span>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <i className="fa-solid fa-check text-green-500 text-xs mt-1 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={paying !== null}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all justify-center flex items-center gap-2 ${
                  index === 1
                    ? "bg-brand-orange text-white hover:bg-orange-600"
                    : "bg-gray-100 text-text-primary hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {paying === plan.id ? (
                  <><i className="fa-solid fa-spinner fa-spin text-xs" /> Processing...</>
                ) : (
                  <><i className="fa-solid fa-mobile-screen text-xs" /> Pay with Telebirr</>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted mt-8">
          Secure payment powered by Telebirr • Cancel anytime
        </p>
      </div>
    </div>
  );
}
