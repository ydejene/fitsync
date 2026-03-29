"use client";

import { clientFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Plan {
  id: string;
  name: string;
  price_etb: number;
  billing_cycle: string;
  duration_days: number;
}

interface Props {
  memberId: string;
  memberName: string;
}

export default function RenewMembershipDialog({ memberId, memberName }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [batch, setBatch] = useState<"MORNING" | "AFTERNOON" | "EVENING">("MORNING");

  // Compute end date based on selected plan
  const selectedPlan = plans.find((p) => p.id === planId);
  const endDate = selectedPlan
    ? (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + selectedPlan.duration_days);
        return d.toISOString().split("T")[0];
      })()
    : "";

  // Fetch plans when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    clientFetch<{ plans: Plan[] }>("/api/memberships/plans")
      .then((res) => {
        if (res.success && res.data?.plans) {
          setPlans(res.data.plans);
          if (res.data.plans.length > 0) setPlanId(res.data.plans[0].id);
        } else {
          setError("Failed to load plans.");
        }
      })
      .catch(() => setError("Network error loading plans."))
      .finally(() => setLoading(false));
  }, [open]);

  // Open / close the native <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  function handleClose() {
    setOpen(false);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) return setError("Please select a plan.");
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await clientFetch("/api/memberships", {
        method: "POST",
        body: JSON.stringify({
          userId: memberId,
          planId,
          startDate,
          endDate,
          batch,
        }),
      });

      if (res.success) {
        setSuccess("Membership renewed successfully!");
        setTimeout(() => {
          handleClose();
          router.refresh(); // re-fetch server component data
        }, 1200);
      } else {
        setError(res.message || "Failed to renew membership.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[#F15A24] text-white rounded-lg text-sm font-medium hover:bg-[#D94E1F] transition-colors"
      >
        Renew Membership
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="fixed inset-0 m-auto w-full max-w-lg h-fit rounded-2xl border border-[#E5E5E5] p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Renew Membership</h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">
                for <span className="font-medium text-[#1A1A1A]">{memberName}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#6B6B6B] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#6B6B6B]">Loading plans…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Plan selection */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Select Plan</label>
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        planId === plan.id
                          ? "border-[#F15A24] bg-orange-50"
                          : "border-[#E5E5E5] bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={planId === plan.id}
                        onChange={() => setPlanId(plan.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        planId === plan.id ? "border-[#F15A24]" : "border-gray-300"
                      }`}>
                        {planId === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A24]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1A1A1A]">{plan.name}</span>
                          <span className="text-[#F15A24] font-bold">
                            {plan.price_etb?.toLocaleString()} ETB
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">
                          {plan.billing_cycle} · {plan.duration_days} days
                        </p>
                      </div>
                    </label>
                  ))}
                  {plans.length === 0 && !loading && (
                    <p className="text-sm text-[#9CA3AF] text-center py-4">No active plans available.</p>
                  )}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24]/30 focus:border-[#F15A24]"
                />
              </div>

              {/* End date (computed, read-only) */}
              {endDate && (
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">End Date</label>
                  <div className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-gray-50 text-sm text-[#6B6B6B]">
                    {new Date(endDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              {/* Batch / Time slot */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Preferred Batch</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["MORNING", "AFTERNOON", "EVENING"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBatch(b)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        batch === b
                          ? "bg-[#F15A24] text-white"
                          : "bg-gray-100 text-[#6B6B6B] hover:bg-gray-200"
                      }`}
                    >
                      {b.charAt(0) + b.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedPlan && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#9CA3AF]">Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Plan</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Duration</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedPlan.duration_days} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Period</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" → "}
                      {new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-[#1A1A1A]">Total</span>
                    <span className="font-bold text-[#F15A24] text-lg">
                      {selectedPlan.price_etb?.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#6B6B6B] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !planId}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#F15A24] text-white text-sm font-semibold hover:bg-[#D94E1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {submitting ? "Renewing…" : "Confirm Renewal"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
