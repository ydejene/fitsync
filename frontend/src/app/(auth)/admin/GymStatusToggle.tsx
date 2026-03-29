"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";

interface Props {
  gymId: string;
  gymName: string;
  currentStatus: "ACTIVE" | "INACTIVE";
}

export default function GymStatusToggle({ gymId, gymName, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    const newStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = newStatus === "INACTIVE" ? "deactivate" : "reactivate";

    if (
      !confirm(
        `Are you sure you want to ${action} "${gymName}"?${
          newStatus === "INACTIVE"
            ? "\n\nThis will prevent the gym owner from logging in."
            : ""
        }`
      )
    )
      return;

    setLoading(true);
    try {
      const res = await clientFetch(`/api/admin/gyms/${gymId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res?.success) {
        setStatus(newStatus);
        router.refresh();
      } else {
        alert(res?.message || "Failed to update status");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const isActive = status === "ACTIVE";

  // Deactivate = red tint, Reactivate = green tint — both on dark transparent base
  const style = isActive
    ? { color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", background: "transparent" }
    : { color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", background: "transparent" };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isActive ? `Deactivate ${gymName}` : `Reactivate ${gymName}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={style}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLElement).style.background = isActive
            ? "rgba(239,68,68,0.08)"
            : "rgba(34,197,94,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {loading ? (
        <i className="fa-solid fa-spinner animate-spin" />
      ) : (
        <i className={`fa-solid ${isActive ? "fa-ban" : "fa-circle-check"}`} />
      )}
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
