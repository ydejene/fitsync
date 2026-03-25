import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import InsightsCharts from "./InsightsCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Insights | FitSync" };

async function getInsightsData() {
  try {
    const result = await apiFetch("/api/insights");
    if (!result.success) throw new Error(result.message || "Failed to fetch insights");
    return result.data;
  } catch (error) {
    console.error("Insights Fetch Error:", error);
    return null;
  }
}

export default async function InsightsPage() {
  await requireAdminOrStaff();
  const data = await getInsightsData();

  if (!data) {
    return (
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <i className="fa-solid fa-chart-pie text-2xl text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Insights Unavailable</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please ensure the backend is running and you have the required permissions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Understand your gym&apos;s performance at a glance
          </p>
        </div>
      </div>

      <InsightsCharts data={data} />
    </div>
  );
}
