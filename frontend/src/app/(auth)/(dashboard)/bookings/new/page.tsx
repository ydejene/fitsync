"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

export default function AddClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    instructorName: "",
    location: "",
    scheduledAt: "",
    durationMinutes: "60",
    capacity: "20",
    batch: "MORNING",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.instructorName || !form.scheduledAt) {
      setError("Class name, instructor and schedule are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await clientFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          instructor: form.instructorName,
          location: form.location,
          scheduleAt: form.scheduledAt,
          durationMin: parseInt(form.durationMinutes),
          capacity: parseInt(form.capacity),
        }),
      });
      if (!data.success) throw new Error(data.message);
      router.push("/bookings");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Class</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule a new fitness class</p>
        </div>
        <Link href="/bookings" className="btn-secondary">
          <i className="fa-solid fa-arrow-left" />
          Back to Classes
        </Link>
      </div>

      <div className="card w-full p-6 mt-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Class Name */}
            <div>
              <label className="label">Class Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Morning Yoga"
              />
            </div>            

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input resize-none"
              rows={3}
              placeholder="Brief description of the class..."
            />
          </div>

          {/* Instructor & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Instructor Name *</label>
              <input
                type="text"
                name="instructorName"
                value={form.instructorName}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Selam Tadesse"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Studio A, Main Hall"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <select
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={handleChange}
                className="input"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
          </div>

          {/* Capacity & Batch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max Capacity</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                className="input"
                min="1"
                max="200"
              />
            </div>
            <div>
              <label className="label">Batch</label>
              <select
                name="batch"
                value={form.batch}
                onChange={handleChange}
                className="input"
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
              </select>
            </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus" />
                  Create Class
                </>
              )}
            </button>
            <Link href="/bookings" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}