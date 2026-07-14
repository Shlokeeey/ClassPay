"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HolidayForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ studentsAffected: number } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        note: form.get("note") || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setResult({ studentsAffected: data.studentsAffected });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="font-medium text-sm">Declare Institute Holiday</p>
      <p className="text-xs text-gray-500">
        This pushes every currently Active student's due date forward by the length of the
        holiday, all at once. This is the only thing that can move a due date off the joining-date
        cycle.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Start Date</label>
          <input className="input" name="startDate" type="date" required />
        </div>
        <div>
          <label className="label">End Date</label>
          <input className="input" name="endDate" type="date" required />
        </div>
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input className="input" name="note" placeholder="e.g. Diwali break" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Applied — {result.studentsAffected} active student(s) had their due date shifted.
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Applying..." : "Apply to All Active Students"}
      </button>
    </form>
  );
}
