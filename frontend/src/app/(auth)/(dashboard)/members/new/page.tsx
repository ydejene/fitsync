"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "password123", // Default for now
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = await clientFetch("/api/members", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    if (data.success) {
      router.push("/members");
      router.refresh();
    } else {
      alert(data.message || "Failed to create member");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Register New Member</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-[#E5E5E5] space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full p-2.5 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#F15A24] outline-none"
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full p-2.5 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#F15A24] outline-none"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone Number</label>
          <input
            type="text"
            className="w-full p-2.5 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#F15A24] outline-none"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F15A24] text-white py-3 rounded-lg font-bold hover:bg-[#D94E1F] transition-colors disabled:opacity-50"
        >
          {loading ? "Registering..." : "Create Member Account"}
        </button>
      </form>
    </div>
  );
}