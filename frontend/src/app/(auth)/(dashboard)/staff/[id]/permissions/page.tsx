"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";
import type { StaffPermissions } from "@/types";

const defaultPermissions: StaffPermissions = {
  canManageMembers: true,
  canManagePayments: false,
  canManageBookings: true,
  canViewReports: false,
  canManagePlans: false,
};

const permissionLabels: Record<keyof StaffPermissions, { label: string; desc: string; icon: string }> = {
  canManageMembers: { label: "Manage Members", desc: "Add, edit, and deactivate member accounts", icon: "fa-users" },
  canManagePayments: { label: "Manage Payments", desc: "Record and modify payment transactions", icon: "fa-money-bill-wave" },
  canManageBookings: { label: "Manage Bookings", desc: "Create, cancel, and update class bookings", icon: "fa-calendar-days" },
  canViewReports: { label: "View Reports", desc: "Access financial reports and export data", icon: "fa-chart-line" },
  canManagePlans: { label: "Manage Plans", desc: "Create and update membership plan details", icon: "fa-id-card" },
};

export default function StaffPermissionsPage() {
  const params = useParams();
  const [staffName, setStaffName] = useState("Staff Member");
  const [permissions, setPermissions] = useState<StaffPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    clientFetch(`/api/staff/${params.id}/permissions`)
      .then((result) => {
        if (result.success) {
          // Map backend keys to frontend camelCase keys
          const p = result.data.permissions || {};
          setPermissions({
            canManageMembers: p.canManageMembers ?? p.manageMembers ?? false,
            canManagePayments: p.canManagePayments ?? p.managePayments ?? false,
            canManageBookings: p.canManageBookings ?? p.manageBookings ?? false,
            canViewReports: p.canViewReports ?? p.viewReports ?? false,
            canManagePlans: p.canManagePlans ?? p.managePlans ?? false,
          });
        }
      })
      .catch(err => console.error("Error loading permissions:", err));
  }, [params.id]);

  async function handleSave() {
    setLoading(true);
    try {
      const data = await clientFetch(`/api/staff/${params.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
      });
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      alert("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: keyof StaffPermissions) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="max-w-xl">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">Staff Permissions</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{staffName}</p>
        </div>
        <Link href="/staff" className="flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#F15A24]">
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to Staff
        </Link>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#F0F0F0]">
        {(Object.keys(permissionLabels) as Array<keyof StaffPermissions>).map((key) => {
          const meta = permissionLabels[key];
          return (
            <div key={key} className="flex items-center justify-between px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F8F8F8] flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${meta.icon} text-[#F15A24] text-sm`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{meta.label}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{meta.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
                  permissions[key] ? "bg-[#F15A24]" : "bg-[#E5E5E5]"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    permissions[key] ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-8">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
          ) : saved ? (
            <><i className="fa-solid fa-check" /> Permissions Saved</>
          ) : (
            <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
          )}
        </button>
        <Link href="/staff" className="text-sm font-bold text-[#6B6B6B] px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-all">
          Cancel
        </Link>
      </div>
    </div>
  );
}