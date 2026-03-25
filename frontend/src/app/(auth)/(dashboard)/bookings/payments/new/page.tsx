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

interface Membership {
  id: string;
  plan_name: string;
  price_etb: number;
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    memberId: "",
    membershipId: "",
    amountEtb: "",
    paymentMethod: "TELEBIRR",
    transactionRef: "",
    notes: "",
  });

  useEffect(() => {
    clientFetch("/api/members")
      .then((d) => setMembers(d.data?.members ?? []));
  }, []);

  useEffect(() => {
    if (!form.memberId) return;
    clientFetch(`/api/memberships?memberId=${form.memberId}`)
      .then((d) => {
        const list = d.data?.memberships ?? [];
        setMemberships(list);
        if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            membershipId: list[0].id,
            amountEtb: String(list[0].price_etb || ""),
          }));
        }
      });
  }, [form.memberId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.memberId || !form.membershipId || !form.amountEtb) {
      setError("Member, membership and amount are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await clientFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amountEtb: parseFloat(form.amountEtb),
        }),
      });
      if (!data.success) throw new Error(data.message);
      router.push("/payments");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Record Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new payment transaction</p>
        </div>
        <Link href="/payments" className="btn-secondary">
          <i className="fa-solid fa-arrow-left" />
          Back to Payments
        </Link>
      </div>

      <div className="card max-w-2xl">
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
              name="memberId"
              value={form.memberId}
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

          {/* Membership */}
          <div>
            <label className="label">Membership Plan *</label>
            <select
              name="membershipId"
              value={form.membershipId}
              onChange={handleChange}
              className="input"
              disabled={!form.memberId}
            >
              <option value="">
                {form.memberId ? "Select membership" : "Select a member first"}
              </option>
              {memberships.map((ms) => (
                <option key={ms.id} value={ms.id}>
                  {ms.plan_name} — ETB {Number(ms.price_etb).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (ETB) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                ETB
              </span>
              <input
                type="number"
                name="amountEtb"
                value={form.amountEtb}
                onChange={handleChange}
                className="input pl-12"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Payment Method *</label>
            <div className="grid grid-cols-3 gap-3">
              {["TELEBIRR", "CBE_BIRR", "CASH"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, paymentMethod: method }))}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    form.paymentMethod === method
                      ? "border-[#F15A24] bg-[#FFF0EB] text-[#F15A24]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {method === "TELEBIRR"
                    ? "Telebirr"
                    : method === "CBE_BIRR"
                    ? "CBE Birr"
                    : "Cash"}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="label">
              Transaction Reference
              <span className="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="transactionRef"
              value={form.transactionRef}
              onChange={handleChange}
              className="input font-mono"
              placeholder="e.g. TXN-2026-00123"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              Notes
              <span className="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input resize-none"
              rows={3}
              placeholder="Any additional notes about this payment..."
            />
          </div>

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
                  Recording...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" />
                  Record Payment
                </>
              )}
            </button>
            <Link href="/payments" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}