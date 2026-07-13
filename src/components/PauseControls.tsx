"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PauseButton({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/students/${studentId}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Pause (Holiday)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 mt-3">
      <p className="font-medium text-sm">Set Pause Period</p>
      <p className="text-xs text-gray-500">
        Reminders will stop during this window. Due date auto-adjusts by the pause length
        when it ends (or when you resume early).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start Date</label>
          <input
            className="input"
            name="startDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <label className="label">End Date</label>
          <input className="input" name="endDate" type="date" required />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Confirm Pause"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ResumeNowButton({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResume() {
    if (!confirm("End the pause now and resume reminders? This will advance their due date by the days already paused.")) return;
    setLoading(true);
    await fetch(`/api/students/${studentId}/resume`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary" disabled={loading} onClick={handleResume}>
      {loading ? "Resuming..." : "Resume Now"}
    </button>
  );
}

export function CancelPauseButton({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Undo this pause completely, as if it was never entered? No due-date change will be made.")) return;
    setLoading(true);
    await fetch(`/api/students/${studentId}/pause`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
      disabled={loading}
      onClick={handleCancel}
    >
      {loading ? "Undoing..." : "Undo Pause (mistake)"}
    </button>
  );
}
