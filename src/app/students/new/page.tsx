"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      contact: form.get("contact"),
      email: form.get("email") || null,
      joiningDate: form.get("joiningDate"),
      monthlyFee: Number(form.get("monthlyFee")),
      notes: form.get("notes") || null,
    };

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const student = await res.json();
      router.push(`/students/${student.id}`);
      router.refresh();
    } else {
      setError("Something went wrong. Please check the fields and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-lg font-bold mb-4">Add Student</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="label">Parent/Guardian Contact (phone)</label>
          <input className="input" name="contact" required />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input className="input" name="email" type="email" />
        </div>
        <div>
          <label className="label">Joining Date</label>
          <input className="input" name="joiningDate" type="date" required />
        </div>
        <div>
          <label className="label">Monthly Fee (₹)</label>
          <input className="input" name="monthlyFee" type="number" min="0" required />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input" name="notes" rows={3} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save Student"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
