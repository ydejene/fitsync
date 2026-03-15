"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

interface Member {
  id: string;
  full_name: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  name_am: string;
  price_etb: number;
  billing_cycle: string;
  duration_days: number;
  features: string[];
}

export default function NewMembershipPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    userId: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    batch: "MORNING",
  });

  useEffect(() => {
    clientFetch("/api/members")
      .then((d) => setMembers(d.data?.members ?? []));
    clientFetch("/api/memberships/plans")
      .then((d) => setPlans(d.data?.plans ?? []));
  }, []);

  // Auto-calculate end date when plan or start date changes
  useEffect(() => {
    if (!form.planId || !form.startDate) return;
    const plan = plans.find((p) => p.id === form.planId);
    if (plan) {
      const start = new Date(form.startDate);
      start.setDate(start.getDate() + plan.duration_days);
      setForm((prev) => ({ ...prev, endDate: start.toISOString().split("T")[0] }));
    }
  }, [form.planId, form.startDate, plans]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const selectedPlan = plans.find((p) => p.id === form.planId);

  const handleSubmit = async () => {
    setError("");
    if (!form.userId || !form.planId || !form.startDate || !form.endDate) {
      setError("Member, plan, start date and end date are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await clientFetch("/api/memberships", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!data.success) throw new Error(data.message);
      router.push("/memberships");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create membership.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Membership</h1>
          <p className="text-sm text-gray-500 mt-1">Enroll a member in a plan</p>
        </div>
        <Link href="/memberships" className="btn-secondary">
          <i className="fa-solid fa-arrow-left" />
          Back to Memberships
        </Link>
      </div>

      <div className="card max-w-2xl p-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Member */}
          <div>
            <label className="label">Member *</label>
            <select
              name="userId"
              value={form.userId}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select a member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="label">Membership Plan *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, planId: plan.id }))}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    form.planId === plan.id
                      ? "border-[#F15A24] bg-[#FFF0EB]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-bold text-[#1A1A1A]">{plan.name}</p>
                  {plan.name_am && (
                    <p className="text-xs text-gray-400">{plan.name_am}</p>
                  )}
                  <p className="text-lg font-bold text-[#F15A24] mt-2">
                    ETB {Number(plan.price_etb).toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">
                    {plan.billing_cycle} · {plan.duration_days} days
                  </p>
                  {plan.features?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <i className="fa-solid fa-check text-green-500 text-[8px]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="input"
              />
              {selectedPlan && (
                <p className="text-xs text-gray-400 mt-1">
                  Auto-calculated: {selectedPlan.duration_days} days from start
                </p>
              )}
            </div>
          </div>

          {/* Batch */}
          <div>
            <label className="label">Preferred Batch *</label>
            <div className="grid grid-cols-3 gap-3">
              {["MORNING", "AFTERNOON", "EVENING"].map((batch) => (
                <button
                  key={batch}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, batch }))}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    form.batch === batch
                      ? "border-[#F15A24] bg-[#FFF0EB] text-[#F15A24]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {batch === "MORNING"
                    ? "☀️ Morning"
                    : batch === "AFTERNOON"
                    ? "🌤️ Afternoon"
                    : "🌙 Evening"}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedPlan && form.userId && (
            <div className="rounded-xl bg-[#F8F8F8] border border-[#E5E5E5] p-4">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <span className="font-bold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Amount Due</span>
                <span className="font-bold text-[#F15A24]">
                  ETB {Number(selectedPlan.price_etb).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Duration</span>
                <span className="font-bold">{selectedPlan.duration_days} days</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">
                Payment status will be set to UNPAID. Record a payment after creating this membership.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-id-card" />
                  Create Membership
                </>
              )}
            </button>
            <Link href="/memberships" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
