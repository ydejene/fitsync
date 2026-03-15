import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDateTime } from "@/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log" };

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PAYMENT_RECORDED: { label: "Payment Recorded", color: "bg-green-100 text-green-700", icon: "fa-money-bill" },
  PERMISSIONS_UPDATED: { label: "Permissions Updated", color: "bg-blue-100 text-blue-700", icon: "fa-key" },
  MEMBER_CREATED: { label: "Member Created", color: "bg-orange-100 text-[#F15A24]", icon: "fa-user-plus" },
  MEMBER_DEACTIVATED: { label: "Member Deactivated", color: "bg-red-100 text-red-700", icon: "fa-user-slash" },
  MEMBERSHIP_CREATED: { label: "Membership Created", color: "bg-purple-100 text-purple-700", icon: "fa-id-card" },
  LOGIN: { label: "Login", color: "bg-gray-100 text-gray-700", icon: "fa-right-to-bracket" },
};

async function getAuditLogs(page: number) {
  try {
    const result = await apiFetch(`/api/audit?page=${page}`);
    if (!result.success) return { logs: [], total: 0 };
    return result.data;
  } catch (error) {
    console.error("Audit Fetch Error:", error);
    return { logs: [], total: 0 };
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // Audit logs are usually strictly for ADMIN
  await requireAdminOrStaff();

  const page = parseInt(searchParams.page ?? "1");
  const { logs, total } = await getAuditLogs(page);
  const totalPages = Math.ceil(total / 25);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString()} total events recorded
          </p>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fa-solid fa-clipboard-list text-4xl mb-3" />
            <p className="text-sm font-medium">No audit events yet</p>
            <p className="text-xs mt-1">Events will appear here as actions are taken</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Action</th>
                <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Performed By</th>
                <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Entity</th>
                <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Details</th>
                <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {logs.map((log: any) => {
                const meta = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  color: "bg-gray-100 text-gray-700",
                  icon: "fa-circle-dot",
                };
                
                // Parse details from backend snake_case
                const details = log.details; 

                return (
                  <tr key={log.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meta.color}`}>
                        <i className={`fa-solid ${meta.icon}`} />
                        {meta.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{log.actor_name || log.actor_email}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{log.actor_role}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {log.entity_type ? (
                        <div>
                          <p className="font-medium text-gray-700 capitalize">
                            {log.entity_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]">
                            ID: {log.entity_id}
                          </p>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      {details ? (
                        <div className="text-[11px] text-gray-500 space-y-0.5">
                          {Object.entries(details).slice(0, 2).map(([k, v]) => (
                            <p key={k} className="truncate">
                              <span className="font-bold text-gray-600 capitalize">{k}:</span> {String(v)}
                            </p>
                          ))}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E5E5E5] px-5 py-4 bg-[#FAFAFA]">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/audit?page=${page - 1}`} className="px-3 py-1 bg-white border border-[#E5E5E5] rounded text-xs font-medium hover:bg-gray-50">
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a href={`/audit?page=${page + 1}`} className="px-3 py-1 bg-white border border-[#E5E5E5] rounded text-xs font-medium hover:bg-gray-50">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}